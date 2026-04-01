import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
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
  }, [step]);

  if (!fontsLoaded) return null;

  const transition = (nextStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -16, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(16);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      {/* Ambient glow */}
      <Animated.View style={[styles.blob, {
        backgroundColor: soul.glow,
        opacity: orbOpacity,
        transform: [{ scale: orbScale }],
      }]} />

      {/* Step indicators */}
      <View style={styles.stepRow}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[
            styles.stepDot,
            i === step && [styles.stepDotActive, { backgroundColor: soul.color }],
            i < step && [styles.stepDotDone, { backgroundColor: soul.color }],
          ]} />
        ))}
      </View>

      <Animated.View style={[
        styles.content,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>

        {/* STEP 0 — Welcome */}
        {step === 0 && (
          <View style={styles.center}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoEmoji}>🌙</Text>
              <Text style={styles.logo}>lumaid</Text>
            </View>
            <Text style={styles.tagline}>The AI that grows with you.</Text>
            <Text style={styles.sub}>
              A companion that listens deeply, responds honestly, and evolves alongside you — privately, on your device.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={() => transition(1)}>
              <Text style={styles.btnText}>Get Started</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>No account needed · Fully private</Text>
          </View>
        )}

        {/* STEP 1 — Name */}
        {step === 1 && (
          <View style={styles.center}>
            <Text style={styles.stepLabel}>STEP 1 OF 3</Text>
            <Text style={styles.question}>What should{'\n'}Lumaid call you?</Text>
            <View style={styles.inputWrap}>
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
              style={[styles.btn, !name.trim() && styles.btnDisabled]}
              onPress={() => name.trim() && transition(2)}
            >
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 — Soul */}
        {step === 2 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.center}>
            <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
            <Text style={styles.question}>Choose your{'\n'}companion's soul.</Text>
            <Text style={styles.sub}>You can switch anytime from the home screen.</Text>
            <View style={styles.soulGrid}>
              {Object.values(SOULS).map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.soulCard,
                    selectedSoul === s.id && {
                      borderColor: s.color,
                      backgroundColor: `${s.color}14`,
                      shadowColor: s.color,
                      shadowOpacity: 0.2,
                      shadowRadius: 14,
                      shadowOffset: { width: 0, height: 4 },
                    },
                  ]}
                  onPress={() => setSelectedSoul(s.id)}
                >
                  <Text style={styles.soulEmoji}>{s.emoji}</Text>
                  <Text style={[
                    styles.soulName,
                    { color: selectedSoul === s.id ? s.color : COLORS.text },
                  ]}>
                    {s.name}
                  </Text>
                  <Text style={styles.soulTagline}>{s.tagline}</Text>
                  {selectedSoul === s.id && (
                    <View style={[styles.soulCheck, { backgroundColor: s.color }]}>
                      <Text style={styles.soulCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: soul.color }]}
              onPress={() => transition(3)}
            >
              <Text style={styles.btnText}>Choose {soul.name}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* STEP 3 — Ready */}
        {step === 3 && (
          <View style={styles.center}>
            <View style={[styles.readyOrb, {
              backgroundColor: `${soul.color}18`,
              borderColor: `${soul.color}35`,
            }]}>
              <Text style={styles.readyEmoji}>{soul.emoji}</Text>
            </View>
            <Text style={styles.question}>Hello, {name}.{'\n'}{soul.name} is ready.</Text>
            <Text style={styles.sub}>
              Lumaid will track your mood over time and start every conversation fresh — so you can be honest.
            </Text>
            <View style={styles.featureList}>
              {[
                'Fresh, private sessions every time',
                'Daily mood tracking & insights',
                'Voice conversations with personality',
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureDot, { backgroundColor: soul.color }]} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: soul.color }]}
              onPress={finish}
            >
              <Text style={styles.btnText}>Open Lumaid</Text>
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
  blob: {
    position: 'absolute',
    width: width * 1.3,
    height: width * 1.1,
    borderRadius: width * 0.65,
    top: -width * 0.45,
    alignSelf: 'center',
    opacity: 0.4,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 68 : 48,
    marginBottom: 6,
  },
  stepDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  stepDotActive: { width: 22 },
  stepDotDone: { opacity: 0.4 },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logoEmoji: { fontSize: 46, marginBottom: 6 },
  logo: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 46,
    color: COLORS.text,
    letterSpacing: 7,
  },
  tagline: {
    fontFamily: 'Lato_700Bold',
    fontSize: 17,
    color: COLORS.text,
    marginBottom: 14,
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
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.14,
    marginBottom: 14,
  },
  question: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 12,
  },
  inputWrap: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 22,
  },
  input: {
    fontFamily: 'Lato_400Regular',
    fontSize: 17,
    color: COLORS.text,
    paddingHorizontal: 20,
    paddingVertical: 16,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 50,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 14,
  },
  btnDisabled: { opacity: 0.3 },
  btnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
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
    marginBottom: 24,
    marginTop: 6,
    width: '100%',
  },
  soulCard: {
    width: (width - 72) / 2,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  soulEmoji: { fontSize: 28 },
  soulName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
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
    width: 20, height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soulCheckText: {
    color: COLORS.white,
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
  },
  readyOrb: {
    width: 96, height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  readyEmoji: { fontSize: 42 },
  featureList: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 13,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  featureDot: {
    width: 6, height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  featureText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.text,
  },
});