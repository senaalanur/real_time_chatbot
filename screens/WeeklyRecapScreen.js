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
const BACKEND_URL = 'https://lumaid-backend-production.up.railway.app';

export default function WeeklyRecapScreen({ navigation }) {
  const [moodData, setMoodData] = useState([]);
  const [stats, setStats] = useState(null);
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, Lato_400Regular, Lato_700Bold });

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
    const week = all.filter(e => now - e.timestamp < 7 * 24 * 60 * 60 * 1000).sort((a, b) => a.timestamp - b.timestamp);
    setMoodData(week);
    if (week.length >= 3) generateInsight(week);
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
        { role: 'system', content: "You are a warm wellness companion. Generate ONE emotionally resonant insight sentence (max 18 words) about the user's week. Be specific, personal, surprising. No generic advice. No emojis." },
        { role: 'user', content: `My mood this week: ${moodSummary}. Give me one insight.` },
      ];

      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      setInsight(data.text ?? '');
    } catch {
      setInsight('A week of honest moments — that takes real courage.');
    } finally {
      setLoadingInsight(false);
    }
  };

  const shareRecap = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const moodLine = moodData.map(e => MOODS.find(m => m.id === e.moodId)?.emoji ?? '○').join(' ');
    const avgValue = moodData.length
      ? moodData.reduce((sum, e) => sum + (MOODS.find(m => m.id === e.moodId)?.value ?? 3), 0) / moodData.length : 0;
    const avgLabel = avgValue >= 4 ? 'Great' : avgValue >= 3 ? 'Good' : avgValue >= 2 ? 'Okay' : 'Tough';
    try {
      await Share.share({
        message: `✦ My Lumaid Weekly Recap\n\n${moodLine}\n\nAverage mood: ${avgLabel}\n\n"${insight}"\n\nTracked with Lumaid — your AI wellness companion.`,
      });
    } catch {}
  };

  const getMoodColor = (id) => MOODS.find(m => m.id === id)?.color ?? COLORS.muted;
  const getMoodValue = (id) => MOODS.find(m => m.id === id)?.value ?? 3;
  const getMoodLabel = (id) => MOODS.find(m => m.id === id)?.label ?? '';

  const avgMood = moodData.length
    ? moodData.reduce((sum, e) => sum + getMoodValue(e.moodId), 0) / moodData.length : 0;

  const dominantMood = moodData.reduce((acc, e) => {
    acc[e.moodId] = (acc[e.moodId] || 0) + 1;
    return acc;
  }, {});

  const topMoodId = Object.keys(dominantMood).sort((a, b) => dominantMood[b] - dominantMood[a])[0];
  const topMood = MOODS.find(m => m.id === topMoodId);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const entry = moodData.find(e => new Date(e.timestamp).toDateString() === dateStr);
    return { label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 3), entry, dateStr };
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <View style={[styles.blobTop, { backgroundColor: COLORS.accentGlow }]} />
      <View style={[styles.blobBottom, { backgroundColor: COLORS.cyanGlow }]} />

      <Animated.ScrollView style={{ opacity: fadeIn }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Weekly Recap</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={shareRecap}>
            <Text style={styles.shareBtnText}>Share ↗</Text>
          </TouchableOpacity>
        </View>

        {moodData.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyOrb}>
              <Text style={styles.emptyOrbText}>📊</Text>
            </View>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyText}>Check in with your mood daily from the home screen. Your recap appears after 3+ check-ins.</Text>
          </View>
        ) : (
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={[styles.statNum, { color: COLORS.accent }]}>{avgMood.toFixed(1)}</Text>
                <Text style={styles.statLabel}>AVG MOOD</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNum, { color: COLORS.cyan }]}>{moodData.length}</Text>
                <Text style={styles.statLabel}>CHECK-INS</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNum, { color: topMood?.color ?? COLORS.text, fontSize: 22 }]}>{topMood?.label ?? '—'}</Text>
                <Text style={styles.statLabel}>TOP MOOD</Text>
              </View>
            </View>

            {/* 7-day arc */}
            <View style={styles.glassCard}>
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
                      {day.entry && <View style={[styles.barDot, { backgroundColor: color }]} />}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* AI Insight — Spotify Wrapped style */}
            <View style={[styles.insightCard, { borderColor: COLORS.accent + '40' }]}>
              <View style={styles.insightTop}>
                <Text style={styles.insightIcon}>✦</Text>
                <Text style={styles.insightLabel}>LUMAID'S REFLECTION</Text>
              </View>
              {loadingInsight ? (
                <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 16 }} />
              ) : (
                <Text style={styles.insightText}>{insight || 'Generating your personal reflection...'}</Text>
              )}
              <View style={styles.insightMoodRow}>
                {moodData.slice(-7).map((e, i) => (
                  <Text key={i} style={[styles.insightMoodEmoji, { color: getMoodColor(e.moodId) }]}>
                    {MOODS.find(m => m.id === e.moodId)?.emoji}
                  </Text>
                ))}
              </View>
            </View>

            {/* Breakdown */}
            <View style={styles.glassCard}>
              <Text style={styles.cardLabel}>MOOD BREAKDOWN</Text>
              {Object.entries(dominantMood).sort((a, b) => b[1] - a[1]).map(([moodId, count]) => {
                const mood = MOODS.find(m => m.id === moodId);
                const pct = Math.round((count / moodData.length) * 100);
                return (
                  <View key={moodId} style={styles.breakdownRow}>
                    <Text style={[styles.breakdownEmoji, { color: mood?.color }]}>{mood?.emoji}</Text>
                    <Text style={[styles.breakdownLabel, { color: mood?.color }]}>{mood?.label}</Text>
                    <View style={styles.breakdownBarWrap}>
                      <View style={[styles.breakdownBar, { width: `${pct}%`, backgroundColor: mood?.color }]} />
                    </View>
                    <Text style={[styles.breakdownPct, { color: mood?.color }]}>{pct}%</Text>
                  </View>
                );
              })}
            </View>

            {/* Share CTA */}
            <TouchableOpacity style={styles.shareCta} onPress={shareRecap}>
              <Text style={styles.shareCtaEmoji}>✦</Text>
              <Text style={styles.shareCtaTitle}>Share Your Week</Text>
              <Text style={styles.shareCtaSub}>Send your mood summary + reflection to friends</Text>
              <View style={styles.shareCtaBtn}>
                <Text style={styles.shareCtaBtnText}>Share Recap ↗</Text>
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
  blobTop: {
    position: 'absolute', width: width * 1.3, height: width * 0.9,
    borderRadius: width * 0.65, top: -width * 0.35, alignSelf: 'center', opacity: 0.15,
  },
  blobBottom: {
    position: 'absolute', width: width * 0.9, height: width * 0.8,
    borderRadius: width * 0.5, bottom: -width * 0.3, right: -width * 0.3, opacity: 0.1,
  },
  scroll: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: {
    width: 40, height: 40, backgroundColor: COLORS.surface, borderRadius: 13,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 18, color: COLORS.text },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: COLORS.text },
  shareBtn: {
    backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: COLORS.accent + '40',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  shareBtnText: { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.accent },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 20 },
  emptyOrb: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyOrbText: { fontSize: 36 },
  emptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: COLORS.text, marginBottom: 10 },
  emptyText: { fontFamily: 'Lato_400Regular', fontSize: 14, color: COLORS.textSoft, textAlign: 'center', lineHeight: 22 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, padding: 16, alignItems: 'center', gap: 5,
  },
  statNum: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: COLORS.text },
  statLabel: { fontFamily: 'Lato_700Bold', fontSize: 9, color: COLORS.muted, letterSpacing: 0.1 },

  glassCard: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 22, padding: 18, marginBottom: 12,
  },
  cardLabel: { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 0.12, marginBottom: 14 },

  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 110 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: {
    flex: 1, width: '100%', justifyContent: 'flex-end',
    backgroundColor: COLORS.surfaceUp, borderRadius: 8, overflow: 'hidden', maxHeight: 80,
  },
  barFill: { width: '100%', borderRadius: 8, minHeight: 4 },
  barLabel: { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted },
  barDot: { width: 5, height: 5, borderRadius: 3 },

  insightCard: {
    backgroundColor: COLORS.accentSoft, borderWidth: 1,
    borderRadius: 22, padding: 22, marginBottom: 12,
  },
  insightTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  insightIcon: { fontSize: 14, color: COLORS.accent },
  insightLabel: { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 0.12 },
  insightText: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18,
    color: COLORS.text, lineHeight: 28, fontStyle: 'italic', marginBottom: 16,
  },
  insightMoodRow: { flexDirection: 'row', gap: 8 },
  insightMoodEmoji: { fontSize: 20, fontFamily: 'Lato_700Bold' },

  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  breakdownEmoji: { fontSize: 16, fontFamily: 'Lato_700Bold', width: 22 },
  breakdownLabel: { fontFamily: 'Lato_700Bold', fontSize: 13, width: 52 },
  breakdownBarWrap: { flex: 1, height: 6, backgroundColor: COLORS.surfaceUp, borderRadius: 3, overflow: 'hidden' },
  breakdownBar: { height: '100%', borderRadius: 3 },
  breakdownPct: { fontFamily: 'Lato_700Bold', fontSize: 12, width: 36, textAlign: 'right' },

  shareCta: {
    backgroundColor: COLORS.accent, borderRadius: 22, padding: 24,
    alignItems: 'center', gap: 8, marginBottom: 12,
  },
  shareCtaEmoji: { fontSize: 24, color: COLORS.white },
  shareCtaTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: COLORS.white },
  shareCtaSub: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.white, opacity: 0.85, textAlign: 'center', lineHeight: 20 },
  shareCtaBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  shareCtaBtnText: { fontFamily: 'Lato_700Bold', fontSize: 14, color: COLORS.white },
});