import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated, Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS, MOODS } from '../constants';

const { width } = Dimensions.get('window');
const BAR_MAX_H = 80;

export default function JournalScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ avg: 0, best: null, streak: 0 });
  const fadeIn = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  useEffect(() => {
    loadHistory();
    Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  const loadHistory = async () => {
    const raw = await AsyncStorage.getItem('echo_mood_history');
    if (!raw) return;
    const all = JSON.parse(raw);
    const now = Date.now();
    const recent = all
      .filter(e => now - e.timestamp < 14 * 24 * 60 * 60 * 1000)
      .sort((a, b) => a.timestamp - b.timestamp);
    setHistory(recent);

    if (recent.length) {
      const vals = recent.map(e => MOODS.find(m => m.id === e.moodId)?.value ?? 3);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const best = MOODS.find(m => m.value === Math.max(...vals));
      let streak = 0;
      const daySet = new Set(recent.map(e => e.date));
      let d = new Date();
      while (daySet.has(d.toDateString())) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
      setStats({ avg: avg.toFixed(1), best, streak });
    }
  };

  const getMood = (id) => MOODS.find(m => m.id === id) ?? MOODS[2];

  const last14 = (() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const entry = history.find(e => e.date === dateStr);
      days.push({
        dateStr,
        label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1),
        entry,
      });
    }
    return days;
  })();

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mood Journal</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avg || '—'}</Text>
            <Text style={styles.statLabel}>AVG MOOD</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { fontSize: 28 }]}>
              {stats.best?.emoji ?? '—'}
            </Text>
            <Text style={styles.statLabel}>BEST MOOD</Text>
          </View>
        </View>

        {/* 14-day bar chart */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>LAST 14 DAYS</Text>
          <View style={styles.barChart}>
            {last14.map((day, i) => {
              const mood = day.entry ? getMood(day.entry.moodId) : null;
              const barH = mood ? (mood.value / 5) * BAR_MAX_H : 4;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.barFill,
                      { height: barH, backgroundColor: mood?.color ?? COLORS.border },
                    ]} />
                  </View>
                  <Text style={styles.barLabel}>{day.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent entries */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>RECENT CHECK-INS</Text>
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyText}>
                Check in from the home screen each day to see your mood patterns here.
              </Text>
            </View>
          ) : (
            [...history].reverse().slice(0, 10).map((entry, i) => {
              const mood = getMood(entry.moodId);
              const d = new Date(entry.timestamp);
              const label = d.toLocaleDateString('en', {
                weekday: 'long', month: 'short', day: 'numeric',
              });
              return (
                <View key={i} style={[
                  styles.entryRow,
                  i === 0 && { borderTopWidth: 0 },
                ]}>
                  <View style={[styles.entryIconWrap, { backgroundColor: mood.color + '15' }]}>
                    <Text style={styles.entryEmoji}>{mood.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryMood, { color: mood.color }]}>
                      {mood.label}
                    </Text>
                    <Text style={styles.entryDate}>{label}</Text>
                  </View>
                  <View style={styles.entryBarWrap}>
                    <View style={[styles.entryBar, {
                      height: (mood.value / 5) * 32,
                      backgroundColor: mood.color,
                    }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Echo Insight */}
        {history.length >= 3 && (
          <View style={[styles.card, styles.insightCard]}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>🌙</Text>
              <Text style={styles.cardLabel}>ECHO'S INSIGHT</Text>
            </View>
            <Text style={styles.insightText}>
              {parseFloat(stats.avg) >= 4
                ? "You've been consistently positive lately. Echo notices — and is genuinely glad."
                : parseFloat(stats.avg) >= 3
                ? "Your mood has been balanced. Some highs, some lows — that's a full and honest life."
                : "It's been a harder stretch. Echo remembers every day. You don't have to carry it alone."}
            </Text>
          </View>
        )}

        <View style={{ height: 48 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingTop: 56, paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40, height: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    color: COLORS.text,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: COLORS.text,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  statValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: COLORS.text,
  },
  statLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 9,
    color: COLORS.muted,
    letterSpacing: 0.1,
  },

  // Card
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
  cardLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.12,
    marginBottom: 16,
  },

  // Bar chart
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: BAR_MAX_H + 24,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: COLORS.surfaceUp,
    borderRadius: 4,
    overflow: 'hidden',
    maxHeight: BAR_MAX_H,
  },
  barFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 9,
    color: COLORS.muted,
  },

  // Entries
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  entryIconWrap: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryEmoji: { fontSize: 20 },
  entryMood: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    marginBottom: 2,
  },
  entryDate: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: COLORS.muted,
  },
  entryBarWrap: {
    width: 6,
    height: 40,
    backgroundColor: COLORS.surfaceUp,
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  entryBar: {
    width: '100%',
    borderRadius: 3,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: COLORS.text,
  },
  emptyText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },

  // Insight
  insightCard: {
    borderColor: COLORS.accent + '30',
    backgroundColor: COLORS.accentSoft,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  insightIcon: { fontSize: 16 },
  insightText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: COLORS.textSoft,
    lineHeight: 22,
  },
});
