import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, MOODS } from '../constants';

const { width } = Dimensions.get('window');
const BACKEND_URL = __DEV__
  ? 'http://192.168.1.137:3001'
  : 'https://lumaid-backend-production.up.railway.app';

export default function WeeklyRecapScreen({ navigation }) {
  const [moodData, setMoodData] = useState([]);
  const [stats, setStats] = useState(null);
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  useEffect(() => {
    loadWeekData();
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const loadWeekData = async () => {
    const raw = await AsyncStorage.getItem('lumaid_mood_history');
    const statsRaw = await AsyncStorage.getItem('lumaid_stats');
    if (statsRaw) setStats(JSON.parse(statsRaw));

    if (!raw) return;

    const all = JSON.parse(raw);
    const now = Date.now();
    const week = all
      .filter(e => now - e.timestamp < 7 * 24 * 60 * 60 * 1000)
      .sort((a, b) => a.timestamp - b.timestamp);

    setMoodData(week);

    if (week.length >= 3) {
      generateInsight(week);
    }
  };

  const generateInsight = async (week) => {
    setLoadingInsight(true);
    try {
      const moodSummary = week.map(e => {
        const mood = MOODS.find(m => m.id === e.moodId);
        const date = new Date(e.timestamp).toLocaleDateString('en', { weekday: 'short' });
        return `${date}: ${mood?.label ?? 'Unknown'}`;
      }).join(', ');

      const messages = [
        {
          role: 'system',
          content: 'You are a warm wellness companion. Generate a single, emotionally resonant insight sentence (max 20 words) about the user\'s week based on their mood data. Be specific, personal, and surprising. No generic advice.',
        },
        {
          role: 'user',
          content: `My mood this week: ${moodSummary}. Give me one insight sentence.`,
        },
      ];

      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      const data = await res.json();
      setInsight(data.text ?? '');
    } catch {
      setInsight('A week of honest moments — that takes courage.');
    } finally {
      setLoadingInsight(false);
    }
  };

  const shareRecap = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const moodLine = moodData.map(e => {
      const mood = MOODS.find(m => m.id === e.moodId);
      return mood?.emoji ?? '○';
    }).join(' ');

    const avgValue = moodData.length
      ? moodData.reduce((sum, e) => sum + (MOODS.find(m => m.id === e.moodId)?.value ?? 3), 0) / moodData.length
      : 0;

    const avgLabel = avgValue >= 4 ? 'Great' : avgValue >= 3 ? 'Good' : avgValue >= 2 ? 'Okay' : 'Tough';

    try {
      await Share.share({
        message: `My Lumaid Weekly Recap ✦\n\nMood this week: ${moodLine}\nAverage: ${avgLabel}\n\n"${insight}"\n\n— tracked with Lumaid`,
      });
    } catch {}
  };

  const getMoodColor = (moodId) => MOODS.find(m => m.id === moodId)?.color ?? COLORS.muted;
  const getMoodValue = (moodId) => MOODS.find(m => m.id === moodId)?.value ?? 3;
  const getMoodLabel = (moodId) => MOODS.find(m => m.id === moodId)?.label ?? '';

  const avgMood = moodData.length
    ? moodData.reduce((sum, e) => sum + getMoodValue(e.moodId), 0) / moodData.length
    : 0;

  const dominantMood = moodData.length
    ? moodData.reduce((acc, e) => {
        acc[e.moodId] = (acc[e.moodId] || 0) + 1;
        return acc;
      }, {})
    : {};

  const topMoodId = Object.keys(dominantMood).sort((a, b) => dominantMood[b] - dominantMood[a])[0];
  const topMood = MOODS.find(m => m.id === topMoodId);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const entry = moodData.find(e => new Date(e.timestamp).toDateString() === dateStr);
    return {
      label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1),
      entry,
      dateStr,
    };
  });

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
          <Text style={styles.title}>Weekly Recap</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={shareRecap}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>

        {moodData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✦</Text>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyText}>
              Check in with your mood daily from the home screen. Your weekly recap will appear here after 3+ check-ins.
            </Text>
          </View>
        ) : (
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{avgMood.toFixed(1)}</Text>
                <Text style={styles.statLabel}>AVG MOOD</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{moodData.length}</Text>
                <Text style={styles.statLabel}>CHECK-INS</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: topMood?.color ?? COLORS.text, fontSize: 22 }]}>
                  {topMood?.label ?? '—'}
                </Text>
                <Text style={styles.statLabel}>TOP MOOD</Text>
              </View>
            </View>

            {/* Mood arc — 7 day bar chart */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>THIS WEEK</Text>
              <View style={styles.barChart}>
                {last7Days.map((day, i) => {
                  const val = day.entry ? getMoodValue(day.entry.moodId) : 0;
                  const color = day.entry ? getMoodColor(day.entry.moodId) : COLORS.border;
                  const barH = day.entry ? (val / 5) * 80 : 4;
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { height: barH, backgroundColor: color }]} />
                      </View>
                      <Text style={styles.barLabel}>{day.label}</Text>
                      {day.entry && (
                        <View style={[styles.barDot, { backgroundColor: color }]} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* AI Insight */}
            <View style={[styles.card, styles.insightCard]}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>✦</Text>
                <Text style={styles.cardLabel}>LUMAID'S REFLECTION</Text>
              </View>
              {loadingInsight ? (
                <ActivityIndicator color={COLORS.accent} />
              ) : (
                <Text style={styles.insightText}>
                  {insight || 'Generating your personal reflection...'}
                </Text>
              )}
            </View>

            {/* Mood breakdown */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>MOOD BREAKDOWN</Text>
              {Object.entries(dominantMood)
                .sort((a, b) => b[1] - a[1])
                .map(([moodId, count]) => {
                  const mood = MOODS.find(m => m.id === moodId);
                  const pct = Math.round((count / moodData.length) * 100);
                  return (
                    <View key={moodId} style={styles.breakdownRow}>
                      <View style={[styles.breakdownDot, { backgroundColor: mood?.color }]} />
                      <Text style={styles.breakdownLabel}>{mood?.label}</Text>
                      <View style={styles.breakdownBarWrap}>
                        <View style={[styles.breakdownBar, {
                          width: `${pct}%`,
                          backgroundColor: mood?.color,
                        }]} />
                      </View>
                      <Text style={[styles.breakdownPct, { color: mood?.color }]}>{pct}%</Text>
                    </View>
                  );
                })}
            </View>

            {/* Share card */}
            <TouchableOpacity style={styles.shareCard} onPress={shareRecap}>
              <Text style={styles.shareCardTitle}>Share Your Week</Text>
              <Text style={styles.shareCardSub}>
                Export your mood summary and reflection to Instagram Stories or TikTok
              </Text>
              <View style={styles.shareCardBtn}>
                <Text style={styles.shareCardBtnText}>Share Recap ↗</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 48 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40, height: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 18, color: COLORS.text },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: COLORS.text,
  },
  shareBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: COLORS.white,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    color: COLORS.accent,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 10,
  },
  emptyText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: COLORS.textSoft,
    textAlign: 'center',
    lineHeight: 22,
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: COLORS.text,
  },
  statLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 9,
    color: COLORS.muted,
    letterSpacing: 0.1,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  cardLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.12,
    marginBottom: 14,
  },

  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 110,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: COLORS.surfaceUp,
    borderRadius: 6,
    overflow: 'hidden',
    maxHeight: 80,
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 10,
    color: COLORS.muted,
  },
  barDot: {
    width: 5, height: 5,
    borderRadius: 3,
  },

  insightCard: {
    borderColor: COLORS.accent + '35',
    backgroundColor: COLORS.accentSoft,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  insightIcon: {
    fontSize: 14,
    color: COLORS.accent,
  },
  insightText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 26,
    fontStyle: 'italic',
  },

  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  breakdownDot: {
    width: 8, height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: COLORS.text,
    width: 48,
  },
  breakdownBarWrap: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surfaceUp,
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownPct: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    width: 36,
    textAlign: 'right',
  },

  shareCard: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  shareCardTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: COLORS.white,
  },
  shareCardSub: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.85,
    textAlign: 'center',
    lineHeight: 20,
  },
  shareCardBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  shareCardBtnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: COLORS.white,
  },
});