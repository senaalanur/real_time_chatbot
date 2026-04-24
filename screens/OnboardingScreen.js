import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, SOULS } from '../constants';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedSoul, setSelectedSoul] = useState('zen');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const orbScale = useRef(new Animated.Value(0.8)).current;
  const orbOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  useEffect(() => {
    Animated.parallel([
      Animated.spring(orbScale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.timing(orbOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [step]);

  if (!fontsLoaded) return null;

  const transition = (nextStep) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    });
  };

  const finish = async () => {
    const user = { name, soul: selectedSoul, createdAt: Date.now() };
    await AsyncStorage.setItem('lumaid_user', JSON.stringify(user));
    navigation.replace('Home');
  };

  const soul = SOULS[selectedSoul];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      {/* Background blobs */}
      <Animated.View style={[styles.blobTop, { backgroundColor: soul.glow, opacity: glowAnim, transform: [{ scale: orbScale }] }]} />
      <View style={[styles.blobBottom, { backgroundColor: COLORS.cyanGlow }]} />

      {/* Step dots */}
      <View style={styles.stepRow}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[
            styles.stepDot,
            i === step && [styles.stepDotActive, { backgroundColor: soul.color, width: 28 }],
            i < step && [styles.stepDotDone, { backgroundColor: soul.color + '50' }],
          ]} />
        ))}
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* STEP 0 — Welcome */}
        {step === 0 && (
          <View style={styles.center}>
            <Animated.View style={[styles.logoOrb, { opacity: orbOpacity, transform: [{ scale: orbScale }] }]}>
              <Text style={styles.logoEmoji}>🌙</Text>
            </Animated.View>
            <Text style={styles.logo}>lumaid</Text>
            <Text style={styles.tagline}>Your AI wellness companion.</Text>
            <Text style={styles.sub}>
              A space to reflect, vent, grow, and feel heard — every single day.
            </Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: soul.color }]} onPress={() => transition(1)}>
              <Text style={styles.btnText}>Get Started →</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Free to start · No credit card needed</Text>
          </View>
        )}

        {/* STEP 1 — Name */}
        {step === 1 && (
          <View style={styles.center}>
            <Text style={styles.stepLabel}>01 / 03</Text>
            <Text style={styles.question}>What should{'\n'}Lumaid call you?</Text>
            <View style={[styles.inputWrap, { borderColor: name.trim() ? soul.color + '60' : COLORS.border }]}>
              <TextInput
                style={styles.input}
                placeholder="Your name..."
                placeholderTextColor={COLORS.muted}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => name.trim() && transition(2)}
              />
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: name.trim() ? soul.color : COLORS.surfaceUp }, !name.trim() && { opacity: 0.4 }]}
              onPress={() => name.trim() && transition(2)}
            >
              <Text style={[styles.btnText, !name.trim() && { color: COLORS.muted }]}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 — Soul */}
        {step === 2 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.center}>
            <Text style={styles.stepLabel}>02 / 03</Text>
            <Text style={styles.question}>Choose your{'\n'}companion.</Text>
            <Text style={styles.sub}>You can switch anytime.</Text>
            <View style={styles.soulGrid}>
              {Object.values(SOULS).map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.soulCard,
                    selectedSoul === s.id && {
                      borderColor: s.color,
                      backgroundColor: s.color + '12',
                    },
                  ]}
                  onPress={() => { setSelectedSoul(s.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <View style={[styles.soulOrb, { backgroundColor: s.color + '20', borderColor: s.color + '40' }]}>
                    <Text style={styles.soulEmoji}>{s.emoji}</Text>
                  </View>
                  <Text style={[styles.soulName, { color: selectedSoul === s.id ? s.color : COLORS.text }]}>{s.name}</Text>
                  <Text style={styles.soulTagline}>{s.tagline}</Text>
                  {selectedSoul === s.id && (
                    <View style={[styles.soulCheck, { backgroundColor: s.color }]}>
                      <Text style={styles.soulCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.btn, { backgroundColor: soul.color }]} onPress={() => transition(3)}>
              <Text style={styles.btnText}>Choose {soul.name} →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* STEP 3 — Ready */}
        {step === 3 && (
          <View style={styles.center}>
            <Text style={styles.stepLabel}>03 / 03</Text>
            <Animated.View style={[styles.readyOrb, {
              backgroundColor: soul.color + '15',
              borderColor: soul.color + '40',
              opacity: orbOpacity,
              transform: [{ scale: orbScale }],
            }]}>
              <Text style={styles.readyEmoji}>{soul.emoji}</Text>
            </Animated.View>
            <Text style={styles.question}>Hey {name},{'\n'}{soul.name} is ready.</Text>
            <Text style={styles.sub}>Track your mood, reflect on your week, and grow with your companion.</Text>
            <View style={styles.featureList}>
              {[
                '✦  Daily mood tracking & streaks',
                '✦  AI-generated weekly recap',
                '✦  Custom character companions',
              ].map((f, i) => (
                <Text key={i} style={[styles.featureItem, { color: soul.color }]}>{f}</Text>
              ))}
            </View>
            <TouchableOpacity style={[styles.btn, { backgroundColor: soul.color }]} onPress={finish}>
              <Text style={styles.btnText}>Open Lumaid →</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 26,
  },
  blobTop: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.1,
    borderRadius: width * 0.7,
    top: -width * 0.5,
    alignSelf: 'center',
    opacity: 0.5,
  },
  blobBottom: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    bottom: -width * 0.3,
    right: -width * 0.2,
    opacity: 0.1,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    marginBottom: 8,
  },
  stepDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  stepDotActive: { height: 6, borderRadius: 3 },
  stepDotDone: { width: 6, height: 6, borderRadius: 3 },
  content: { flex: 1, justifyContent: 'center' },
  center: { alignItems: 'center', paddingVertical: 20 },

  logoOrb: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoEmoji: { fontSize: 48 },
  logo: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 48,
    color: COLORS.text,
    letterSpacing: 8,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: 'Lato_700Bold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  sub: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: COLORS.textSoft,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 36,
    maxWidth: 290,
  },
  stepLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  question: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 34,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 16,
  },
  inputWrap: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  input: {
    fontFamily: 'Lato_400Regular',
    fontSize: 17,
    color: COLORS.text,
    paddingHorizontal: 22,
    paddingVertical: 16,
    textAlign: 'center',
  },
  btn: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 50,
    marginBottom: 14,
  },
  btnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  hint: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: COLORS.muted,
  },

  soulGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 28,
    marginTop: 8,
    width: '100%',
  },
  soulCard: {
    width: (width - 72) / 2,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  soulOrb: {
    width: 52, height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  soulEmoji: { fontSize: 26 },
  soulName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: COLORS.text,
  },
  soulTagline: {
    fontFamily: 'Lato_400Regular',
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 15,
  },
  soulCheck: {
    position: 'absolute',
    top: 10, right: 10,
    width: 22, height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soulCheckText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
  },

  readyOrb: {
    width: 110, height: 110,
    borderRadius: 55,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  readyEmoji: { fontSize: 50 },

  featureList: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: 12,
    marginBottom: 28,
  },
  featureItem: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    lineHeight: 20,
  },
});