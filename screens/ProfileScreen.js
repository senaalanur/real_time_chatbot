import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Dimensions, Linking, Platform,
  ScrollView, StyleSheet, Switch, Text,
  TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS, SOULS } from '../constants';

const { width } = Dimensions.get('window');

function SettingsToggleRow({ icon, iconBg, label, sublabel, value, onValueChange, disabled, isFirst }) {
  return (
    <View style={[ios.row, !isFirst && ios.rowBorder]}>
      <View style={[ios.iconWrap, { backgroundColor: iconBg }]}>
        <Text style={ios.iconText}>{icon}</Text>
      </View>
      <View style={ios.rowContent}>
        <Text style={ios.rowLabel}>{label}</Text>
        {sublabel ? <Text style={ios.rowSub}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E5E5EA"
        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
      />
    </View>
  );
}

function FoundersNote({ visible }) {
  const anim    = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(anim,    { toValue: 1, tension: 60, friction: 12, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(anim,    { toValue: 0, duration: 220, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: false }),
      ]).start();
    }
  }, [visible]);

  const maxHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 400] });

  return (
    <Animated.View style={[note.wrap, { maxHeight, opacity }]}>
      <View style={note.card}>
        <View style={note.authorRow}>
          <View style={note.avatar}>
            <Text style={note.avatarText}>L</Text>
          </View>
          <View>
            <Text style={note.authorName}>The Lumaid Team</Text>
            <Text style={note.authorRole}>Founders</Text>
          </View>
        </View>
        <Text style={note.body}>
          {"Hey — thank you for being here.\n\nWe're building Lumaid because we believe everyone deserves a space to feel heard, even on the days when reaching out to another person feels impossible.\n\nWe send very rare updates. When we do, it's personal. No newsletters. No noise. Just us.\n\n— Lumaid Team ✦"}
        </Text>
      </View>
    </Animated.View>
  );
}

const note = StyleSheet.create({
  wrap:       { overflow: 'hidden', marginTop: 0 },
  card:       { backgroundColor: '#F2EFE6', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(200,170,80,0.30)', padding: 16, marginTop: 10 },
  authorRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(200,170,80,0.25)', borderWidth: 1.5, borderColor: 'rgba(200,170,80,0.50)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: '#D4A017' },
  authorName: { fontFamily: 'Lato_700Bold', fontSize: 13, color: '#2C1F00' },
  authorRole: { fontFamily: 'Lato_400Regular', fontSize: 11, color: '#9B7B2E' },
  body:       { fontFamily: 'Lato_400Regular', fontSize: 13, color: '#6B5030', lineHeight: 21 },
});

const ios = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11, paddingHorizontal: 4 },
  rowBorder:  { borderTopWidth: 1, borderTopColor: 'rgba(200,170,80,0.18)' },
  iconWrap:   { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  iconText:   { fontSize: 17 },
  rowContent: { flex: 1 },
  rowLabel:   { fontFamily: 'Lato_700Bold', fontSize: 15, color: '#2C1F00' },
  rowSub:     { fontFamily: 'Lato_400Regular', fontSize: 12, color: '#9B7B2E', marginTop: 1 },
});

// ── Nuke ALL local storage ────────────────────────────────────────────────────
async function nukeLocalStorage() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    if (keys.length > 0) await AsyncStorage.multiRemove(keys);
  } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileScreen({ navigation }) {
  const [user,                 setUser]                 = useState(null);
  const [soul,                 setSoul]                 = useState(SOULS.zen);
  const [streak,               setStreak]               = useState(0);
  const [totalChats,           setTotalChats]           = useState(0);
  const [email,                setEmail]                = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading,    setNewsletterLoading]    = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifLoading,         setNotifLoading]         = useState(false);
  const [deleteLoading,        setDeleteLoading]        = useState(false);

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, Lato_400Regular, Lato_700Bold });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const userRaw  = await AsyncStorage.getItem('lumaid_user');
    const statsRaw = await AsyncStorage.getItem('lumaid_stats');
    const histRaw  = await AsyncStorage.getItem('lumaid_mood_history');

    if (userRaw)  { const u = JSON.parse(userRaw); setUser(u); setSoul(SOULS[u.soul] || SOULS.zen); }
    if (statsRaw) { const s = JSON.parse(statsRaw); setTotalChats(s.totalChats ?? 0); }
    if (histRaw)  {
      const hist = JSON.parse(histRaw);
      let s = 0;
      const daySet = new Set(hist.map(e => e.date));
      let d = new Date();
      while (daySet.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
      setStreak(s);
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      setEmail(authUser.email ?? '');
      const { data } = await supabase
        .from('email_subscribers')
        .select('subscribed')
        .eq('user_id', authUser.id)
        .single();
      if (data) setNewsletterSubscribed(data.subscribed);
    }

    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');

    const unsubscribe = navigation.addListener('focus', async () => {
      const { status: s } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(s === 'granted');
    });
    return unsubscribe;
  };

  const handleNotifToggle = async (value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifLoading(true);
    try {
      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          setNotificationsEnabled(true);
        } else {
          Alert.alert(
            'Enable Notifications',
            'To receive reminders, enable notifications for Lumaid in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      } else {
        Alert.alert(
          'Turn Off Notifications',
          'To disable notifications, go to your device settings and turn off notifications for Lumaid.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (err) {
      console.log('Notif toggle error:', err.message);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleNewsletterToggle = async (value) => {
    setNewsletterSubscribed(value);
    setNewsletterLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      await supabase.from('email_subscribers').upsert({
        user_id: authUser.id, email: authUser.email,
        subscribed: value, updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.log('Newsletter toggle error:', err.message);
      setNewsletterSubscribed(!value);
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await supabase.auth.signOut();
          await nukeLocalStorage();
          navigation.replace('Auth');
        },
      },
    ]);
  };

  // ── Delete account — total wipeout ────────────────────────────────────────
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and ALL your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever', style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setDeleteLoading(true);
            try {
              // Step 1: Get session token
              const { data: { session } } = await supabase.auth.getSession();
              console.log('SESSION:', session ? 'exists' : 'NULL');

              if (session) {
                // Step 2: Call edge function to delete from auth.users server-side
                console.log('Calling edge function...');
                const { data: fnData, error: fnError } = await supabase.functions.invoke('delete-user', {
                  headers: { Authorization: `Bearer ${session.access_token}` },
                });
                console.log('Edge fn response:', JSON.stringify(fnData), JSON.stringify(fnError));
                if (fnError) console.warn('Edge fn error (continuing anyway):', fnError.message);
              } else {
                console.log('No session — skipping edge fn, wiping local only');
              }
            } catch (err) {
              // Don't block the wipe even if server call fails
              console.warn('Delete account server error:', err.message);
            } finally {
              // Step 3: Always wipe client state no matter what
              try { await supabase.auth.signOut(); } catch {}
              await nukeLocalStorage();
              setDeleteLoading(false);
              navigation.replace('Auth');
            }
          },
        },
      ]
    );
  };
  // ─────────────────────────────────────────────────────────────────────────

  if (!fontsLoaded) return null;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <View style={styles.root}>
      <View style={[styles.blobTop, { backgroundColor: soul.glow }]} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

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

        <View style={styles.statsRow}>
          {[
            { value: streak,     label: 'DAY STREAK', color: soul.color },
            { value: totalChats, label: 'MESSAGES',   color: COLORS.cyan },
            { value: soul.emoji, label: soul.name.toUpperCase(), color: COLORS.accent },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

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

        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>SETTINGS</Text>
          <TouchableOpacity
            style={[styles.settingsRow, { borderTopWidth: 0 }]}
            onPress={() => navigation.navigate('Journal')}
          >
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.cyan + '15' }]}>
              <Text style={styles.settingsEmoji}>📈</Text>
            </View>
            <Text style={styles.settingsLabel}>Mood Journal</Text>
            <Text style={[styles.settingsArrow, { color: COLORS.cyan }]}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.appleCard}>
          <Text style={styles.cardLabel}>PREFERENCES</Text>
          <SettingsToggleRow
            icon="🔔"
            iconBg="rgba(52,199,89,0.15)"
            label="Notifications"
            sublabel="Daily reminders & streak alerts"
            value={notificationsEnabled}
            onValueChange={handleNotifToggle}
            disabled={notifLoading}
            isFirst={true}
          />
          <SettingsToggleRow
            icon="✉️"
            iconBg="rgba(200,170,80,0.18)"
            label="Founder Notes"
            sublabel="Rare personal updates from our team"
            value={newsletterSubscribed}
            onValueChange={handleNewsletterToggle}
            disabled={newsletterLoading}
            isFirst={false}
          />
          <FoundersNote visible={newsletterSubscribed} />
        </View>

        <Text style={styles.versionText}>Lumaid v1.0.0</Text>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
          disabled={deleteLoading}
        >
          <Text style={styles.deleteBtnText}>
            {deleteLoading ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg },
  blobTop: { position: 'absolute', width: width*1.2, height: width*0.8, borderRadius: width*0.6, top: -width*0.3, alignSelf: 'center', opacity: 0.15 },
  scroll:  { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backBtn: { width: 40, height: 40, backgroundColor: COLORS.white, borderRadius: 13, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  backText:{ fontSize: 18, color: COLORS.text },
  title:   { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: COLORS.text },

  avatarSection:  { alignItems: 'center', marginBottom: 28 },
  avatarOrb:      { width: 90, height: 90, borderRadius: 45, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarInitial:  { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 38 },
  profileName:    { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: COLORS.text, marginBottom: 4 },
  profileEmail:   { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.muted, marginBottom: 12 },
  memberPill:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  memberText:     { fontFamily: 'Lato_700Bold', fontSize: 12 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 20, padding: 16, alignItems: 'center', gap: 5 },
  statNum:  { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: COLORS.text },
  statLabel:{ fontFamily: 'Lato_700Bold', fontSize: 9, color: COLORS.muted, letterSpacing: 0.1 },

  glassCard:  { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 22, padding: 18, marginBottom: 12 },
  appleCard:  { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 22, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16, marginBottom: 12 },
  cardLabel:  { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 1.2, marginBottom: 10 },

  companionRow:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  companionOrb:    { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  companionEmoji:  { fontSize: 24 },
  companionName:   { fontFamily: 'Lato_700Bold', fontSize: 16, marginBottom: 3 },
  companionTagline:{ fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.muted },
  switchBtn:       { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  switchBtnText:   { fontFamily: 'Lato_700Bold', fontSize: 12 },

  settingsRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderTopWidth: 1, borderTopColor: COLORS.border },
  settingsIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingsEmoji:{ fontSize: 18 },
  settingsLabel:{ flex: 1, fontFamily: 'Lato_700Bold', fontSize: 14, color: COLORS.text },
  settingsArrow:{ fontSize: 16, fontFamily: 'Lato_700Bold' },

  signOutBtn:     { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  signOutText:    { fontFamily: 'Lato_700Bold', fontSize: 15, color: COLORS.text },
  deleteBtn:      { paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  deleteBtnText:  { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.danger },
  versionText:    { fontFamily: 'Lato_400Regular', fontSize: 12, color: COLORS.muted, textAlign: 'center', paddingVertical: 8, marginBottom: 4 },
});