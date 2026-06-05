import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import ViewShot from 'react-native-view-shot';
import { COLORS, MOODS } from '../constants';

const { width } = Dimensions.get('window');
const CARD_W = width - 32;
const CARD_H = CARD_W * (19.5 / 9);
const BACKEND_URL = 'https://lumaid-backend-production-bee3.up.railway.app';

const getMoodColor = (id) => MOODS.find(m => m.id === id)?.color ?? COLORS.muted;
const getMoodValue = (id) => MOODS.find(m => m.id === id)?.value ?? 3;

const weekRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const fmt = (d) => d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(now)}, ${now.getFullYear()}`;
};

const heroWord = (topMood) => {
  const map = {
    great: { word: 'Bright',  sub: 'This was one of your better weeks.' },
    good:  { word: 'Steady',  sub: 'A balanced, grounded kind of week.' },
    okay:  { word: 'Even',    sub: 'You held it together — that counts.' },
    low:   { word: 'Heavy',   sub: "Some weeks just weigh more. That's okay." },
    rough: { word: 'Hard',    sub: "A tough week — but you're still here." },
  };
  return map[topMood?.id] ?? { word: 'Present', sub: 'You showed up this week.' };
};

// ── Shareable card component ───────────────────────────────────────────────────
function WrappedCard({ moodData, insight, topMood, avgMood, last7Days }) {
  const topColor = topMood?.color ?? COLORS.accent;
  const { word, sub } = heroWord(topMood);
  const avgLabel = avgMood >= 4.5 ? 'Great' : avgMood >= 3.5 ? 'Good' : avgMood >= 2.5 ? 'Okay' : avgMood >= 1.5 ? 'Low' : 'Rough';

  return (
    <View style={[wc.root, { width: CARD_W, height: CARD_H }]}>
      <View style={[wc.orb1, { backgroundColor: topColor }]} />
      <View style={[wc.orb2, { backgroundColor: COLORS.accent }]} />
      <View style={wc.darkOverlay} />

      <View style={wc.header}>
        <View>
          <Text style={wc.appName}>lumaid</Text>
          <Text style={wc.weekStr}>{weekRange()}</Text>
        </View>
        <Text style={wc.weekTag}>WEEKLY WRAP</Text>
      </View>

      <View style={wc.heroSection}>
        <Text style={wc.heroLabel}>YOUR WEEK IN ONE WORD</Text>
        <Text style={[wc.heroWord, { color: topColor }]}>{word}</Text>
        <Text style={wc.heroSub}>{sub}</Text>
      </View>

      <View style={[wc.insightBox, { borderColor: topColor + '40' }]}>
        <Text style={wc.insightText}>
          "{insight || 'You showed up honestly this week — that takes more courage than it looks.'}"
        </Text>
      </View>

      <View style={wc.chartSection}>
        <Text style={wc.sectionLabel}>7-DAY MOOD ARC</Text>
        <View style={wc.bars}>
          {last7Days.map((day, i) => {
            const val = day.entry ? getMoodValue(day.entry.moodId) : 0;
            const color = day.entry ? getMoodColor(day.entry.moodId) : 'rgba(255,255,255,0.07)';
            const barPct = day.entry ? Math.max((val / 5) * 100, 8) : 8;
            return (
              <View key={i} style={wc.barCol}>
                <View style={wc.barTrack}>
                  <View style={[wc.barFill, { height: `${barPct}%`, backgroundColor: color }]} />
                </View>
                <Text style={wc.barDay}>{day.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={wc.statsBox}>
        <View style={wc.statItem}>
          <Text style={[wc.statNum, { color: topColor }]}>{avgMood.toFixed(1)}</Text>
          <Text style={wc.statLabel}>AVG MOOD</Text>
        </View>
        <View style={wc.statDivider} />
        <View style={wc.statItem}>
          <Text style={[wc.statNum, { color: COLORS.cyan }]}>{moodData.length}</Text>
          <Text style={wc.statLabel}>CHECK-INS</Text>
        </View>
        <View style={wc.statDivider} />
        <View style={wc.statItem}>
          <Text style={[wc.statNum, { color: topColor, fontSize: 16 }]}>{avgLabel}</Text>
          <Text style={wc.statLabel}>OVERALL</Text>
        </View>
      </View>

      <View style={wc.dotsRow}>
        {moodData.slice(0, 7).map((e, i) => (
          <View key={i} style={[wc.dot, { backgroundColor: getMoodColor(e.moodId) }]} />
        ))}
      </View>

      <Text style={wc.footer}>lumaid.app · your AI wellness companion</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function WeeklyRecapScreen({ navigation }) {
  const [moodData, setMoodData] = useState([]);
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardRef = useRef(null);

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, Lato_400Regular, Lato_700Bold });

  useEffect(() => {
    loadWeekData();
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const loadWeekData = async () => {
    const raw = await AsyncStorage.getItem('lumaid_mood_history');
    if (!raw) return;
    const all = JSON.parse(raw);
    const now = Date.now();
    const week = all
      .filter(e => now - e.timestamp < 7 * 24 * 60 * 60 * 1000)
      .sort((a, b) => a.timestamp - b.timestamp);
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
        { role: 'system', content: "You are a warm wellness companion. Generate ONE emotionally resonant insight sentence (max 18 words) about the user's week. Be specific, personal, surprising. No generic advice. No emojis. Start lowercase." },
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
      setInsight('a week of honest moments — that takes real courage.');
    } finally {
      setLoadingInsight(false);
    }
  };

  const shareAsImage = async () => {
    if (!cardRef.current || loadingInsight) return;
    setCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const uri = await cardRef.current.capture();
      await Share.share({ url: uri, title: 'My Lumaid Weekly Wrap' });
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setCapturing(false);
    }
  };

  const saveToGallery = async () => {
    if (!cardRef.current || loadingInsight) return;
    setCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo access to save your recap.');
        return;
      }
      const uri = await cardRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', 'Your recap card was saved to your camera roll.');
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setCapturing(false);
    }
  };

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
    return { label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1), entry };
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <View style={[styles.blobTop, { backgroundColor: COLORS.accentGlow }]} />
      <View style={[styles.blobBottom, { backgroundColor: COLORS.cyanGlow }]} />

      <Animated.ScrollView style={{ opacity: fadeIn }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Weekly Recap</Text>
          <View style={{ width: 40 }} />
        </View>

        {moodData.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyOrb}><Text style={styles.emptyOrbText}>📊</Text></View>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyText}>Check in with your mood daily. Your recap appears after 3+ check-ins.</Text>
          </View>
        ) : (
          <>
            {loadingInsight && (
              <View style={styles.loadingBanner}>
                <ActivityIndicator color={COLORS.accent} size="small" />
                <Text style={styles.loadingText}>Generating your reflection...</Text>
              </View>
            )}

            <ViewShot ref={cardRef} options={{ format: 'png', quality: 1.0 }} style={styles.cardShot}>
              <WrappedCard
                moodData={moodData}
                insight={insight}
                topMood={topMood}
                avgMood={avgMood}
                last7Days={last7Days}
              />
            </ViewShot>

            <Text style={styles.shareHint}>✦  Tap to share your recap as a beautiful image</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btnPrimary, (capturing || loadingInsight) && { opacity: 0.5 }]}
                onPress={shareAsImage}
                disabled={capturing || loadingInsight}
              >
                {capturing
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnPrimaryText}>Share to Instagram / iMessage ↗</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSecondary, (capturing || loadingInsight) && { opacity: 0.5 }]}
                onPress={saveToGallery}
                disabled={capturing || loadingInsight}
              >
                <Text style={styles.btnSecondaryText}>Save to Camera Roll</Text>
              </TouchableOpacity>
            </View>

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
          </>
        )}
        <View style={{ height: 60 }} />
      </Animated.ScrollView>
    </View>
  );
}

const wc = StyleSheet.create({
  root: { backgroundColor: '#08060F', borderRadius: 28, overflow: 'hidden', padding: 24, justifyContent: 'space-between' },
  orb1: { position: 'absolute', width: CARD_W * 0.95, height: CARD_W * 0.95, borderRadius: CARD_W * 0.475, top: -CARD_W * 0.45, left: -CARD_W * 0.2, opacity: 0.2 },
  orb2: { position: 'absolute', width: CARD_W * 0.65, height: CARD_W * 0.65, borderRadius: CARD_W * 0.325, bottom: CARD_W * 0.05, right: -CARD_W * 0.2, opacity: 0.1 },
  darkOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#08060F', opacity: 0.55 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, zIndex: 1 },
  appName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: '#FFFFFF', letterSpacing: 5 },
  weekStr: { fontFamily: 'Lato_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 3, letterSpacing: 0.3 },
  weekTag: { fontFamily: 'Lato_700Bold', fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.2, marginTop: 4 },
  heroSection: { marginBottom: 16, zIndex: 1 },
  heroLabel: { fontFamily: 'Lato_700Bold', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.2, marginBottom: 6 },
  heroWord: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 58, lineHeight: 62 },
  heroSub: { fontFamily: 'Lato_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  insightBox: { borderWidth: 1, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, marginBottom: 18, zIndex: 1 },
  insightText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 21, fontStyle: 'italic' },
  chartSection: { marginBottom: 16, zIndex: 1 },
  sectionLabel: { fontFamily: 'Lato_700Bold', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.2, marginBottom: 8 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 60 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden', maxHeight: 50 },
  barFill: { width: '100%', borderRadius: 5 },
  barDay: { fontFamily: 'Lato_700Bold', fontSize: 8, color: 'rgba(255,255,255,0.3)' },
  statsBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12, marginBottom: 16, zIndex: 1 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },
  statNum: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: '#FFFFFF' },
  statLabel: { fontFamily: 'Lato_700Bold', fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.15 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 16, zIndex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  footer: { fontFamily: 'Lato_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: 0.3, zIndex: 1 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  blobTop: { position: 'absolute', width: width * 1.3, height: width * 0.9, borderRadius: width * 0.65, top: -width * 0.35, alignSelf: 'center', opacity: 0.15 },
  blobBottom: { position: 'absolute', width: width * 0.9, height: width * 0.8, borderRadius: width * 0.5, bottom: -width * 0.3, right: -width * 0.3, opacity: 0.1 },
  scroll: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 40, height: 40, backgroundColor: COLORS.surface, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18, color: COLORS.text },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: COLORS.text },
  loadingBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.accentSoft, borderRadius: 14, padding: 12, marginBottom: 14 },
  loadingText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.accent },
  cardShot: { borderRadius: 28, marginBottom: 16, overflow: 'hidden' },
  shareHint: { fontFamily: 'Lato_400Regular', fontSize: 12, color: COLORS.muted, textAlign: 'center', marginBottom: 14 },
  actionRow: { gap: 10, marginBottom: 20 },
  btnPrimary: { backgroundColor: COLORS.accent, borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { fontFamily: 'Lato_700Bold', fontSize: 15, color: '#FFFFFF', letterSpacing: 0.3 },
  btnSecondary: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  btnSecondaryText: { fontFamily: 'Lato_400Regular', fontSize: 15, color: COLORS.textSoft },
  glassCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, padding: 18, marginBottom: 12 },
  cardLabel: { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 0.12, marginBottom: 14 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  breakdownEmoji: { fontSize: 16, width: 22 },
  breakdownLabel: { fontFamily: 'Lato_700Bold', fontSize: 13, width: 52 },
  breakdownBarWrap: { flex: 1, height: 6, backgroundColor: COLORS.surfaceUp, borderRadius: 3, overflow: 'hidden' },
  breakdownBar: { height: '100%', borderRadius: 3 },
  breakdownPct: { fontFamily: 'Lato_700Bold', fontSize: 12, width: 36, textAlign: 'right' },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 20 },
  emptyOrb: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyOrbText: { fontSize: 36 },
  emptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: COLORS.text, marginBottom: 10 },
  emptyText: { fontFamily: 'Lato_400Regular', fontSize: 14, color: COLORS.textSoft, textAlign: 'center', lineHeight: 22 },
});