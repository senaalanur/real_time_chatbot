import { scheduleStreakMilestone, refreshNotifications } from '../lib/notifications';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';
import { CopilotProvider, CopilotStep, useCopilot, walkthroughable } from 'react-native-copilot';
import { COLORS, MOODS, QUICK_ACTIONS, SOULS } from '../constants';

const { width } = Dimensions.get('window');

const WalkthroughableView      = walkthroughable(View);
const WalkthroughableTouchable = walkthroughable(TouchableOpacity);

// ── Premium Hamburger Menu ────────────────────────────────────────────────────
function HeaderMenu({ userName, onProfile, onLogout, soul }) {
  const [open, setOpen] = useState(false);
  const isAnimating   = useRef(false);
  const backdropAnim  = useRef(new Animated.Value(0)).current;
  const menuAnim      = useRef(new Animated.Value(0)).current;
  const scaleAnim     = useRef(new Animated.Value(0.92)).current;
  const pressAnims    = useRef({ settings: new Animated.Value(1), logout: new Animated.Value(1) }).current;

  const openMenu = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(menuAnim,    { toValue: 1, tension: 65, friction: 10, useNativeDriver: true }),
      Animated.spring(scaleAnim,   { toValue: 1, tension: 65, friction: 10, useNativeDriver: true }),
    ]).start(() => { isAnimating.current = false; });
  };

  const closeMenu = (fn) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(menuAnim,     { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim,    { toValue: 0.92, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setOpen(false);
      isAnimating.current = false;
      if (fn) fn();
    });
  };

  const onPressIn  = (key) => Animated.spring(pressAnims[key], { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = (key) => Animated.spring(pressAnims[key], { toValue: 1,    useNativeDriver: true }).start();

  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

  const menuStyle = {
    opacity: menuAnim,
    transform: [
      { translateY: menuAnim.interpolate({ inputRange: [0,1], outputRange: [-16, 0] }) },
      { scale: scaleAnim },
    ],
  };

  return (
    <View style={hMenu.wrap}>
      {/* Backdrop */}
      {open && (
        <TouchableWithoutFeedback onPress={() => closeMenu()}>
          <Animated.View style={[hMenu.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>
      )}

      {/* Trigger */}
      <TouchableOpacity onPress={open ? () => closeMenu() : openMenu} style={hMenu.trigger} activeOpacity={0.8}>
        <Text style={hMenu.greeting}>{greet}</Text>
        <View style={hMenu.nameRow}>
          <View style={[hMenu.burgerWrap, open && { backgroundColor: soul.color + '20', borderColor: soul.color + '60' }]}>
            <View style={[hMenu.bar, { backgroundColor: open ? soul.color : COLORS.text, width: open ? 14 : 16 }]} />
            <View style={[hMenu.bar, { backgroundColor: open ? soul.color : COLORS.text, width: open ? 14 : 12 }]} />
            <View style={[hMenu.bar, { backgroundColor: open ? soul.color : COLORS.text, width: 14 }]} />
          </View>
          <Text style={hMenu.name}>{userName ?? '...'}</Text>
        </View>
      </TouchableOpacity>

      {/* Dropdown */}
      {open && (
        <Animated.View style={[hMenu.dropdown, menuStyle]}>
          {/* Glow top border */}
          <View style={[hMenu.glowBar, { backgroundColor: soul.color }]} />

          {/* User section */}
          <View style={hMenu.userSection}>
            <View style={[hMenu.avatar, { backgroundColor: soul.color + '18', borderColor: soul.color + '50' }]}>
              <Text style={[hMenu.avatarText, { color: soul.color }]}>
                {(userName ?? '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={hMenu.pillName}>{userName ?? '...'}</Text>
              <View style={hMenu.badgeRow}>
                <View style={[hMenu.badge, { backgroundColor: soul.color + '18', borderColor: soul.color + '35' }]}>
                  <Text style={[hMenu.badgeText, { color: soul.color }]}>{soul.emoji} {soul.name}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={hMenu.hairline} />

          {/* Settings item */}
          <Animated.View style={{ transform: [{ scale: pressAnims.settings }] }}>
            <TouchableOpacity
              style={hMenu.item}
              onPress={() => closeMenu(onProfile)}
              onPressIn={() => onPressIn('settings')}
              onPressOut={() => onPressOut('settings')}
              activeOpacity={1}
            >
              <View style={[hMenu.iconWrap, { backgroundColor: 'rgba(200,170,80,0.12)', borderColor: 'rgba(200,170,80,0.25)' }]}>
                <Text style={hMenu.iconText}>⚙</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={hMenu.itemLabel}>Account Settings</Text>
                <Text style={hMenu.itemSub}>Profile & preferences</Text>
              </View>
              <Text style={hMenu.chevron}>›</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={hMenu.hairline} />

          {/* Logout item */}
          <Animated.View style={{ transform: [{ scale: pressAnims.logout }] }}>
            <TouchableOpacity
              style={hMenu.item}
              onPress={() => closeMenu(onLogout)}
              onPressIn={() => onPressIn('logout')}
              onPressOut={() => onPressOut('logout')}
              activeOpacity={1}
            >
              <View style={[hMenu.iconWrap, { backgroundColor: 'rgba(255,59,48,0.10)', borderColor: 'rgba(255,59,48,0.20)' }]}>
                <Text style={[hMenu.iconText, { color: '#FF3B30' }]}>↩</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[hMenu.itemLabel, { color: '#FF3B30' }]}>Log Out</Text>
                <Text style={hMenu.itemSub}>Sign out of Lumaid</Text>
              </View>
              <Text style={[hMenu.chevron, { color: '#FF3B30' }]}>›</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 8 }} />
        </Animated.View>
      )}
    </View>
  );
}

const hMenu = StyleSheet.create({
  wrap:     { flex: 1, zIndex: 100 },
  backdrop: { position: 'absolute', top: -300, left: -500, right: -500, bottom: -1200, backgroundColor: 'rgba(13,15,20,0.45)', zIndex: 150 },
  trigger:  { paddingRight: 8 },
  greeting: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.muted, marginBottom: 3, letterSpacing: 0.3 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name:     { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 30, color: COLORS.text, letterSpacing: -0.5 },
  burgerWrap: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  bar: { height: 2, borderRadius: 2 },
  dropdown: {
    position: 'absolute', top: 76, left: 0,
    width: 256,
    backgroundColor: 'rgba(255,252,245,0.97)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(200,170,80,0.30)',
    shadowColor: '#C8AA50',
    shadowOpacity: 0.28,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18,
    overflow: 'hidden',
    zIndex: 200,
  },
  glowBar:     { height: 3, width: '100%' },
  userSection: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingBottom: 14 },
  avatar:      { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20 },
  pillName:    { fontFamily: 'Lato_700Bold', fontSize: 15, color: COLORS.text, marginBottom: 5, letterSpacing: -0.2 },
  badgeRow:    { flexDirection: 'row' },
  badge:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:   { fontFamily: 'Lato_700Bold', fontSize: 10, letterSpacing: 0.3 },
  hairline:    { height: 0.5, backgroundColor: 'rgba(200,170,80,0.20)', marginHorizontal: 16 },
  item:        { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 14 },
  iconWrap:    { width: 36, height: 36, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconText:    { fontSize: 17, color: '#C8AA50', textAlign: 'center' },
  itemLabel:   { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.text, marginBottom: 2, letterSpacing: -0.1 },
  itemSub:     { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.muted, letterSpacing: 0.1 },
  chevron:     { fontSize: 20, color: COLORS.muted, fontFamily: 'Lato_400Regular' },
});

// ── Inner home screen ─────────────────────────────────────────────────────────
function HomeScreenInner({ navigation, route }) {
  const [user,           setUser]           = useState(null);
  const [soul,           setSoul]           = useState(SOULS.zen);
  const [todayMood,      setTodayMood]      = useState(null);
  const [stats,          setStats]          = useState({ totalChats: 0 });
  const [showSoulPicker, setShowSoulPicker] = useState(false);
  const [streak,         setStreak]         = useState(0);

  const orbPulse       = useRef(new Animated.Value(1)).current;
  const orbGlow        = useRef(new Animated.Value(0.5)).current;
  const fadeIn         = useRef(new Animated.Value(0)).current;
  const soulPickerAnim = useRef(new Animated.Value(0)).current;
  const btnScale       = useRef(new Animated.Value(1)).current;

  const { start: startTour } = useCopilot();

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, Lato_400Regular, Lato_700Bold });

  useEffect(() => {
    loadData();
    startOrbAnimation();
    Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    // Start tour only if coming fresh from onboarding
    const params = route?.params ?? {};
    if (params.startTour) {
      setTimeout(() => startTour(), 900);
    }
  }, []);

  useEffect(() => {
    Animated.spring(soulPickerAnim, { toValue: showSoulPicker ? 1 : 0, tension: 65, friction: 11, useNativeDriver: true }).start();
  }, [showSoulPicker]);

  const loadData = async () => {
    const userRaw  = await AsyncStorage.getItem('lumaid_user');
    const moodRaw  = await AsyncStorage.getItem('lumaid_today_mood');
    const histRaw  = await AsyncStorage.getItem('lumaid_mood_history');
    if (userRaw) { const u = JSON.parse(userRaw); setUser(u); setSoul(SOULS[u.soul] || SOULS.zen); }

    // Fetch real message count from Supabase for current user
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { count } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('role', 'user');
        if (count !== null) setStats({ totalChats: count });
      }
    } catch (_) {}
    if (moodRaw) { const m = JSON.parse(moodRaw); if (m.date === new Date().toDateString()) setTodayMood(m.moodId); }
    if (histRaw) {
      const hist = JSON.parse(histRaw);
      let s = 0;
      const daySet = new Set(hist.map(e => e.date));
      let d = new Date();
      while (daySet.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
      setStreak(s);
    }
  };

  const startOrbAnimation = () => {
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(orbPulse, { toValue: 1.08, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orbGlow,  { toValue: 1,    duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(orbPulse, { toValue: 0.94, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orbGlow,  { toValue: 0.3,  duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ])).start();
  };

  const switchSoul = async (newSoul) => {
    console.log('[LUMAID] switchSoul called:', newSoul?.id);
    setSoul(newSoul); setShowSoulPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const userRaw = await AsyncStorage.getItem('lumaid_user');
    if (userRaw) { const u = JSON.parse(userRaw); u.soul = newSoul.id; await AsyncStorage.setItem('lumaid_user', JSON.stringify(u)); }
    await refreshNotifications();
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
    await refreshNotifications();
  };

  const goToChat = (quickActionPrompt = null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Chat', { soul: soul.id, quickActionPrompt });
  };

  const handleLogout = async () => {
    await supabaseSignOut();
  };

  const supabaseSignOut = async () => {
    const { supabase } = require('../lib/supabase');
    await supabase.auth.signOut();
  };

  const onPressIn  = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  if (!fontsLoaded) return null;
  const currentMood = MOODS.find(m => m.id === todayMood);

  return (
    <View style={styles.root}>
      <View style={styles.blobTop} />
      <Animated.View style={[styles.blobSoul, { backgroundColor: soul.glow, opacity: orbGlow }]} />
      <View style={[styles.blobBottom, { backgroundColor: COLORS.cyanGlow }]} />

      <Animated.ScrollView style={{ opacity: fadeIn, flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header with hamburger menu ──────────────────────────────── */}
        <View style={styles.header}>
          <HeaderMenu
            userName={user?.name}
            soul={soul}
            onProfile={() => navigation.navigate('Profile')}
            
            onLogout={handleLogout}
          />
          <CopilotStep text="Tap here to switch your AI companion anytime. Each has a unique personality." order={4} name="soul-badge">
            <WalkthroughableTouchable
              style={[styles.soulBadge, { borderColor: soul.color + '50' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSoulPicker(v => !v); }}
            >
              <View style={[styles.soulBadgeDot, { backgroundColor: soul.color }]} />
              <Text style={[styles.soulBadgeName, { color: soul.color }]}>{soul.name}</Text>
              <Text style={[styles.soulChevron, { color: soul.color }]}>{showSoulPicker ? '↑' : '↓'}</Text>
            </WalkthroughableTouchable>
          </CopilotStep>
        </View>

        {/* Streak banner */}
        {streak >= 2 && (
          <View style={[styles.streakBanner, { borderColor: soul.color + '35', backgroundColor: soul.color + '08' }]}>
            <Text style={[styles.streakFire, { color: soul.color }]}>✦</Text>
            <Text style={[styles.streakText, { color: soul.color }]}>🔥 {streak} day streak</Text>
            <Text style={styles.streakSub}>keep it going</Text>
          </View>
        )}

        {/* Soul Picker */}
        {showSoulPicker && (
          <Animated.View style={[styles.soulPicker, {
            opacity: soulPickerAnim,
            transform: [{ translateY: soulPickerAnim.interpolate({ inputRange: [0,1], outputRange: [-12,0] }) }],
          }]}>
            <Text style={styles.soulPickerTitle}>SWITCH COMPANION</Text>
            {Object.values(SOULS).map(s => (
              <TouchableOpacity key={s.id} style={[styles.soulPickerItem, soul.id === s.id && { backgroundColor: s.color + '10', borderColor: s.color + '40' }]} onPress={() => switchSoul(s)}>
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

        {/* Orb — Tour Step 1 */}
        <CopilotStep text={`This is ${soul.name}, your AI companion. Tap to start a conversation — vent, reflect, or just talk.`} order={1} name="companion-orb">
          <WalkthroughableView style={styles.orbContainer}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => goToChat()} onPressIn={onPressIn} onPressOut={onPressOut}>
              <Animated.View style={[styles.orbRing3, { borderColor: soul.color + '18', transform: [{ scale: orbPulse }] }]}>
                <View style={[styles.orbRing2, { borderColor: soul.color + '30' }]}>
                  <View style={[styles.orbRing1, { borderColor: soul.color + '50' }]}>
                    <Animated.View style={[styles.orbCore, { backgroundColor: soul.color, transform: [{ scale: btnScale }], shadowColor: soul.color, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }]}>
                      <Text style={styles.orbEmoji}>{soul.emoji}</Text>
                    </Animated.View>
                  </View>
                </View>
              </Animated.View>
              <Text style={styles.orbLabel}>Talk to {soul.name}</Text>
              <View style={[styles.orbCta, { backgroundColor: soul.color, shadowColor: soul.color, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }]}>
                <Text style={styles.orbCtaText}>Start conversation  →</Text>
              </View>
            </TouchableOpacity>
          </WalkthroughableView>
        </CopilotStep>

        {/* Mood — Tour Step 2 */}
        <CopilotStep text="Log how you're feeling each day. Consistent check-ins build your streak and help your companion know you better." order={2} name="mood-checkin">
          <WalkthroughableView style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>HOW ARE YOU TODAY?</Text>
              {todayMood && <TouchableOpacity onPress={() => setTodayMood(null)}><Text style={styles.cardAction}>Change</Text></TouchableOpacity>}
            </View>
            {todayMood ? (
              <View style={styles.moodDone}>
                <View style={[styles.moodDoneOrb, { backgroundColor: currentMood?.color + '18', borderColor: currentMood?.color + '40' }]}>
                  <Text style={[styles.moodDoneEmoji, { color: currentMood?.color }]}>{currentMood?.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moodDoneLabel}>Feeling</Text>
                  <Text style={[styles.moodDoneText, { color: currentMood?.color }]}>{currentMood?.label}</Text>
                </View>
                {streak > 0 && (
                  <View style={[styles.streakPill, { backgroundColor: soul.color + '15', borderColor: soul.color + '35' }]}>
                    <Text style={[styles.streakPillNum, { color: soul.color }]}>{streak}</Text>
                    <Text style={[styles.streakPillLabel, { color: soul.color }]}>days</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.moodRow}>
                {MOODS.map(m => (
                  <TouchableOpacity key={m.id} style={styles.moodBtn} onPress={() => logMood(m.id)} activeOpacity={0.7}>
                    <View style={[styles.moodOrb, { backgroundColor: m.color + '15', borderColor: m.color + '35' }]}>
                      <Text style={[styles.moodEmoji, { color: m.color }]}>{m.emoji}</Text>
                    </View>
                    <Text style={styles.moodLabel}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </WalkthroughableView>
        </CopilotStep>

        {/* Wellness Tools — Tour Step 3 */}
        <CopilotStep text="Quick-start any wellness activity — daily check-in, vent session, evening reflection, anxiety relief, focus mode, or gratitude practice." order={3} name="wellness-tools">
          <WalkthroughableView style={styles.glassCard}>
            <Text style={styles.cardLabel}>WELLNESS TOOLS</Text>
            <View style={styles.toolsGrid}>
              {QUICK_ACTIONS.map(action => (
                <TouchableOpacity key={action.id} style={[styles.toolCard, { borderColor: action.color + '40', backgroundColor: action.color + '10' }]} onPress={() => goToChat(action.prompt)} activeOpacity={0.75}>
                  <Text style={styles.toolEmoji}>{action.emoji}</Text>
                  <Text style={[styles.toolLabel, { color: action.color }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </WalkthroughableView>
        </CopilotStep>

        {/* Journal — Tour Step 5 */}
        <View style={styles.actionRow}>
          <CopilotStep text="View your mood history here. See patterns, track your streak, and reflect on your journey." order={5} name="journal-card">
            <WalkthroughableTouchable
              style={[styles.actionCard, { borderColor: COLORS.accentDark + '35', backgroundColor: COLORS.accentSoft }]}
              onPress={() => navigation.navigate('Journal')} activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.accent + '25' }]}>
                <Text style={styles.actionEmoji}>📈</Text>
              </View>
              <Text style={styles.actionTitle}>Mood Journal</Text>
              <Text style={styles.actionSub}>Track · Reflect · Grow</Text>
            </WalkthroughableTouchable>
          </CopilotStep>
        </View>

        {/* Journey stats */}
        <View style={[styles.glassCard, { borderColor: soul.color + '25' }]}>
          <Text style={styles.cardLabel}>YOUR JOURNEY</Text>
          <View style={styles.journeyRow}>
            <View style={styles.journeyStat}>
              <Text style={[styles.journeyNum, { color: COLORS.accentDark }]}>{stats.totalChats}</Text>
              <Text style={styles.journeyLabel}>messages</Text>
            </View>
            <View style={styles.journeyDivider} />
            <View style={styles.journeyStat}>
              <Text style={[styles.journeyNum, { color: soul.color }]}>{streak}</Text>
              <Text style={styles.journeyLabel}>🔥 day streak</Text>
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

export default function HomeScreen({ navigation }) {
  return (
    <CopilotProvider
      stepNumberComponent={() => null}
      tooltipStyle={tourStyles.tooltip}
      tooltipTextStyle={tourStyles.tooltipText}
      nextStepText="Next →"
      lastStepText="Got it ✓"
      prevStepText="← Back"
      nextStepTextStyle={tourStyles.nextBtn}
      prevStepTextStyle={tourStyles.prevBtn}
      backdropColor="rgba(44,31,0,0.65)"
      animationDuration={400}
      overlay="svg"
      stopOnOutsideClick={true}
      onStop={async () => {
      }}
    >
      <HomeScreenInner navigation={navigation} />
    </CopilotProvider>
  );
}

const tourStyles = StyleSheet.create({
  tooltip: {
    backgroundColor: '#F7F4EC',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(200,170,80,0.45)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#F5C832',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    maxWidth: width - 48,
  },
  tooltipText: { fontFamily: 'Lato_400Regular', fontSize: 14, color: '#6B5030', lineHeight: 22 },
  nextBtn:     { fontFamily: 'Lato_700Bold', fontSize: 14, color: '#D4A017' },
  prevBtn:     { fontFamily: 'Lato_400Regular', fontSize: 13, color: '#9B7B2E' },
});

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: COLORS.bg },
  blobTop:    { position: 'absolute', width: width*1.4, height: width*1.0, borderRadius: width*0.7, top: -width*0.5, alignSelf: 'center', backgroundColor: 'rgba(200,170,80,0.18)', zIndex: 0 },
  blobSoul:   { position: 'absolute', width: width*1.0, height: width*0.8, borderRadius: width*0.5, top: width*0.1, alignSelf: 'center', zIndex: 0 },
  blobBottom: { position: 'absolute', width: width*1.0, height: width*0.8, borderRadius: width*0.5, bottom: -width*0.3, right: -width*0.3, opacity: 0.12, zIndex: 0 },
  scroll:     { paddingTop: Platform.OS === 'ios' ? 64 : 40, paddingHorizontal: 16 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, zIndex: 100 },
  soulBadge:  { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1.5, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.white },
  soulBadgeDot:  { width: 7, height: 7, borderRadius: 4 },
  soulBadgeName: { fontFamily: 'Lato_700Bold', fontSize: 13 },
  soulChevron:   { fontSize: 10, fontFamily: 'Lato_700Bold' },
  streakBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
  streakFire:    { fontSize: 14 },
  streakText:    { fontFamily: 'Lato_700Bold', fontSize: 14 },
  streakSub:     { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.muted },
  soulPickerBackdrop: { position: 'absolute', top: -300, left: -500, right: -500, bottom: -1200, zIndex: 49 },
  soulPicker:    { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.borderBright, borderRadius: 22, padding: 16, marginBottom: 18 },
  soulPickerTitle: { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 0.14, marginBottom: 12 },
  soulPickerItem:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
  soulPickerDot:   { width: 10, height: 10, borderRadius: 5 },
  soulPickerName:  { fontFamily: 'Lato_700Bold', fontSize: 14, marginBottom: 1 },
  soulPickerTag:   { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.muted },
  activeCheck:     { fontFamily: 'Lato_700Bold', fontSize: 16 },
  orbContainer: { alignItems: 'center', marginVertical: 20 },
  orbRing3: { width: 200, height: 200, borderRadius: 100, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  orbRing2: { width: 164, height: 164, borderRadius: 82, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  orbRing1: { width: 124, height: 124, borderRadius: 62, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  orbCore:  { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  orbEmoji: { fontSize: 32 },
  orbLabel: { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.text, letterSpacing: 0.4, marginBottom: 10, textAlign: 'center' },
  orbCta:   { paddingHorizontal: 24, paddingVertical: 11, borderRadius: 50, elevation: 4 },
  orbCtaText: { fontFamily: 'Lato_700Bold', fontSize: 14, color: COLORS.white, letterSpacing: 0.3 },
  glassCard:  { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 22, padding: 18, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardLabel:  { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 1.2, marginBottom: 12 },
  cardAction: { fontFamily: 'Lato_400Regular', fontSize: 12, color: COLORS.accentDark, marginBottom: 12 },
  moodRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn:  { alignItems: 'center', gap: 6, flex: 1 },
  moodOrb:  { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  moodEmoji:     { fontSize: 18, fontFamily: 'Lato_700Bold' },
  moodLabel:     { fontFamily: 'Lato_400Regular', fontSize: 10, color: COLORS.muted },
  moodDone:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  moodDoneOrb:   { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  moodDoneEmoji: { fontSize: 24, fontFamily: 'Lato_700Bold' },
  moodDoneLabel: { fontFamily: 'Lato_400Regular', fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  moodDoneText:  { fontFamily: 'Lato_700Bold', fontSize: 22 },
  streakPill:      { alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
  streakPillNum:   { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24 },
  streakPillLabel: { fontFamily: 'Lato_400Regular', fontSize: 10 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toolCard:  { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 13, paddingVertical: 9 },
  toolEmoji: { fontSize: 14 },
  toolLabel: { fontFamily: 'Lato_700Bold', fontSize: 12 },
  actionRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionCard: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1.5, borderRadius: 22, padding: 18, alignItems: 'center', gap: 6 },
  actionIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionEmoji: { fontSize: 26 },
  actionTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 15, color: COLORS.text, textAlign: 'center', letterSpacing: -0.2 },
  actionSub:   { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.muted, textAlign: 'center', letterSpacing: 0.3 },
  journeyRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  journeyStat:    { alignItems: 'center', gap: 4 },
  journeyNum:     { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 30, color: COLORS.text },
  journeyLabel:   { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.muted },
  journeyDivider: { width: 1, height: 44, backgroundColor: COLORS.border },
});