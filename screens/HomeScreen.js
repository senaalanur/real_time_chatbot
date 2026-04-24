import { scheduleStreakMilestone } from '../lib/notifications';
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
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, MOODS, QUICK_ACTIONS, SOULS } from '../constants';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [soul, setSoul] = useState(SOULS.zen);
  const [todayMood, setTodayMood] = useState(null);
  const [stats, setStats] = useState({ totalChats: 0 });
  const [showSoulPicker, setShowSoulPicker] = useState(false);
  const [streak, setStreak] = useState(0);

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
    Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }).start();
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
    const histRaw = await AsyncStorage.getItem('lumaid_mood_history');

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
    if (histRaw) {
      const hist = JSON.parse(histRaw);
      let s = 0;
      const daySet = new Set(hist.map(e => e.date));
      let d = new Date();
      while (daySet.has(d.toDateString())) {
        s++;
        d.setDate(d.getDate() - 1);
      }
      setStreak(s);
    }
  };

  const startOrbAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orbPulse, { toValue: 1.08, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(orbGlow,  { toValue: 1,    duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(orbPulse, { toValue: 0.94, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(orbGlow,  { toValue: 0.3,  duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
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
    const filtered = hist.filter(e => e.date !== entry.date);
    filtered.push(entry);
    await AsyncStorage.setItem('lumaid_mood_history', JSON.stringify(filtered));
    let s = 0;
    const daySet = new Set([...filtered.map(e => e.date)]);
    let d = new Date();
    while (daySet.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
    setStreak(s);
    scheduleStreakMilestone(s);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const goToChat = (quickActionPrompt = null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Chat', { soul: soul.id, quickActionPrompt });
  };

  if (!fontsLoaded) return null;

  const currentMood = MOODS.find(m => m.id === todayMood);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.blobTop, {
        backgroundColor: soul.glow,
        opacity: orbGlow,
        transform: [{ scale: orbPulse }],
      }]} />
      <View style={[styles.blobBottom, { backgroundColor: COLORS.cyanGlow }]} />

      <Animated.ScrollView
        style={{ opacity: fadeIn, flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName}>{user?.name ?? '...'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.soulBadge, { borderColor: soul.color + '60' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSoulPicker(v => !v);
            }}
          >
            <View style={[styles.soulBadgeDot, { backgroundColor: soul.color }]} />
            <Text style={[styles.soulBadgeName, { color: soul.color }]}>{soul.name}</Text>
            <Text style={[styles.soulChevron, { color: soul.color }]}>
              {showSoulPicker ? '↑' : '↓'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Streak banner */}
        {streak >= 2 && (
          <View style={[styles.streakBanner, { borderColor: soul.color + '40' }]}>
            <Text style={[styles.streakFire, { color: soul.color }]}>✦</Text>
            <Text style={[styles.streakText, { color: soul.color }]}>{streak} day streak</Text>
            <Text style={styles.streakSub}>keep it going</Text>
          </View>
        )}

        {/* Soul Picker */}
        {showSoulPicker && (
          <Animated.View style={[styles.soulPicker, {
            opacity: soulPickerAnim,
            transform: [{ translateY: soulPickerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
          }]}>
            <Text style={styles.soulPickerTitle}>SWITCH COMPANION</Text>
            {Object.values(SOULS).map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.soulPickerItem, soul.id === s.id && { backgroundColor: s.color + '12', borderColor: s.color + '50' }]}
                onPress={() => switchSoul(s)}
              >
                <View style={[styles.soulPickerDot, { backgroundColor: s.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.soulPickerName, { color: soul.id === s.id ? s.color : COLORS.text }]}>{s.name}</Text>
                  <Text style={styles.soulPickerTag}>{s.tagline}</Text>
                </View>
                {soul.id === s.id && <Text style={[styles.activeCheck, { color: s.color }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Central Orb */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => goToChat()} style={styles.orbContainer}>
          <Animated.View style={[styles.orbRing3, { borderColor: soul.color + '15', transform: [{ scale: orbPulse }] }]}>
            <View style={[styles.orbRing2, { borderColor: soul.color + '25' }]}>
              <View style={[styles.orbRing1, { borderColor: soul.color + '40' }]}>
                <View style={[styles.orbCore, { backgroundColor: soul.color }]}>
                  <Text style={styles.orbEmoji}>{soul.emoji}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
          <Text style={styles.orbLabel}>Talk to {soul.name}</Text>
          <View style={[styles.orbCta, { backgroundColor: soul.color }]}>
            <Text style={styles.orbCtaText}>Start conversation  →</Text>
          </View>
        </TouchableOpacity>

        {/* Mood Check-in */}
        <View style={styles.glassCard}>
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
              <View style={[styles.moodDoneOrb, { backgroundColor: currentMood?.color + '20', borderColor: currentMood?.color + '40' }]}>
                <Text style={[styles.moodDoneEmoji, { color: currentMood?.color }]}>{currentMood?.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moodDoneLabel}>Feeling</Text>
                <Text style={[styles.moodDoneText, { color: currentMood?.color }]}>{currentMood?.label}</Text>
              </View>
              {streak > 0 && (
                <View style={[styles.streakPill, { backgroundColor: soul.color + '20', borderColor: soul.color + '40' }]}>
                  <Text style={[styles.streakPillNum, { color: soul.color }]}>{streak}</Text>
                  <Text style={[styles.streakPillLabel, { color: soul.color }]}>days</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity key={m.id} style={styles.moodBtn} onPress={() => logMood(m.id)}>
                  <View style={[styles.moodOrb, { backgroundColor: m.color + '18', borderColor: m.color + '40' }]}>
                    <Text style={[styles.moodEmoji, { color: m.color }]}>{m.emoji}</Text>
                  </View>
                  <Text style={styles.moodLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Wellness Tools */}
        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>WELLNESS TOOLS</Text>
          <View style={styles.toolsGrid}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.id}
                style={[styles.toolCard, { borderColor: action.color + '30', backgroundColor: action.color + '08' }]}
                onPress={() => goToChat(action.prompt)}
              >
                <Text style={styles.toolEmoji}>{action.emoji}</Text>
                <Text style={[styles.toolLabel, { color: action.color }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: soul.color + '30' }]}
            onPress={() => navigation.navigate('Characters')}
          >
            <View style={[styles.actionIcon, { backgroundColor: soul.color + '15' }]}>
              <Text style={styles.actionEmoji}>✦</Text>
            </View>
            <Text style={styles.actionTitle}>Characters</Text>
            <Text style={styles.actionSub}>Your AI companions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: COLORS.cyan + '30' }]}
            onPress={() => navigation.navigate('WeeklyRecap')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.cyanSoft }]}>
              <Text style={styles.actionEmoji}>📊</Text>
            </View>
            <Text style={styles.actionTitle}>Weekly Recap</Text>
            <Text style={styles.actionSub}>Mood + insights</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: COLORS.accent + '30' }]}
            onPress={() => navigation.navigate('Journal')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.accentSoft }]}>
              <Text style={styles.actionEmoji}>📈</Text>
            </View>
            <Text style={styles.actionTitle}>Journal</Text>
            <Text style={styles.actionSub}>Mood history</Text>
          </TouchableOpacity>
        </View>

        {/* Journey stats */}
        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>YOUR JOURNEY</Text>
          <View style={styles.journeyRow}>
            <View style={styles.journeyStat}>
              <Text style={[styles.journeyNum, { color: soul.color }]}>{stats.totalChats}</Text>
              <Text style={styles.journeyLabel}>messages</Text>
            </View>
            <View style={styles.journeyDivider} />
            <View style={styles.journeyStat}>
              <Text style={[styles.journeyNum, { color: COLORS.cyan }]}>{streak}</Text>
              <Text style={styles.journeyLabel}>day streak</Text>
            </View>
            <View style={styles.journeyDivider} />
            <View style={styles.journeyStat}>
              <Text style={styles.journeyNum}>{soul.emoji}</Text>
              <Text style={styles.journeyLabel}>{soul.name}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 48 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  blobTop: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.0,
    borderRadius: width * 0.7,
    top: -width * 0.5,
    alignSelf: 'center',
    zIndex: 0,
  },
  blobBottom: {
    position: 'absolute',
    width: width * 1.0,
    height: width * 0.8,
    borderRadius: width * 0.5,
    bottom: -width * 0.3,
    right: -width * 0.3,
    opacity: 0.15,
    zIndex: 0,
  },

  scroll: {
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  userName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 30,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  soulBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
  },
  soulBadgeDot: { width: 7, height: 7, borderRadius: 4 },
  soulBadgeName: { fontFamily: 'Lato_700Bold', fontSize: 13 },
  soulChevron: { fontSize: 10, fontFamily: 'Lato_700Bold' },

  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    backgroundColor: COLORS.surface,
  },
  streakFire: { fontSize: 14 },
  streakText: { fontFamily: 'Lato_700Bold', fontSize: 14 },
  streakSub: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.muted },

  soulPicker: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
  },
  soulPickerTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.14,
    marginBottom: 12,
  },
  soulPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  soulPickerDot: { width: 10, height: 10, borderRadius: 5 },
  soulPickerName: { fontFamily: 'Lato_700Bold', fontSize: 14, marginBottom: 1 },
  soulPickerTag: { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.muted },
  activeCheck: { fontFamily: 'Lato_700Bold', fontSize: 16 },

  orbContainer: { alignItems: 'center', marginVertical: 20 },
  orbRing3: {
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  orbRing2: {
    width: 164, height: 164, borderRadius: 82,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  orbRing1: {
    width: 124, height: 124, borderRadius: 62,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  orbCore: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  orbEmoji: { fontSize: 32 },
  orbLabel: {
    fontFamily: 'Lato_400Regular', fontSize: 13,
    color: COLORS.muted, marginBottom: 12, letterSpacing: 0.2,
  },
  orbCta: { paddingHorizontal: 24, paddingVertical: 11, borderRadius: 50 },
  orbCtaText: { fontFamily: 'Lato_700Bold', fontSize: 14, color: COLORS.white, letterSpacing: 0.3 },

  glassCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
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
    letterSpacing: 0.16,
    marginBottom: 12,
  },
  cardAction: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: COLORS.accent,
    marginBottom: 12,
  },

  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: { alignItems: 'center', gap: 6, flex: 1 },
  moodOrb: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  moodEmoji: { fontSize: 18, fontFamily: 'Lato_700Bold' },
  moodLabel: { fontFamily: 'Lato_400Regular', fontSize: 10, color: COLORS.muted },

  moodDone: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  moodDoneOrb: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  moodDoneEmoji: { fontSize: 24, fontFamily: 'Lato_700Bold' },
  moodDoneLabel: { fontFamily: 'Lato_400Regular', fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  moodDoneText: { fontFamily: 'Lato_700Bold', fontSize: 22 },
  streakPill: {
    alignItems: 'center', borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  streakPillNum: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24 },
  streakPillLabel: { fontFamily: 'Lato_400Regular', fontSize: 10 },

  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toolCard: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: 22, paddingHorizontal: 13, paddingVertical: 9,
  },
  toolEmoji: { fontSize: 14 },
  toolLabel: { fontFamily: 'Lato_700Bold', fontSize: 12 },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionCard: {
    flex: 1, backgroundColor: COLORS.surface, borderWidth: 1,
    borderRadius: 20, padding: 14, alignItems: 'center', gap: 6,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  actionEmoji: { fontSize: 20 },
  actionTitle: { fontFamily: 'Lato_700Bold', fontSize: 12, color: COLORS.text, textAlign: 'center' },
  actionSub: { fontFamily: 'Lato_400Regular', fontSize: 10, color: COLORS.muted, textAlign: 'center' },

  journeyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  journeyStat: { alignItems: 'center', gap: 4 },
  journeyNum: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 30, color: COLORS.text },
  journeyLabel: { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.muted },
  journeyDivider: { width: 1, height: 44, backgroundColor: COLORS.border },
});