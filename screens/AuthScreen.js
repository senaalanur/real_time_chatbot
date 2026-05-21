import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

// ── Replace these with your real URLs before launch ──────────────────────────
const TERMS_URL = 'https://lumaid-legal.vercel.app';
const PRIVACY_URL = 'https://lumaid-legal.vercel.app';

export default function AuthScreen({ navigation }) {
  // 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  if (!fontsLoaded) return null;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const validateEmail = (e) => /\S+@\S+\.\S+/.test(e);

  const animateTransition = (fn) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const switchMode = (next) => {
    animateTransition(() => {
      setMode(next);
      setError('');
      setMessage('');
      setPassword('');
      setConfirmPassword('');
    });
  };

  // ── Guest ──────────────────────────────────────────────────────────────────
  const handleGuest = async () => {
    await AsyncStorage.setItem('lumaid_guest', 'true');
    // Trigger App.js to re-evaluate by replacing with Home
    // App.js will redirect to Onboarding since lumaid_user isn't set yet
    navigation.replace('Home');
  };

  // ── Forgot password ────────────────────────────────────────────────────────
  const handleForgot = async () => {
    setError('');
    setMessage('');
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'lumaid://reset-password',
      });
      if (error) throw error;
      setMessage('Check your inbox — we sent a reset link!');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Sign up / Sign in ──────────────────────────────────────────────────────
  const handleAuth = async () => {
    setError('');
    setMessage('');

    if (!email.trim()) { setError('Email is required.'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        // Auto sign-in right after signup (skip email confirmation for now)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        // If sign-in failed it's likely email confirmation is required
        if (signInError) {
          setMessage('Account created! Check your email to confirm, then sign in.');
          switchMode('login');
          return;
        }

        navigation.replace('Onboarding');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        navigation.replace('Home');
      }
    } catch (err) {
      const msg = err.message ?? '';
      if (msg.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Try again.');
      } else if (msg.includes('User already registered')) {
        setError('An account with this email already exists.');
        switchMode('login');
      } else if (msg.includes('Email not confirmed')) {
        setError('Please confirm your email before signing in.');
      } else if (msg.includes('rate limit')) {
        setError('Too many attempts. Please wait a moment.');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      {/* Background blobs */}
      <View style={[styles.blobTop, { backgroundColor: COLORS.accentGlow }]} />
      <View style={[styles.blobBottom, { backgroundColor: COLORS.cyanGlow }]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoOrb}>
            <Text style={styles.logoEmoji}>🌙</Text>
          </View>
          <Text style={styles.logo}>lumaid</Text>
          <Text style={styles.tagline}>
            {isForgot
              ? 'Reset your password.'
              : isSignup
              ? 'Create your account.'
              : 'Welcome back.'}
          </Text>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Form */}
          <View style={styles.form}>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            {/* Password (hidden on forgot mode) */}
            {!isForgot && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>PASSWORD</Text>
                  {!isSignup && (
                    <TouchableOpacity onPress={() => switchMode('forgot')}>
                      <Text style={styles.forgotLink}>Forgot password?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingRight: 50 }]}
                    placeholder="At least 6 characters"
                    placeholderTextColor={COLORS.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Confirm password */}
            {isSignup && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingRight: 50 }]}
                    placeholder="Repeat your password"
                    placeholderTextColor={COLORS.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirm(!showConfirm)}
                  >
                    <Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Success */}
            {message ? (
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successText}>{message}</Text>
              </View>
            ) : null}

            {/* Primary button */}
            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.6 }]}
              onPress={isForgot ? handleForgot : handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.btnText}>
                  {isForgot
                    ? 'Send Reset Link →'
                    : isSignup
                    ? 'Create Account →'
                    : 'Sign In →'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Guest button */}
            {!isForgot && (
              <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
                <Text style={styles.guestText}>Continue as Guest</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Switch mode footer */}
          <View style={styles.footer}>
            {isForgot ? (
              <TouchableOpacity onPress={() => switchMode('login')}>
                <Text style={styles.footerLink}>← Back to Sign In</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.footerText}>
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <TouchableOpacity onPress={() => switchMode(isSignup ? 'login' : 'signup')}>
                  <Text style={styles.footerLink}>
                    {isSignup ? ' Sign in' : ' Sign up'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Legal */}
          <View style={styles.legalRow}>
            <Text style={styles.legalText}>By continuing, you agree to our </Text>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalText}> and </Text>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalText}>.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  blobTop: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.0,
    borderRadius: width * 0.7,
    top: -width * 0.4,
    alignSelf: 'center',
    opacity: 0.4,
  },
  blobBottom: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    bottom: -width * 0.2,
    right: -width * 0.2,
    opacity: 0.12,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingVertical: 60,
  },

  header: { alignItems: 'center', marginBottom: 36 },
  logoOrb: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 38 },
  logo: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 40,
    color: COLORS.text,
    letterSpacing: 7,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: COLORS.textSoft,
  },

  form: { gap: 14, marginBottom: 24 },
  inputGroup: { gap: 7 },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 4,
  },
  label: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.16,
  },
  forgotLink: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: COLORS.accent,
  },

  inputRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: COLORS.text,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  eyeText: { fontSize: 16 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.danger + '15',
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
    borderRadius: 14,
    padding: 13,
  },
  errorIcon: {
    fontSize: 13,
    color: COLORS.danger,
    marginTop: 1,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.danger,
    lineHeight: 19,
  },

  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.success + '15',
    borderWidth: 1,
    borderColor: COLORS.success + '40',
    borderRadius: 14,
    padding: 13,
  },
  successIcon: {
    fontSize: 13,
    color: COLORS.success,
    marginTop: 1,
  },
  successText: {
    flex: 1,
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.success,
    lineHeight: 19,
  },

  btn: {
    backgroundColor: COLORS.accent,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  guestBtn: {
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  guestText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: COLORS.textSoft,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.textSoft,
  },
  footerLink: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: COLORS.accent,
  },

  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  legalText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 18,
  },
  legalLink: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: COLORS.accent,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
});