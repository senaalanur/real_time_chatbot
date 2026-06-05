import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Dimensions,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

const PASSWORD_RULES = [
  { id: 'length',  label: 'At least 8 characters',       test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A–Z)',   test: (p) => /[A-Z]/.test(p) },
  { id: 'number',  label: 'One number (0–9)',             test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function isPasswordValid(p) { return PASSWORD_RULES.every(r => r.test(p)); }

export default function ResetPasswordScreen({ navigation }) {
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [message,         setMessage]         = useState('');
  const [showPassword,    setShowPassword]    = useState(false);

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, Lato_400Regular, Lato_700Bold });
  if (!fontsLoaded) return null;

  const passwordValid = isPasswordValid(password);
  const confirmValid  = password === confirmPassword;
  const canSubmit     = passwordValid && confirmValid && password.length > 0;

  const handleReset = async () => {
    setError(''); setMessage(''); setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Password updated! You can now sign in with your new password.');
      setTimeout(() => {
        supabase.auth.signOut();
        navigation.replace('Auth');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.blobTop} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.logo}>lumaid</Text>
          <Text style={styles.tagline}>Set a new password.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NEW PASSWORD</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, paddingRight: 50 }]}
                placeholder="Min 8 chars, uppercase, number, symbol"
                placeholderTextColor={COLORS.muted}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={[styles.input, { borderColor: confirmPassword && !confirmValid ? COLORS.danger : COLORS.border }]}
              placeholder="Repeat your new password"
              placeholderTextColor={COLORS.muted}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
              secureTextEntry={!showPassword}
            />
            {confirmPassword && !confirmValid && (
              <Text style={styles.fieldError}>Passwords do not match.</Text>
            )}
          </View>

          {error   ? <View style={styles.errorBox}><Text style={styles.errorIcon}>⚠</Text><Text style={styles.errorText}>{error}</Text></View>   : null}
          {message ? <View style={styles.successBox}><Text style={styles.successIcon}>✓</Text><Text style={styles.successText}>{message}</Text></View> : null}

          <TouchableOpacity
            style={[styles.btn, (!canSubmit || loading) && styles.btnDisabled]}
            onPress={handleReset}
            disabled={!canSubmit || loading}
            activeOpacity={canSubmit ? 0.8 : 1}
          >
            {loading
              ? <ActivityIndicator color={COLORS.text} />
              : <Text style={[styles.btnText, !canSubmit && styles.btnTextDisabled]}>Update Password →</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.replace('Auth')}>
            <Text style={styles.backText}>← Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  blobTop: {
    position: 'absolute', width: width*1.4, height: width*1.0,
    borderRadius: width*0.7, top: -width*0.4, alignSelf: 'center',
    backgroundColor: 'rgba(200,170,80,0.18)',
  },
  scroll:     { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 60 },
  header:     { alignItems: 'center', marginBottom: 36 },
  logo:       { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 40, color: COLORS.text, letterSpacing: 7, marginBottom: 8 },
  tagline:    { fontFamily: 'Lato_400Regular', fontSize: 16, color: COLORS.textSoft },
  form:       { gap: 16 },
  inputGroup: { gap: 7 },
  label:      { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 1.2, marginLeft: 4 },
  inputRow:   { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 18, paddingVertical: 15,
    fontFamily: 'Lato_400Regular', fontSize: 15, color: COLORS.text,
  },
  eyeBtn:     { position: 'absolute', right: 14, padding: 4 },
  eyeText:    { fontSize: 16 },
  fieldError: { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.danger, marginLeft: 6, marginTop: 2 },
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
  backBtn:    { alignItems: 'center', marginTop: 8 },
  backText:   { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.accentDark },
});