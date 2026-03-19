import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated, Dimensions,
    Easing,
    StyleSheet,
    Text, TouchableOpacity,
    View
} from 'react-native';
import { COLORS, MOODS, SOULS } from '../constants';

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

  const loadData = async () => {
    const userRaw = await AsyncStorage.getItem('echo_user');
    const statsRaw = await AsyncStorage.getItem('echo_stats');
    const moodRaw = await AsyncStorage.getItem('echo_today_mood');

    if (userRaw) {
      const u = JSON.parse(userRaw);
      setUser(u);
      setSoul(SOULS[u.soul] || SOULS.zen);
    }
    if (statsRaw) setStats(JSON.parse(statsRaw));
    if (moodRaw) {
      const m = JSON.parse(moodRaw);
      const today = new Date().toDateString();
      if (m.date === today) setTodayMood(m.moodId);
    }
  };

  const startOrbAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orbPulse, { toValue: 1.06, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(orbGlow,  { toValue: 1,    duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(orbPulse, { toValue: 0.96, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(orbGlow,  { toValue: 0.4,  duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ])
    ).start();
  };

  const switchSoul = async (newSoul) => {
    setSoul(newSoul);
    setShowSoulPicker(false);
    const userRaw = await AsyncStorage.getItem('echo_user');
    if (userRaw) {
      const u = JSON.parse(userRaw);
      u.soul = newSoul.id;
      await AsyncStorage.setItem('echo_user', JSON.stringify(u));
    }
  };

  const logMood = async (moodId) => {
    setTodayMood(moodId);
    const entry = { moodId, date: new Date().toDateString(), timestamp: Date.now() };
    await AsyncStorage.setItem('echo_today_mood', JSON.stringify(entry));
    const histRaw = await AsyncStorage.getItem('echo_mood_history');
    const hist = histRaw ? JSON.parse(histRaw) : [];
    hist.push(entry);
    await AsyncStorage.setItem('echo_mood_history', JSON.stringify(hist));
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (!fontsLoaded) return null;

  const currentMood = MOODS.find(m => m.id === todayMood);

  return (
    <View style={styles.root}>
      {/* Soft ambient glow */}
      <Animated.View style={[styles.ambientGlow, {
        backgroundColor: soul.glow,
        opacity: orbGlow,
        transform: [{ scale: orbPulse }],
      }]} />

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
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
            style={[styles.soulBadge, {
              borderColor: soul.color + '60',
              backgroundColor: soul.glow,
            }]}
            onPress={() => setShowSoulPicker(!showSoulPicker)}
          >
            <Text style={styles.soulBadgeEmoji}>{soul.emoji}</Text>
            <Text style={[styles.soulBadgeName, { color: soul.color }]}>{soul.name}</Text>
            <Text style={[styles.soulChevron, { color: soul.color }]}>
              {showSoulPicker ? '↑' : '↓'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Soul Picker */}
        {showSoulPicker && (
          <View style={styles.soulPicker}>
            <Text style={styles.soulPickerTitle}>Switch companion</Text>
            {Object.values(SOULS).map(s => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.soulPickerItem,
                  soul.id === s.id && {
                    backgroundColor: `${s.color}10`,
                    borderColor: `${s.color}40`,
                  },
                ]}
                onPress={() => switchSoul(s)}
              >
                <View style={[styles.soulPickerIcon, { backgroundColor: `${s.color}15` }]}>
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
          </View>
        )}

        {/* Central Orb */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Chat', { soul: soul.id })}
          style={styles.orbContainer}
        >
          <Animated.View style={[styles.orbOuter, {
            borderColor: soul.color + '30',
            transform: [{ scale: orbPulse }],
          }]}>
            <View style={[styles.orbMiddle, { backgroundColor: soul.glow }]}>
              <View style={[styles.orbInner, { backgroundColor: soul.color + '20' }]}>
                <View style={[styles.orbCore, { backgroundColor: soul.color }]}>
                  <Text style={styles.orbCoreEmoji}>{soul.emoji}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
          <Text style={styles.orbLabel}>Tap to talk with {soul.name}</Text>
          <View style={[styles.orbCta, { backgroundColor: soul.color }]}>
            <Text style={styles.orbCtaText}>Start conversation</Text>
          </View>
        </TouchableOpacity>

        {/* Mood Check-in */}
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
              <View style={[styles.moodDoneIcon, { backgroundColor: currentMood?.color + '15' }]}>
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
                <TouchableOpacity
                  key={m.id}
                  style={styles.moodBtn}
                  onPress={() => logMood(m.id)}
                >
                  <View style={[styles.moodIconWrap, { backgroundColor: m.color + '15' }]}>
                    <Text style={[styles.moodEmoji, { color: m.color }]}>{m.emoji}</Text>
                  </View>
                  <Text style={styles.moodLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: soul.color + '30' }]}
            onPress={() => navigation.navigate('Chat', { soul: soul.id })}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: soul.color + '15' }]}>
              <Text style={styles.actionIcon}>💬</Text>
            </View>
            <Text style={styles.actionTitle}>Talk to Echo</Text>
            <Text style={styles.actionSub}>Start a conversation</Text>
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

        {/* Memory Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ECHO REMEMBERS</Text>
          <Text style={styles.memoryText}>
            {stats.totalChats === 0
              ? "Start your first conversation — Echo will remember what matters to you across every session."
              : `You've had ${stats.totalChats} exchange${stats.totalChats !== 1 ? 's' : ''} with Echo. Your journey is being quietly remembered.`}
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
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    top: -width * 0.6,
    alignSelf: 'center',
    zIndex: 0,
  },
  scroll: { paddingTop: 60, paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  soulBadgeEmoji: { fontSize: 15 },
  soulBadgeName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
  },
  soulChevron: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
  },

  // Soul picker
  soulPicker: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  soulPickerTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.1,
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
    marginBottom: 6,
  },
  soulPickerIcon: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soulPickerName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 2,
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
  orbContainer: { alignItems: 'center', marginVertical: 28 },
  orbOuter: {
    width: 180, height: 180,
    borderRadius: 90,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  orbMiddle: {
    width: 148, height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    width: 116, height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbCore: {
    width: 72, height: 72,
    borderRadius: 36,
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
    paddingHorizontal: 24,
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
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.12,
  },
  cardAction: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: COLORS.accent,
  },

  // Mood
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: { alignItems: 'center', gap: 6, flex: 1 },
  moodIconWrap: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  moodEmoji: { fontSize: 20, fontFamily: 'Lato_700Bold' },
  moodLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 10,
    color: COLORS.muted,
  },
  moodDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  moodDoneIcon: {
    width: 56, height: 56,
    borderRadius: 16,
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

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
  actionIconWrap: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionIcon: { fontSize: 22 },
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
    marginTop: 10,
  },
});