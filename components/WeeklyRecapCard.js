import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants';
import { isProUser } from '../lib/purchases';

const NEEDED = 3;
const DAY = 24 * 60 * 60 * 1000;

export default function WeeklyRecapCard({ refreshKey }) {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const [count, setCount] = useState(0);
  const [pro, setPro] = useState(false);

  useEffect(() => {
    if (!focused) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('lumaid_mood_history');
        const all = raw ? JSON.parse(raw) : [];
        const cutoff = Date.now() - 7 * DAY;
        setCount(new Set(all.filter(e => e && e.timestamp >= cutoff).map(e => e.date)).size);
      } catch {}
      try { setPro(await isProUser()); } catch {}
    })();
  }, [focused, refreshKey]);

  const ready = count >= NEEDED;

  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WeeklyRecap')} activeOpacity={0.85}>
      <View style={styles.top}>
        <Text style={styles.label}>{pro ? '' : '🔒 '}WEEKLY RECAP</Text>
        <Text style={styles.arrow}>→</Text>
      </View>
      <Text style={styles.title}>{ready ? 'Your week is ready' : 'Your week, in one card'}</Text>
      {ready ? (
        <Text style={styles.sub}>
          {pro
            ? 'Your mood story, a note from your companion, and a gentle plan for next week.'
            : 'See your week as a shareable card. Unlock the full reflection with Pro.'}
        </Text>
      ) : (
        <>
          <View style={styles.track}>
            <View style={[styles.fill, { width: Math.min(100, (count / NEEDED) * 100) + '%' }]} />
          </View>
          <Text style={styles.sub}>{count} of {NEEDED} check-ins this week to unlock your recap</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, padding: 18, marginBottom: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 1.5 },
  arrow: { fontFamily: 'Lato_700Bold', fontSize: 16, color: COLORS.accentDark },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: COLORS.text, marginBottom: 8 },
  sub: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.textSoft, lineHeight: 19 },
  track: { height: 6, borderRadius: 3, backgroundColor: COLORS.surfaceUp, overflow: 'hidden', marginBottom: 10 },
  fill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.accent },
});
