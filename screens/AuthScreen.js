import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
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

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const glowAnim = useRef(new Animated.Value(0.5)).current;

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  if (!fontsLoaded) return null;

  const validateEmail = (e) => /\S+@\S+\.\S+/.test(e);

  const handleAuth = async () => {
    setError('');
    setMessage('');
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigation.replace('Onboarding');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigation.replace('Home');
      }
    } catch (err) {
      const msg = err.message ?? '';
      if (msg.includes('Invalid login credentials')) setError('Incorrect email or password.');
      else if (msg.includes('User already registered')) setError('Account exists. Sign in instead.');
      else setError(msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(''); setMessage(''); setPassword(''); setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      {/* Background blobs */}
      <View style={[styles.blobTop, { backgroundColor: COLORS.accentGlow }]} />
      <View style={[styles.blobBottom, { backgroundColor: COLORS.cyanGlow }]} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoOrb}>
            <Text style={styles.logoEmoji}>🌙</Text>
          </View>
          <Text style={styles.logo}>lumaid</Text>
          <Text style={styles.tagline}>
            {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={COLORS.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Repeat your password"
                placeholderTextColor={COLORS.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {message ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{message}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnText}>{mode === 'login' ? 'Sign In →' : 'Create Account →'}</Text>}
          </TouchableOpacity>
        </View>

        {/* Switch mode */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <TouchableOpacity onPress={switchMode}>
            <Text style={styles.footerLink}>{mode === 'login' ? ' Sign up' : ' Sign in'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
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

  header: { alignItems: 'center', marginBottom: 40 },
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

  form: { gap: 14, marginBottom: 28 },
  inputGroup: { gap: 7 },
  label: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.16,
    marginLeft: 4,
  },
  input: {
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

  errorBox: {
    backgroundColor: COLORS.danger + '15',
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
    borderRadius: 14,
    padding: 13,
  },
  errorText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.danger,
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: COLORS.success + '15',
    borderWidth: 1,
    borderColor: COLORS.success + '40',
    borderRadius: 14,
    padding: 13,
  },
  successText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.success,
    textAlign: 'center',
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

  footer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  footerText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.textSoft },
  footerLink: { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.accent },

  legal: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 17,
  },
});