import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS, SOULS } from '../constants';
import { navigateAndReset } from '../lib/navigationRef';

const { width } = Dimensions.get('window');



// ── Spotlight tips ────────────────────────────────────────────────────────────
const SPOTLIGHT_TIPS = [
  "Welcome to Lumaid ✦\n\nYour personal AI wellness companion. We'll ask you a couple of quick questions to personalize your experience.",
  "What should Lumaid call you?\n\nThis is how your companion will greet you every day. You can update it anytime from your profile.",
  "Choose your companion's personality.\n\nEach soul has a unique energy — calm, energetic, wise, or effortlessly unbothered. You can switch anytime.",
  "You're almost in ✦\n\nBefore you start, we have two quick questions to make your experience even better.",
  "Stay in the loop ✉️\n\nWe send very rare, personal updates from the people building Lumaid. No spam — ever.",
  "Daily reminders help you build a wellness habit.\n\nGentle check-in nudges at the best times. Customize or turn off anytime.",
];

// ── Main Onboarding Screen ────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [step,            setStep]            = useState(0);
  const [name,            setName]            = useState('');
  const [selectedSoul,    setSelectedSoul]    = useState('zen');
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [notifRequesting, setNotifRequesting] = useState(false);


  const fadeAnim   = useRef(new Animated.Value(1)).current;
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const orbScale   = useRef(new Animated.Value(0.8)).current;
  const orbOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0.5)).current;
  const glowLoop   = useRef(null);
  const inputFocus = useRef(new Animated.Value(0)).current;
  const soulScales = useRef(
    Object.keys(SOULS).reduce((acc, k) => { acc[k] = new Animated.Value(1); return acc; }, {})
  ).current;

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, Lato_400Regular, Lato_700Bold });

  useEffect(() => {
    orbScale.setValue(0.8);
    orbOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(orbScale,   { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.timing(orbOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();
    if (glowLoop.current) glowLoop.current.stop();
    glowLoop.current = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1,   duration: 2500, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
    ]));
    glowLoop.current.start();
    return () => { if (glowLoop.current) glowLoop.current.stop(); };
  }, [step]);

  if (!fontsLoaded) return null;

  const soul       = SOULS[selectedSoul];
  const totalSteps = 6;
  const isLastTip  = step === totalSteps - 1;


  const transition = (nextStep) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -28, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(28);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    });
  };

  const onSoulPress = (soulId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (soulScales[selectedSoul]) Animated.spring(soulScales[selectedSoul], { toValue: 1, useNativeDriver: true }).start();
    setSelectedSoul(soulId);
    Animated.spring(soulScales[soulId], { toValue: 1.04, tension: 200, friction: 8, useNativeDriver: true }).start();
  };

  const onInputFocus = () => Animated.timing(inputFocus, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onInputBlur  = () => Animated.timing(inputFocus, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  const inputBorderColor   = inputFocus.interpolate({ inputRange: [0,1], outputRange: [COLORS.border, COLORS.accent] });
  const inputShadowOpacity = inputFocus.interpolate({ inputRange: [0,1], outputRange: [0, 0.25] });

  const requestNotifications = async () => {
    setNotifRequesting(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      Haptics.notificationAsync(
        status === 'granted'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    } catch (err) {
    } finally {
      setNotifRequesting(false);
      finish();
    }
  };

  const finish = async () => {
    const user = { name: name.trim(), soul: selectedSoul, createdAt: Date.now() };
    await AsyncStorage.setItem('lumaid_user', JSON.stringify(user));
    if (newsletterOptIn) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase.from('email_subscribers').upsert({
            user_id: authUser.id, email: authUser.email,
            subscribed: true, updated_at: new Date().toISOString(),
          });
        }
      } catch (err) { console.log('[Onboarding] Newsletter skip:', err.message); }
    }
    navigateAndReset('Home', { startTour: true });
  };

  const skipNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    finish();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.blobTop} />
      <Animated.View style={[styles.blobSoul, { backgroundColor: soul.glow, opacity: glowAnim }]} />
      <View style={[styles.blobBottom, { backgroundColor: COLORS.cyanGlow }]} />

      {/* Progress dots */}
      <View style={styles.stepRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={[
            styles.stepDot,
            i === step && [styles.stepDotActive, { backgroundColor: soul.color, width: 28 }],
            i  < step && [styles.stepDotDone,   { backgroundColor: soul.color + '60' }],
          ]} />
        ))}
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* ── STEP 0 — Welcome ─────────────────────────────────────────── */}
        {step === 0 && (
          <View style={styles.center}>
            <Animated.Image source={require('../assets/images/lumaid-logo.png')} style={[styles.logoOrbImg, { opacity: orbOpacity, transform: [{ scale: orbScale }] }]} resizeMode="contain" />
            <Text style={styles.logo}>lumaid</Text>
            <Text style={styles.tagline}>Your AI wellness companion.</Text>
            <Text style={styles.sub}>A space to reflect, vent, grow, and feel heard — every single day.</Text>

            {/* Inline tip */}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: COLORS.accent, shadowColor: COLORS.accent }]}
              onPress={() => transition(1)} activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Get Started →</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Free to start · No credit card needed</Text>
          </View>
        )}

        {/* ── STEP 1 — Name ────────────────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.center}>
            <Text style={[styles.stepLabel, { color: COLORS.accentDark }]}>01 / 05</Text>
            <Text style={styles.question}>What should{'\n'}Lumaid call you?</Text>

            <View style={styles.floatWrap}>
              <Animated.Text style={[styles.floatLabel, name.length > 0 && styles.floatLabelUp]}>
                Your name
              </Animated.Text>
              <Animated.View style={[styles.floatInputWrap, { borderColor: inputBorderColor }]}>
                <TextInput
                  style={styles.floatInput}
                  value={name}
                  onChangeText={setName}
                  onFocus={onInputFocus}
                  onBlur={onInputBlur}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => name.trim() && transition(2)}
                  placeholderTextColor="transparent"
                />
              </Animated.View>
              <Animated.View style={[styles.inputGlow, { opacity: inputShadowOpacity }]} />
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: name.trim() ? COLORS.accent : 'rgba(200,170,80,0.22)' }, !name.trim() && { shadowOpacity: 0 }]}
              onPress={() => name.trim() && transition(2)}
              disabled={!name.trim()} activeOpacity={0.85}
            >
              <Text style={[styles.btnText, !name.trim() && { color: COLORS.muted }]}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 2 — Soul ────────────────────────────────────────────── */}
        {step === 2 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.center}>
            <Text style={[styles.stepLabel, { color: soul.color }]}>02 / 05</Text>
            <Text style={styles.question}>Choose your{'\n'}companion.</Text>

            <View style={styles.soulGrid}>
              {Object.values(SOULS).map(s => {
                const isSelected = selectedSoul === s.id;
                const scale = soulScales[s.id] || new Animated.Value(1);
                return (
                  <TouchableOpacity key={s.id} activeOpacity={0.85} onPress={() => onSoulPress(s.id)}>
                    <Animated.View style={[
                      styles.soulCard,
                      isSelected && { borderColor: s.color, backgroundColor: s.color + '0F', shadowColor: s.color, shadowOpacity: 0.28, shadowRadius: 14, elevation: 6 },
                      { transform: [{ scale }] },
                    ]}>
                      <View style={[styles.soulGlass, { backgroundColor: s.color + '08' }]} />
                      <View style={[styles.soulOrb, { backgroundColor: s.color + '18', borderColor: s.color + '40' }]}>
                        <Text style={styles.soulEmoji}>{s.emoji}</Text>
                      </View>
                      <Text style={[styles.soulName, { color: isSelected ? s.color : COLORS.text }]}>{s.name}</Text>
                      <Text style={styles.soulTagline}>{s.tagline}</Text>
                      {isSelected && (
                        <View style={[styles.soulCheck, { backgroundColor: s.color }]}>
                          <Text style={styles.soulCheckText}>✓</Text>
                        </View>
                      )}
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: soul.color, shadowColor: soul.color }]}
              onPress={() => transition(3)} activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Choose {soul.name} →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ── STEP 3 — Ready ───────────────────────────────────────────── */}
        {step === 3 && (
          <View style={styles.center}>
            <Text style={[styles.stepLabel, { color: soul.color }]}>03 / 05</Text>
            <Animated.View style={[
              styles.readyOrb,
              { backgroundColor: soul.color + '12', borderColor: soul.color + '40', opacity: orbOpacity, transform: [{ scale: orbScale }], shadowColor: soul.color },
            ]}>
              <Text style={styles.readyEmoji}>{soul.emoji}</Text>
            </Animated.View>
            <Text style={styles.question}>Hey {name},{'\n'}{soul.name} is ready.</Text>
            <Text style={styles.sub}>Track your mood, reflect on your week, and grow with your companion.</Text>

            <View style={[styles.featureList, { borderColor: soul.color + '25' }]}>
              {['✦  Daily mood tracking & streaks', '✦  Your companion remembers you', '✦  4 unique AI companions'].map((f, i) => (
                <Text key={i} style={[styles.featureItem, { color: soul.color }]}>{f}</Text>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: soul.color, shadowColor: soul.color }]}
              onPress={() => transition(4)} activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 4 — Newsletter ──────────────────────────────────────── */}
        {step === 4 && (
          <View style={styles.center}>
            <Text style={[styles.stepLabel, { color: COLORS.accentDark }]}>04 / 05</Text>
            <Animated.View style={[styles.permOrb, { opacity: orbOpacity, transform: [{ scale: orbScale }], backgroundColor: 'rgba(200,170,80,0.14)', borderColor: 'rgba(200,170,80,0.40)' }]}>
              <Text style={styles.permOrbEmoji}>✉️</Text>
            </Animated.View>
            <Text style={styles.question}>Notes from{'\n'}the founders.</Text>
            <Text style={styles.sub}>We write to our users personally — not as a company, but as the people building this.</Text>

            <View style={[styles.permCard, { borderColor: newsletterOptIn ? 'rgba(200,170,80,0.50)' : COLORS.border, backgroundColor: newsletterOptIn ? 'rgba(200,170,80,0.08)' : COLORS.white }]}>
              <View style={styles.permCardHeader}>
                <View style={[styles.permCardIcon, { backgroundColor: 'rgba(200,170,80,0.18)' }]}>
                  <Text style={{ fontSize: 20 }}>✦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.permCardTitle}>Founder Notes</Text>
                  <Text style={styles.permCardSub}>Unsubscribe anytime · No spam, ever</Text>
                </View>
                <Switch
                  value={newsletterOptIn}
                  onValueChange={(v) => { setNewsletterOptIn(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E5EA"
                  style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                />
              </View>
              <Text style={styles.permCardBody}>
                {"\"Hey — thank you for being here. We're building Lumaid because we believe everyone deserves a space to feel heard.\"\n\n— Lumaid Team ✦"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: COLORS.accent, shadowColor: COLORS.accent }]}
              onPress={() => transition(5)} activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{newsletterOptIn ? 'Subscribe & Continue →' : 'Continue →'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 5 — Notifications ───────────────────────────────────── */}
        {step === 5 && (
          <View style={styles.center}>
            <Text style={[styles.stepLabel, { color: COLORS.accentDark }]}>05 / 05</Text>
            <Animated.View style={[styles.permOrb, { opacity: orbOpacity, transform: [{ scale: orbScale }], backgroundColor: 'rgba(52,199,89,0.10)', borderColor: 'rgba(52,199,89,0.35)' }]}>
              <Text style={styles.permOrbEmoji}>🔔</Text>
            </Animated.View>
            <Text style={styles.question}>Stay on track{'\n'}every day.</Text>
            <Text style={styles.sub}>Lumaid sends gentle daily reminders to help you check in and keep your streak alive.</Text>

            <View style={[styles.permCard, { borderColor: 'rgba(52,199,89,0.30)', backgroundColor: 'rgba(52,199,89,0.05)' }]}>
              {[
                { icon: '🌅', text: 'Morning intention nudge to start your day right' },
                { icon: '🌙', text: 'Evening check-in reminder before you wind down' },
                { icon: '🔥', text: 'Streak alerts so you never break your streak' },
              ].map((item, i) => (
                <View key={i} style={[styles.benefitRow, i > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(52,199,89,0.15)' }]}>
                  <Text style={styles.benefitIcon}>{item.icon}</Text>
                  <Text style={styles.benefitText}>{item.text}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.permNote}>You can adjust notification settings anytime in your profile.</Text>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#34C759', shadowColor: '#34C759' }, notifRequesting && { opacity: 0.7 }]}
              onPress={requestNotifications}
              disabled={notifRequesting}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF' }]}>
                {notifRequesting ? 'Requesting…' : 'Enable Notifications →'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={skipNotifications} style={styles.skipLink}>
              <Text style={styles.skipLinkText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        )}

      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 24 },
  blobTop:      { position: 'absolute', width: width*1.4, height: width*1.1, borderRadius: width*0.7, top: -width*0.5, alignSelf: 'center', backgroundColor: 'rgba(200,170,80,0.16)' },
  blobSoul:     { position: 'absolute', width: width*1.0, height: width*0.8, borderRadius: width*0.5, top: width*0.1, alignSelf: 'center' },
  blobBottom:   { position: 'absolute', width: width*0.8, height: width*0.8, borderRadius: width*0.4, bottom: -width*0.3, right: -width*0.2, opacity: 0.15 },
  stepRow:      { flexDirection: 'row', gap: 5, justifyContent: 'center', paddingTop: Platform.OS === 'ios' ? 70 : 50, marginBottom: 8 },
  stepDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(200,170,80,0.25)' },
  stepDotActive:{ height: 6, borderRadius: 3 },
  stepDotDone:  { width: 6, height: 6, borderRadius: 3 },
  content:      { flex: 1, justifyContent: 'center' },
  center:       { alignItems: 'center', paddingVertical: 20 },
  logoOrbImg: { width: 280, height: 280, marginBottom: 20 },
  logo:      { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 48, color: COLORS.text, letterSpacing: 8, marginBottom: 12 },
  tagline:   { fontFamily: 'Lato_700Bold', fontSize: 18, color: COLORS.text, marginBottom: 12, textAlign: 'center' },
  sub:       { fontFamily: 'Lato_400Regular', fontSize: 14, color: COLORS.textSoft, textAlign: 'center', lineHeight: 24, marginBottom: 20, maxWidth: 300 },
  stepLabel: { fontFamily: 'Lato_700Bold', fontSize: 11, letterSpacing: 1.5, marginBottom: 16 },
  question:  { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 34, color: COLORS.text, textAlign: 'center', lineHeight: 44, marginBottom: 16 },
  hint:      { fontFamily: 'Lato_400Regular', fontSize: 12, color: COLORS.muted },
  btn:       { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 50, marginBottom: 14, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  btnText:   { fontFamily: 'Lato_700Bold', fontSize: 16, color: COLORS.text, letterSpacing: 0.3 },
  floatWrap:      { width: '100%', marginBottom: 28, position: 'relative' },
  floatLabel:     { fontFamily: 'Lato_400Regular', fontSize: 15, color: COLORS.muted, position: 'absolute', top: 16, left: 22, zIndex: 1 },
  floatLabelUp:   { fontSize: 11, top: -10, left: 16, color: COLORS.accentDark, fontFamily: 'Lato_700Bold', letterSpacing: 0.5 },
  floatInputWrap: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden' },
  floatInput:     { fontFamily: 'Lato_400Regular', fontSize: 17, color: COLORS.text, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 14 },
  inputGlow:      { position: 'absolute', bottom: -8, left: 16, right: 16, height: 12, borderRadius: 8, backgroundColor: COLORS.accent },
  soulGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 28, marginTop: 8, width: '100%' },
  soulCard:     { width: (width-68)/2, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 22, padding: 16, alignItems: 'center', gap: 5, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, overflow: 'hidden', position: 'relative' },
  soulGlass:    { position: 'absolute', top: 0, left: 0, right: 0, height: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  soulOrb:      { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  soulEmoji:    { fontSize: 26 },
  soulName:     { fontFamily: 'Lato_700Bold', fontSize: 15, color: COLORS.text },
  soulTagline:  { fontFamily: 'Lato_400Regular', fontSize: 10, color: COLORS.muted, textAlign: 'center', lineHeight: 15 },
  soulCheck:    { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  soulCheckText:{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Lato_700Bold' },
  readyOrb:    { width: 110, height: 110, borderRadius: 55, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 28, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 6 },
  readyEmoji:  { fontSize: 50 },
  featureList: { width: '100%', backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, padding: 20, gap: 12, marginBottom: 20 },
  featureItem: { fontFamily: 'Lato_700Bold', fontSize: 14, lineHeight: 20 },
  permOrb:      { width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4 },
  permOrbEmoji: { fontSize: 44 },
  permCard:     { width: '100%', borderWidth: 1.5, borderRadius: 20, padding: 18, marginBottom: 20 },
  permCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  permCardIcon:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  permCardTitle:  { fontFamily: 'Lato_700Bold', fontSize: 15, color: COLORS.text, marginBottom: 2 },
  permCardSub:    { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.muted },
  permCardBody:   { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.textSoft, lineHeight: 21, fontStyle: 'italic' },
  permNote:       { fontFamily: 'Lato_400Regular', fontSize: 12, color: COLORS.muted, textAlign: 'center', marginBottom: 16, maxWidth: 280 },
  benefitRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  benefitIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  benefitText: { flex: 1, fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.textSoft, lineHeight: 19 },
  skipLink:     { paddingVertical: 10 },
  skipLinkText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.muted, textDecorationLine: 'underline' },
});