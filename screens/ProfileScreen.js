import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS, SOULS } from '../constants';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [soul, setSoul] = useState(SOULS.zen);
  const [streak, setStreak] = useState(0);
  const [totalChats, setTotalChats] = useState(0);
  const [email, setEmail] = useState('');

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userRaw = await AsyncStorage.getItem('lumaid_user');
    const statsRaw = await AsyncStorage.getItem('lumaid_stats');
    const histRaw = await AsyncStorage.getItem('lumaid_mood_history');

    if (userRaw) {
      const u = JSON.parse(userRaw);
      setUser(u);
      setSoul(SOULS[u.soul] || SOULS.zen);
    }
    if (statsRaw) {
      const s = JSON.parse(statsRaw);
      setTotalChats(s.totalChats ?? 0);
    }
    if (histRaw) {
      const hist = JSON.parse(histRaw);
      let s = 0;
      const daySet = new Set(hist.map(e => e.date));
      let d = new Date();
      while (daySet.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
      setStreak(s);
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) setEmail(authUser.email ?? '');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await supabase.auth.signOut();
            await AsyncStorage.multiRemove([
              'lumaid_user', 'lumaid_stats', 'lumaid_today_mood',
            ]);
            navigation.replace('Auth');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await supabase.auth.signOut();
            await AsyncStorage.clear();
            navigation.replace('Auth');
          },
        },
      ]
    );
  };

  if (!fontsLoaded) return null;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <View style={styles.root}>
      <View style={[styles.blobTop, { backgroundColor: soul.glow }]} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarOrb, { backgroundColor: soul.color + '20', borderColor: soul.color + '60' }]}>
            <Text style={[styles.avatarInitial, { color: soul.color }]}>
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <View style={[styles.memberPill, { backgroundColor: soul.color + '15', borderColor: soul.color + '30' }]}>
            <Text style={[styles.memberText, { color: soul.color }]}>Member since {memberSince}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { value: streak, label: 'DAY STREAK', color: soul.color },
            { value: totalChats, label: 'MESSAGES', color: COLORS.cyan },
            { value: soul.emoji, label: soul.name.toUpperCase(), color: COLORS.accent },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Current companion */}
        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>CURRENT COMPANION</Text>
          <View style={styles.companionRow}>
            <View style={[styles.companionOrb, { backgroundColor: soul.color + '18', borderColor: soul.color + '40' }]}>
              <Text style={styles.companionEmoji}>{soul.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.companionName, { color: soul.color }]}>{soul.name}</Text>
              <Text style={styles.companionTagline}>{soul.tagline}</Text>
            </View>
            <TouchableOpacity
              style={[styles.switchBtn, { borderColor: soul.color + '40', backgroundColor: soul.color + '12' }]}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={[styles.switchBtnText, { color: soul.color }]}>Switch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>SETTINGS</Text>
          {[
            { label: 'My Characters', emoji: '✦', color: COLORS.accent, onPress: () => navigation.navigate('Characters') },
            { label: 'Mood Journal', emoji: '📈', color: COLORS.cyan, onPress: () => navigation.navigate('Journal') },
            { label: 'Weekly Recap', emoji: '📊', color: COLORS.success, onPress: () => navigation.navigate('WeeklyRecap') },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.settingsRow, i === 0 && { borderTopWidth: 0 }]}
              onPress={item.onPress}
            >
              <View style={[styles.settingsIcon, { backgroundColor: item.color + '15' }]}>
                <Text style={styles.settingsEmoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <Text style={[styles.settingsArrow, { color: item.color }]}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* About */}
        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>ABOUT</Text>
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'AI Model', value: 'LLaMA 3.3 70B' },
            { label: 'Backend', value: 'Railway' },
          ].map((item, i) => (
            <View key={i} style={[styles.aboutRow, i === 0 && { borderTopWidth: 0 }]}>
              <Text style={styles.aboutLabel}>{item.label}</Text>
              <Text style={styles.aboutValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  blobTop: {
    position: 'absolute', width: width * 1.2, height: width * 0.8,
    borderRadius: width * 0.6, top: -width * 0.3, alignSelf: 'center', opacity: 0.15,
  },
  scroll: { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 28,
  },
  backBtn: {
    width: 40, height: 40, backgroundColor: COLORS.surface, borderRadius: 13,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 18, color: COLORS.text },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: COLORS.text },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarOrb: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarInitial: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 38 },
  profileName: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26,
    color: COLORS.text, marginBottom: 4,
  },
  profileEmail: {
    fontFamily: 'Lato_400Regular', fontSize: 13,
    color: COLORS.muted, marginBottom: 12,
  },
  memberPill: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  memberText: { fontFamily: 'Lato_700Bold', fontSize: 12 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 20, padding: 16, alignItems: 'center', gap: 5,
  },
  statNum: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: COLORS.text },
  statLabel: { fontFamily: 'Lato_700Bold', fontSize: 9, color: COLORS.muted, letterSpacing: 0.1 },

  glassCard: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 22, padding: 18, marginBottom: 12,
  },
  cardLabel: {
    fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted,
    letterSpacing: 0.12, marginBottom: 14,
  },

  companionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  companionOrb: {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  companionEmoji: { fontSize: 24 },
  companionName: { fontFamily: 'Lato_700Bold', fontSize: 16, marginBottom: 3 },
  companionTagline: { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.muted },
  switchBtn: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  switchBtnText: { fontFamily: 'Lato_700Bold', fontSize: 12 },

  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 13, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  settingsIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsEmoji: { fontSize: 18 },
  settingsLabel: { flex: 1, fontFamily: 'Lato_700Bold', fontSize: 14, color: COLORS.text },
  settingsArrow: { fontSize: 16, fontFamily: 'Lato_700Bold' },

  aboutRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  aboutLabel: { fontFamily: 'Lato_400Regular', fontSize: 14, color: COLORS.textSoft },
  aboutValue: { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.muted },

  signOutBtn: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginBottom: 10,
  },
  signOutText: { fontFamily: 'Lato_700Bold', fontSize: 15, color: COLORS.text },

  deleteBtn: {
    paddingVertical: 15, alignItems: 'center', marginBottom: 10,
  },
  deleteBtnText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.danger },
});