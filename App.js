import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase';
import { registerForPushNotifications, scheduleDailyReminder } from './lib/notifications';
import { navigationRef, navigateAndReset } from './lib/navigationRef';

import AuthScreen from './screens/AuthScreen';
import ChatScreen from './screens/ChatScreen';
import HomeScreen from './screens/HomeScreen';
import JournalScreen from './screens/JournalScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ProfileScreen from './screens/ProfileScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import SplashScreen from './screens/SplashScreen';

const Stack = createNativeStackNavigator();

// ─── Auth state flags ────────────────────────────────────────────────────────
// These prevent onAuthStateChange from interfering during
// manual deep-link handling flows.
global.__lumaidSigningUp       = false;  // set true during sign-up form submit
global.__lumaidHandlingDeepLink = false; // set true while processing a deep link

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isEmailVerified(session) {
  if (!session?.user) return false;
  // Use our custom app_metadata flag — set to false on signup,
  // set to true only after the user clicks the confirmation link
  const appMeta = session.user.app_metadata || {};
  if (appMeta.lumaid_email_verified === false) return false;
  if (appMeta.lumaid_email_verified === true) return true;
  // Fallback for existing users without the flag
  return !!session.user.email_confirmed_at;
}

function resolveRoute(session, isOnboarded) {
  if (!session) return 'Auth';
  if (!isEmailVerified(session)) return 'Auth';
  if (!isOnboarded) return 'Onboarding';
  return 'Home';
}

async function clearStaleAuthStorage() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(k =>
      k.includes('supabase') || k.includes('sb-') || k.includes('auth')
    );
    if (authKeys.length > 0) await AsyncStorage.multiRemove(authKeys);
  } catch (_) {}
}

/**
 * Parses ALL relevant params from a Supabase deep link URL.
 *
 * Supabase sends two different link formats:
 *
 * 1. OTP / email-confirm (your current flow via Resend):
 *    lumaidapp://auth/callback?token=<otp>&type=signup&...
 *    → params are in the QUERY STRING
 *
 * 2. PKCE / magic-link flow:
 *    lumaidapp://auth/callback#access_token=...&refresh_token=...&type=...
 *    → params are in the HASH FRAGMENT
 *
 * This parser handles both.
 */
function parseDeepLinkUrl(url = '') {
  try {
    const [base, fragment = ''] = url.split('#');
    const queryString = base.includes('?') ? base.split('?')[1] : '';

    // Fragment takes full precedence — Supabase puts all auth params there
    // (access_token, refresh_token, type) in the PKCE flow.
    // Query string is only used as fallback for token_hash OTP links.
    const params = new URLSearchParams(fragment);
    new URLSearchParams(queryString).forEach((v, k) => {
      if (!params.has(k)) params.set(k, v);
    });

    return {
      token:         params.get('token_hash') || params.get('token'),
      type:          params.get('type'),
      access_token:  params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      error:         params.get('error'),
      error_description: params.get('error_description'),
    };
  } catch (_) {
    return {};
  }
}

/** Navigate safely whether or not the NavigationContainer is ready yet. */
function navigateSafe(screen, params) {
  const go = () => {
    if (navigationRef.current?.isReady()) {
      navigationRef.current.navigate(screen, params);
    }
  };
  go();
  // Retry once in case the container isn't mounted yet (cold deep-link open)
  setTimeout(go, 600);
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [session,     setSession]     = useState(undefined); // undefined = loading
  const [isOnboarded, setIsOnboarded] = useState(undefined);
  const isNavigationReady             = useRef(false);

  // ── Deep link handler ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleUrl = async ({ url }) => {
      if (!url) return;
      console.log('[LUMAID] Deep link received:', url);

      const { token, type, access_token, refresh_token, error } = parseDeepLinkUrl(url);

      if (error) {
        console.warn('[LUMAID] Deep link error:', error);
        return;
      }

      // Nothing we can act on
      if (!token && !access_token) {
        console.warn('[LUMAID] Deep link has no token or access_token — ignoring');
        return;
      }

      global.__lumaidHandlingDeepLink = true;

      try {
        // ── RECOVERY (password reset) ────────────────────────────────────────
        if (type === 'recovery') {
          if (token) {
            // OTP-style recovery link (your current Resend flow)
            console.log('[LUMAID] Verifying OTP recovery token...');
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'recovery',
            });
            if (verifyError) {
              console.error('[LUMAID] verifyOtp recovery error:', verifyError.message);
              // Still navigate to ResetPassword — the PASSWORD_RECOVERY event
              // will have fired or the user can retry
            }
          } else if (access_token && refresh_token) {
            // PKCE-style recovery link
            await supabase.auth.setSession({ access_token, refresh_token });
          }
          // Route to ResetPassword regardless — the screen itself will handle
          // the case where the token was invalid
          setTimeout(() => navigateSafe('ResetPassword'), 300);
          return;
        }

        // ── SIGNUP confirmation ──────────────────────────────────────────────
        if (type === 'signup') {
          if (token) {
            // OTP-style confirmation (your current Resend flow)
            console.log('[LUMAID] Verifying OTP signup token...');
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup',
            });
            if (verifyError) {
              console.error('[LUMAID] verifyOtp signup error:', verifyError.message);
              // Token may be expired or already used
              setTimeout(() => navigateSafe('Auth', {
                emailVerified: false,
                verifyError: verifyError.message,
              }), 300);
              return;
            }
          } else if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }

          // Set lumaid_email_verified flag to true via backend
          try {
            const { data: { session: confirmSession } } = await supabase.auth.getSession();
            if (confirmSession?.user?.id) {
              await fetch('https://lumaid-backend-production-bee3.up.railway.app/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: confirmSession.user.id, accessToken: confirmSession.access_token }),
              });
            }
          } catch (e) { console.warn('[LUMAID] verify-email flag error:', e.message); }

          // Sign the user OUT so they must enter credentials manually.
          await supabase.auth.signOut();

          setTimeout(() => navigateSafe('Auth', { emailVerified: true }), 300);
          return;
        }

        // ── Generic fallback (magic link etc.) ───────────────────────────────
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }

      } finally {
        // Always release the flag after a short delay so onAuthStateChange
        // can process legitimate subsequent events
        setTimeout(() => { global.__lumaidHandlingDeepLink = false; }, 1000);
      }
    };

    // Handle cold-start deep link (app was closed when link was tapped)
    Linking.getInitialURL().then(url => { if (url) handleUrl({ url }); });

    // Handle warm-start deep link (app was in background)
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  // ── Bootstrap + auth state listener ───────────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // getSession() is safe — no network call, reads from AsyncStorage.
        // Avoid refreshSession() here: if the stored session is expired it
        // triggers a signOut which races against the deep link handler.
        const { data: { session: storedSession } } = await supabase.auth.getSession();

        if (!storedSession || !isEmailVerified(storedSession)) {
          // Don't call signOut() here — it triggers onAuthStateChange(SIGNED_OUT)
          // which can race with the deep link handler on cold start.
          await clearStaleAuthStorage();
          setSession(null);
          setIsOnboarded(false);
          return;
        }

        const val = await AsyncStorage.getItem('lumaid_user');
        setIsOnboarded(!!val);
        setSession(storedSession);
      } catch (_) {
        await clearStaleAuthStorage();
        setSession(null);
        setIsOnboarded(false);
      }
    };

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[LUMAID] onAuthStateChange:', event);

      // Don't process auth events while we're manually handling a deep link.
      // The deep link handler is in charge and will navigate itself.
      if (global.__lumaidHandlingDeepLink) {
        console.log('[LUMAID] Skipping auth event — deep link in progress');
        return;
      }

      // Debug: log session email_verified status
      if (newSession?.user) {
      }


      // Don't process events fired during the sign-up form submission
      if (global.__lumaidSigningUp) {
        console.log('[LUMAID] Skipping auth event — sign-up in progress');
        return;
      }

      // PASSWORD_RECOVERY: always go to ResetPassword, never Home
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[LUMAID] PASSWORD_RECOVERY — navigating to ResetPassword');
        setTimeout(() => navigateSafe('ResetPassword'), 300);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsOnboarded(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED' && !newSession) {
        await clearStaleAuthStorage();
        setSession(null);
        setIsOnboarded(false);
        return;
      }

      if (newSession) {
        // Hard gate: never let an unverified session through to the app
        if (!isEmailVerified(newSession)) {
          console.warn('[LUMAID] Session exists but email not verified — blocking');
          await clearStaleAuthStorage();
          await supabase.auth.signOut();
          setSession(null);
          setIsOnboarded(false);
          return;
        }
        const val = await AsyncStorage.getItem('lumaid_user');
        setIsOnboarded(!!val);
        setSession(newSession);
      }
    });

    registerForPushNotifications().then(status => {
      if (status === 'granted') scheduleDailyReminder(20, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Route resolver: runs when session/onboarded state changes ─────────────
  useEffect(() => {
    if (session === undefined || isOnboarded === undefined) return;
    if (!isNavigationReady.current) return;
    // Don't auto-navigate while a deep link is being processed —
    // the deep link handler calls navigateSafe() itself.
    if (global.__lumaidHandlingDeepLink) return;
    const target = resolveRoute(session, isOnboarded);
    navigateAndReset(target);
  }, [session, isOnboarded]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (session === undefined || isOnboarded === undefined) return <SplashScreen />;

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          isNavigationReady.current = true;
          if (!global.__lumaidHandlingDeepLink) {
            const target = resolveRoute(session, isOnboarded);
            navigateAndReset(target);
          }
        }}
      >
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Auth"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Auth"          component={AuthScreen} />
          <Stack.Screen name="Onboarding"    component={OnboardingScreen} />
          <Stack.Screen name="Home"          component={HomeScreen} />
          <Stack.Screen name="Chat"          component={ChatScreen} />
          <Stack.Screen name="Journal"       component={JournalScreen} />
          <Stack.Screen name="Profile"       component={ProfileScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}