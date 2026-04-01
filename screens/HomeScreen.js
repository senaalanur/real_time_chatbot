import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { COLORS, MOODS, QUICK_ACTIONS, SOULS } from '../constants';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [soul, setSoul] = useState(SOULS.zen);
  const [todayMood, setTodayMood] = useState(null);
  const [stats, setStats] = useState({ totalChats: 0 });
  const [showSoulPicker, setShowSoulPicker] = useState(false);

  const orbPulse = useRef(new Animated.Value(1)).current;
  const orbGlow  = useRef(new Animated.Value(0.5)).current;
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const soulPickerAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  useEffect(() => {
    loadData();
    startOrbAnimation();
    Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.spring(soulPickerAnim, {
      toValue: showSoulPicker ? 1 : 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, [showSoulPicker]);

  const loadData = async () => {
    const userRaw = await AsyncStorage.getItem('lumaid_user');
    const statsRaw = await AsyncStorage.getItem('lumaid_stats');
    const moodRaw = await AsyncStorage.getItem('lumaid_today_mood');

    if (userRaw) {
      const u = JSON.parse(userRaw);
      setUser(u);
      setSoul(SOULS[u.soul] || SOULS.zen);
    }
    if (statsRaw) setStats(JSON.parse(statsRaw));
    if (moodRaw) {
      const m = JSON.parse(moodRaw);
      if (m.date === new Date().toDateString()) setTodayMood(m.moodId);
    }
  };

  const startOrbAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orbPulse, { toValue: 1.07, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(orbGlow,  { toValue: 1,    duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(orbPulse, { toValue: 0.95, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(orbGlow,  { toValue: 0.3,  duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ])
    ).start();
  };

  const switchSoul = async (newSoul) => {
    setSoul(newSoul);
    setShowSoulPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const userRaw = await AsyncStorage.getItem('lumaid_user');
    if (userRaw) {
      const u = JSON.parse(userRaw);
      u.soul = newSoul.id;
      await AsyncStorage.setItem('lumaid_user', JSON.stringify(u));
    }
  };

  const logMood = async (moodId) => {
    setTodayMood(moodId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const entry = { moodId, date: new Date().toDateString(), timestamp: Date.now() };
    await AsyncStorage.setItem('lumaid_today_mood', JSON.stringify(entry));
    const histRaw = await AsyncStorage.getItem('lumaid_mood_history');
    const hist = histRaw ? JSON.parse(histRaw) : [];
    // Avoid duplicate same-day entries
    const filtered = hist.filter(e => e.date !== entry.date);
    filtered.push(entry);
    await AsyncStorage.setItem('lumaid_mood_history', JSON.stringify(filtered));
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const goToChat = (quickActionPrompt = null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Chat', {
      soul: soul.id,
      quickActionPrompt,
    });
  };

  if (!fontsLoaded) return null;

  const currentMood = MOODS.find(m => m.id === todayMood);

  return (
    <View style={styles.root}>
      {/* Ambient glow */}
      <Animated.View style={[styles.ambientGlow, {
        backgroundColor: soul.glow,
        opacity: orbGlow,
        transform: [{ scale: orbPulse }],
      }]} />

      <Animated.ScrollView
        style={{ opacity: fadeIn, flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName}>{user?.name ?? '...'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.soulBadge, {
              borderColor: soul.color + '55',
              backgroundColor: soul.glow,
            }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSoulPicker(v => !v);
            }}
          >
            <Text style={styles.soulBadgeEmoji}>{soul.emoji}</Text>
            <Text style={[styles.soulBadgeName, { color: soul.color }]}>{soul.name}</Text>
            <Text style={[styles.soulChevron, { color: soul.color }]}>
              {showSoulPicker ? '↑' : '↓'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Soul Picker ─────────────────────────────────────────────────── */}
        {showSoulPicker && (
          <Animated.View style={[styles.soulPicker, {
            opacity: soulPickerAnim,
            transform: [{
              translateY: soulPickerAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
            }],
          }]}>
            <Text style={styles.soulPickerTitle}>SWITCH COMPANION</Text>
            {Object.values(SOULS).map(s => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.soulPickerItem,
                  soul.id === s.id && {
                    backgroundColor: `${s.color}14`,
                    borderColor: `${s.color}50`,
                  },
                ]}
                onPress={() => switchSoul(s)}
              >
                <View style={[styles.soulPickerIcon, { backgroundColor: `${s.color}18` }]}>
                  <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.soulPickerName, { color: soul.id === s.id ? s.color : COLORS.text }]}>
                    {s.name}
                  </Text>
                  <Text style={styles.soulPickerTag}>{s.tagline}</Text>
                </View>
                {soul.id === s.id && (
                  <Text style={[styles.activeCheck, { color: s.color }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* ── Central Orb ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => goToChat()}
          style={styles.orbContainer}
        >
          <Animated.View style={[styles.orbOuter, {
            borderColor: soul.color + '35',
            transform: [{ scale: orbPulse }],
          }]}>
            <View style={[styles.orbMiddle, { backgroundColor: soul.glow }]}>
              <View style={[styles.orbInner, { backgroundColor: soul.color + '18' }]}>
                <View style={[styles.orbCore, { backgroundColor: soul.color }]}>
                  <Text style={styles.orbCoreEmoji}>{soul.emoji}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
          <Text style={styles.orbLabel}>Tap to talk with {soul.name}</Text>
          <View style={[styles.orbCta, { backgroundColor: soul.color }]}>
            <Text style={styles.orbCtaText}>Start conversation  →</Text>
          </View>
        </TouchableOpacity>

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>QUICK ACTIONS</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickCard, { borderColor: soul.color + '35' }]}
                onPress={() => goToChat(action.prompt)}
              >
                <Text style={styles.quickEmoji}>{action.emoji}</Text>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Mood Check-in ────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>HOW ARE YOU TODAY?</Text>
            {todayMood && (
              <TouchableOpacity onPress={() => setTodayMood(null)}>
                <Text style={styles.cardAction}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
          {todayMood ? (
            <View style={styles.moodDone}>
              <View style={[styles.moodDoneIcon, { backgroundColor: currentMood?.color + '18' }]}>
                <Text style={{ fontSize: 28 }}>{currentMood?.emoji}</Text>
              </View>
              <View>
                <Text style={styles.moodDoneLabel}>Feeling</Text>
                <Text style={[styles.moodDoneText, { color: currentMood?.color }]}>
                  {currentMood?.label}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity key={m.id} style={styles.moodBtn} onPress={() => logMood(m.id)}>
                  <View style={[styles.moodIconWrap, { backgroundColor: m.color + '18' }]}>
                    <Text style={[styles.moodEmoji, { color: m.color }]}>{m.emoji}</Text>
                  </View>
                  <Text style={styles.moodLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Action Cards ─────────────────────────────────────────────────── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: soul.color + '35' }]}
            onPress={() => goToChat()}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: soul.color + '18' }]}>
              <Text style={styles.actionIcon}>💬</Text>
            </View>
            <Text style={styles.actionTitle}>Talk to Lumaid</Text>
            <Text style={styles.actionSub}>New conversation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Journal')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: COLORS.surfaceUp }]}>
              <Text style={styles.actionIcon}>📈</Text>
            </View>
            <Text style={styles.actionTitle}>Mood Journal</Text>
            <Text style={styles.actionSub}>View your patterns</Text>
          </TouchableOpacity>
        </View>

        {/* ── Memory Card ──────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>YOUR JOURNEY</Text>
          <Text style={styles.memoryText}>
            {stats.totalChats === 0
              ? "Start your first conversation — Lumaid is ready to listen."
              : `${stats.totalChats} exchange${stats.totalChats !== 1 ? 's' : ''} so far. Every session starts fresh — your privacy, always.`}
          </Text>
        </View>

        <View style={{ height: 48 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  ambientGlow: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.0,
    borderRadius: width * 0.75,
    top: -width * 0.4,
    alignSelf: 'center',
    zIndex: 0,
  },
  scroll: {
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
    paddingHorizontal: 18,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 2,
  },
  userName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: COLORS.text,
  },
  soulBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 50,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  soulBadgeEmoji: { fontSize: 14 },
  soulBadgeName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
  },
  soulChevron: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
  },

  // Soul Picker
  soulPicker: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  soulPickerTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.12,
    marginBottom: 10,
  },
  soulPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  soulPickerIcon: {
    width: 38, height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soulPickerName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 1,
  },
  soulPickerTag: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: COLORS.muted,
  },
  activeCheck: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
  },

  // Orb
  orbContainer: { alignItems: 'center', marginVertical: 22 },
  orbOuter: {
    width: 176, height: 176,
    borderRadius: 88,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  orbMiddle: {
    width: 144, height: 144,
    borderRadius: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    width: 112, height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbCore: {
    width: 70, height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbCoreEmoji: { fontSize: 30 },
  orbLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 12,
  },
  orbCta: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 50,
  },
  orbCtaText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: COLORS.white,
    letterSpacing: 0.2,
  },

  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.12,
    marginBottom: 12,
  },
  cardAction: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: COLORS.accent,
  },

  // Quick Actions grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceUp,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  quickEmoji: { fontSize: 14 },
  quickLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: COLORS.textSoft,
  },

  // Mood
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: { alignItems: 'center', gap: 5, flex: 1 },
  moodIconWrap: {
    width: 42, height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  moodEmoji: { fontSize: 19, fontFamily: 'Lato_700Bold' },
  moodLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 10,
    color: COLORS.muted,
  },
  moodDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  moodDoneIcon: {
    width: 52, height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodDoneLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 2,
  },
  moodDoneText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 20,
  },

  // Action Cards
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  actionIconWrap: {
    width: 42, height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIcon: { fontSize: 20 },
  actionTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 3,
  },
  actionSub: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: COLORS.muted,
  },

  // Memory
  memoryText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: COLORS.textSoft,
    lineHeight: 22,
  },
});