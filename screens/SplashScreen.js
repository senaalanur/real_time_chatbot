import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const ring1 = useRef(new Animated.Value(0.6)).current;
  const ring2 = useRef(new Animated.Value(0.6)).current;
  const ring3 = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  useEffect(() => {
    // Staggered ring pulses
    const pulse = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.5, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );

    pulse(ring1, 0).start();
    pulse(ring2, 300).start();
    pulse(ring3, 600).start();

    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 8, delay: 200, useNativeDriver: true }),
    ]).start();

    // Tagline entrance
    Animated.timing(taglineOpacity, { toValue: 1, duration: 600, delay: 700, useNativeDriver: true }).start();
  }, []);

  if (!fontsLoaded) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      {/* Background blobs */}
      <Animated.View style={[styles.blob1, { opacity: ring1 }]} />
      <Animated.View style={[styles.blob2, { opacity: ring2 }]} />

      {/* Rings */}
      <View style={styles.ringsContainer}>
        <Animated.View style={[styles.ring, styles.ring3, { opacity: ring3 }]} />
        <Animated.View style={[styles.ring, styles.ring2, { opacity: ring2 }]} />
        <Animated.View style={[styles.ring, styles.ring1, { opacity: ring1 }]} />

        {/* Core orb */}
        <Animated.View style={[styles.orbCore, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Text style={styles.orbEmoji}>🌙</Text>
        </Animated.View>
      </View>

      {/* Logo text */}
      <Animated.Text style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        lumaid
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Your AI wellness companion
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  blob1: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.0,
    borderRadius: width * 0.7,
    top: -width * 0.4,
    alignSelf: 'center',
    backgroundColor: 'rgba(168,85,247,0.15)',
  },
  blob2: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    bottom: -width * 0.3,
    right: -width * 0.2,
    backgroundColor: 'rgba(6,182,212,0.08)',
  },

  ringsContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },

  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  ring3: {
    width: 200, height: 200,
    borderColor: 'rgba(168,85,247,0.15)',
  },
  ring2: {
    width: 162, height: 162,
    borderColor: 'rgba(168,85,247,0.25)',
  },
  ring1: {
    width: 124, height: 124,
    borderColor: 'rgba(168,85,247,0.45)',
  },

  orbCore: {
    width: 76, height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  orbEmoji: { fontSize: 32 },

  logo: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 42,
    color: COLORS.text,
    letterSpacing: 8,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: COLORS.muted,
    letterSpacing: 0.3,
  },
});