import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator, Animated, KeyboardAvoidingView, Linking,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Dimensions,
} from 'react-native';
import { Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');
const TERMS_URL   = 'https://lumaid-legal.vercel.app';
const PRIVACY_URL = 'https://lumaid-legal.vercel.app';
const BACKEND_URL = 'https://lumaid-backend-production-bee3.up.railway.app';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sanitize = (str) => str.replace(/\x00/g, '').trim();

const PASSWORD_RULES = [
  { id: 'length',  label: 'At least 8 characters',       test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A–Z)',   test: (p) => /[A-Z]/.test(p) },
  { id: 'number',  label: 'One number (0–9)',             test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password) {
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  if (passed === 0) return { level: 0, label: '',       color: COLORS.border };
  if (passed === 1) return { level: 1, label: 'Weak',   color: COLORS.danger };
  if (passed === 2) return { level: 2, label: 'Fair',   color: COLORS.warning };
  if (passed === 3) return { level: 3, label: 'Good',   color: COLORS.cyan };
  return              { level: 4, label: 'Strong', color: COLORS.success };
}

function isPasswordValid(p) { return PASSWORD_RULES.every(r => r.test(p)); }

function mapError(msg = '') {
  if (msg.includes('Invalid login credentials'))               return 'Incorrect email or password.';
  if (msg.includes('User already registered'))                 return 'An account with this email already exists. Please sign in.';
  if (msg.includes('Email not confirmed'))                     return 'Please confirm your email before signing in.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Too many attempts. Please wait a moment.';
  if (msg.includes('network') || msg.includes('fetch'))       return 'No internet connection. Check your network.';
  return msg || 'Something went wrong. Please try again.';
}

function StrengthBar({ password }) {
  const { level, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <View style={sStyles.wrap}>
      <View style={sStyles.bars}>
        {[1,2,3,4].map(i => (
          <View key={i} style={[sStyles.seg, { backgroundColor: i <= level ? color : COLORS.border }]} />
        ))}
      </View>
      {label ? <Text style={[sStyles.label, { color }]}>{label}</Text> : null}
    </View>
  );
}

function PasswordRules({ password }) {
  if (!password) return null;
  return (
    <View style={rStyles.wrap}>
      {PASSWORD_RULES.map(rule => {
        const ok = rule.test(password);
        return (
          <View key={rule.id} style={rStyles.row}>
            <Text style={[rStyles.icon, { color: ok ? COLORS.success : COLORS.muted }]}>{ok ? '✓' : '○'}</Text>
            <Text style={[rStyles.text, { color: ok ? COLORS.success : COLORS.muted }]}>{rule.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function AuthScreen({ route }) {
  const [mode,            setMode]            = useState('login');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [message,         setMessage]         = useState(
    route?.params?.emailVerified ? '✓ Email verified! Please sign in with your credentials.' : ''
  );
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [emailTouched,    setEmailTouched]    = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, Lato_400Regular, Lato_700Bold });

  // Update message if route params change (e.g. navigated back with emailVerified)
  useEffect(() => {
    if (route?.params?.emailVerified) {
      setMessage('✓ Email verified! Please sign in with your credentials.');
      setMode('login');
    }
  }, [route?.params?.emailVerified]);

  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const emailValid    = EMAIL_RE.test(email.trim());
  const emailError    = emailTouched && email.trim() && !emailValid;
  const passwordValid = isSignup ? isPasswordValid(password) : password.length >= 6;
  const confirmValid  = !isSignup || password === confirmPassword;
  const canSubmit     = isForgot ? emailValid : emailValid && passwordValid && confirmValid;

  const animateTransition = useCallback((fn) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  if (!fontsLoaded) return null;

  const switchMode = (next) => {
    animateTransition(() => {
      setMode(next); setError(''); setMessage('');
      setPassword(''); setConfirmPassword(''); setEmailTouched(false);
    });
  };

  const handleForgot = async () => {
    setError(''); setMessage(''); setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sanitize(email) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setMessage('Check your inbox — we sent a reset link!');
    } catch (err) {
      setError(mapError(err.message));
    } finally { setLoading(false); }
  };

  const handleAuth = async () => {
    setError(''); setMessage(''); setLoading(true);
    const cleanEmail    = sanitize(email);
    const cleanPassword = password;
    try {
      if (isSignup) {
        global.__lumaidSigningUp = true;

        try {
          await supabase.auth.signOut();

          const backendRes = await fetch(`${BACKEND_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
          });
          const backendData = await backendRes.json();

          if (!backendRes.ok) {
            const msg = backendData.error || 'Signup failed';
            if (msg.toLowerCase().includes('already')) {
              setError('An account with this email already exists. Please sign in instead.');
            } else {
              setError(mapError(msg));
            }
            return;
          }

          setMessage('Account created! Check your email and tap the confirmation link, then come back to sign in.');
          animateTransition(() => {
            setMode('login');
            setPassword('');
            setConfirmPassword('');
          });

        } finally {
          setTimeout(() => { global.__lumaidSigningUp = false; }, 1500);
        }

      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (signInError) throw signInError;

        // Double-check email verification client-side
        const { data: { session: signInSession } } = await supabase.auth.getSession();
        if (!signInSession?.user?.email_confirmed_at) {
          await supabase.auth.signOut();
          setError('Please confirm your email before signing in. Check your inbox.');
          return;
        }
      }
    } catch (err) {
      setError(mapError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const emailBorderColor   = emailError ? COLORS.danger : (emailTouched && emailValid ? COLORS.success + '80' : COLORS.border);
  const pwBorderColor      = isSignup && password ? (passwordValid ? COLORS.success + '80' : COLORS.border) : COLORS.border;
  const confirmBorderColor = isSignup && confirmPassword ? (confirmValid ? COLORS.success + '80' : COLORS.danger) : COLORS.border;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Image source={require('../assets/images/lumaid-logo.png')} style={styles.logoOrbImg} resizeMode="contain" />
          <Text style={styles.logo}>lumaid</Text>
          <Text style={styles.tagline}>
            {isForgot ? 'Reset your password.' : isSignup ? 'Create your account.' : 'Welcome back.'}
          </Text>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.form}>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={[styles.input, { borderColor: emailBorderColor }]}
                placeholder="you@example.com" placeholderTextColor={COLORS.muted}
                value={email} onChangeText={(v) => { setEmail(v); setError(''); }}
                onBlur={() => setEmailTouched(true)}
                autoCapitalize="none" keyboardType="email-address" autoCorrect={false}
              />
              {emailError && <Text style={styles.fieldError}>Please enter a valid email address.</Text>}
            </View>

            {!isForgot && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>PASSWORD</Text>
                  {!isSignup && <TouchableOpacity onPress={() => switchMode('forgot')}><Text style={styles.forgotLink}>Forgot password?</Text></TouchableOpacity>}
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingRight: 50, borderColor: pwBorderColor }]}
                    placeholder={isSignup ? 'Min 8 chars, uppercase, number, symbol' : 'Your password'}
                    placeholderTextColor={COLORS.muted} value={password}
                    onChangeText={(v) => { setPassword(v); setError(''); }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                    <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
                  </TouchableOpacity>
                </View>
                {isSignup && <StrengthBar password={password} />}
                {isSignup && <PasswordRules password={password} />}
              </View>
            )}

            {isSignup && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingRight: 50, borderColor: confirmBorderColor }]}
                    placeholder="Repeat your password" placeholderTextColor={COLORS.muted}
                    value={confirmPassword} onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                    <Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁'}</Text>
                  </TouchableOpacity>
                </View>
                {confirmPassword && !confirmValid && <Text style={styles.fieldError}>Passwords do not match.</Text>}
              </View>
            )}

            {error   ? <View style={styles.errorBox}><Text style={styles.errorIcon}>⚠</Text><Text style={styles.errorText}>{error}</Text></View>   : null}
            {message ? <View style={styles.successBox}><Text style={styles.successIcon}>✓</Text><Text style={styles.successText}>{message}</Text></View> : null}

            <TouchableOpacity
              style={[styles.btn, (!canSubmit || loading) && styles.btnDisabled]}
              onPress={isForgot ? handleForgot : handleAuth}
              disabled={!canSubmit || loading} activeOpacity={canSubmit ? 0.8 : 1}
            >
              {loading
                ? <ActivityIndicator color={COLORS.text} />
                : <Text style={[styles.btnText, !canSubmit && styles.btnTextDisabled]}>
                    {isForgot ? 'Send Reset Link →' : isSignup ? 'Create Account →' : 'Sign In →'}
                  </Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            {isForgot
              ? <TouchableOpacity onPress={() => switchMode('login')}><Text style={styles.footerLink}>← Back to Sign In</Text></TouchableOpacity>
              : <><Text style={styles.footerText}>{isSignup ? 'Already have an account?' : "Don't have an account?"}</Text>
                  <TouchableOpacity onPress={() => switchMode(isSignup ? 'login' : 'signup')}><Text style={styles.footerLink}>{isSignup ? ' Sign in' : ' Sign up'}</Text></TouchableOpacity></>
            }
          </View>

          <View style={styles.legalRow}>
            <Text style={styles.legalText}>By continuing, you agree to our </Text>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}><Text style={styles.legalLink}>Terms of Service</Text></TouchableOpacity>
            <Text style={styles.legalText}> and </Text>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}><Text style={styles.legalLink}>Privacy Policy</Text></TouchableOpacity>
            <Text style={styles.legalText}>.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const sStyles = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginLeft: 2 },
  bars:  { flex: 1, flexDirection: 'row', gap: 4 },
  seg:   { flex: 1, height: 3, borderRadius: 2 },
  label: { fontFamily: 'Lato_700Bold', fontSize: 11, letterSpacing: 0.2, width: 44, textAlign: 'right' },
});
const rStyles = StyleSheet.create({
  wrap: { gap: 5, marginTop: 10, paddingLeft: 2 },
  row:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  icon: { fontSize: 11, width: 14 },
  text: { fontFamily: 'Lato_400Regular', fontSize: 12, lineHeight: 16 },
});
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  blobTop: {
    position: 'absolute', width: width*1.4, height: width*1.0,
    borderRadius: width*0.7, top: -width*0.4, alignSelf: 'center',
    backgroundColor: 'rgba(200,170,80,0.18)', opacity: 1,
  },
  blobBottom: {
    position: 'absolute', width: width*0.8, height: width*0.8,
    borderRadius: width*0.4, bottom: -width*0.2, right: -width*0.2,
    backgroundColor: 'rgba(6,182,212,0.08)',
  },
  scroll:     { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 60 },
  header:     { alignItems: 'center', marginBottom: 36 },
  logoOrb: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(200,170,80,0.14)',
    borderWidth: 1.5, borderColor: 'rgba(200,170,80,0.40)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 16,
  },
  logoOrbMid: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(200,170,80,0.22)',
    borderWidth: 1.5, borderColor: 'rgba(200,170,80,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoOrbCore: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent },
  logoOrbImg: { width: 280, height: 280, marginBottom: 16 },
  logo:       { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 40, color: COLORS.text, letterSpacing: 7, marginBottom: 8 },
  tagline:    { fontFamily: 'Lato_400Regular', fontSize: 16, color: COLORS.textSoft },
  form:       { gap: 16, marginBottom: 24 },
  inputGroup: { gap: 7 },
  labelRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 4, marginRight: 4 },
  label:      { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 1.2, marginLeft: 4 },
  forgotLink: { fontFamily: 'Lato_700Bold', fontSize: 11, color: COLORS.accentDark },
  fieldError: { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.danger, marginLeft: 6, marginTop: 2 },
  inputRow:   { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 18, paddingVertical: 15,
    fontFamily: 'Lato_400Regular', fontSize: 15, color: COLORS.text,
  },
  eyeBtn:     { position: 'absolute', right: 14, padding: 4 },
  eyeText:    { fontSize: 16 },
  errorBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.danger + '12', borderWidth: 1, borderColor: COLORS.danger + '35', borderRadius: 14, padding: 13 },
  errorIcon:  { fontSize: 13, color: COLORS.danger, marginTop: 1 },
  errorText:  { flex: 1, fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.danger, lineHeight: 19 },
  successBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.success + '12', borderWidth: 1, borderColor: COLORS.success + '35', borderRadius: 14, padding: 13 },
  successIcon:{ fontSize: 13, color: COLORS.success, marginTop: 1 },
  successText:{ flex: 1, fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.success, lineHeight: 19 },
  btn: {
    backgroundColor: COLORS.accent, borderRadius: 50, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnDisabled:    { backgroundColor: 'rgba(200,170,80,0.25)', shadowOpacity: 0, elevation: 0 },
  btnText:        { fontFamily: 'Lato_700Bold', fontSize: 16, color: COLORS.text, letterSpacing: 0.3 },
  btnTextDisabled:{ color: COLORS.muted },
  footer:     { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  footerText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.textSoft },
  footerLink: { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.accentDark },
  legalRow:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  legalText:  { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.muted, lineHeight: 18 },
  legalLink:  { fontFamily: 'Lato_700Bold', fontSize: 11, color: COLORS.accentDark, lineHeight: 18, textDecorationLine: 'underline' },
});