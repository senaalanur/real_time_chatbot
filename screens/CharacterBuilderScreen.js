import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

const AVATAR_COLORS = [
  '#A855F7', '#06B6D4', '#34D399',
  '#FBBF24', '#F87171', '#EC4899',
  '#818CF8', '#FB923C', '#2DD4BF',
];

const AVATAR_SYMBOLS = ['✦', '◈', '⬡', '◉', '✿', '⟡', '△', '◇', '⊕'];

const SLIDERS = [
  { key: 'warmth',     label: 'Warmth',     low: 'Cool',    high: 'Warm'      },
  { key: 'directness', label: 'Directness', low: 'Gentle',  high: 'Direct'    },
  { key: 'energy',     label: 'Energy',     low: 'Calm',    high: 'Energetic' },
  { key: 'humor',      label: 'Humor',      low: 'Serious', high: 'Playful'   },
  { key: 'depth',      label: 'Depth',      low: 'Light',   high: 'Deep'      },
];

const TRAIT_OPTIONS = [
  'Empathetic', 'Motivating', 'Analytical', 'Creative',
  'Nurturing', 'Challenging', 'Patient', 'Witty',
  'Grounding', 'Inspiring', 'No-nonsense', 'Poetic',
];

const VOICE_STYLES = [
  { id: 'therapist',  emoji: '🌿', name: 'Therapist',   desc: 'Reflective, asks deep questions, never judges' },
  { id: 'bestfriend', emoji: '💬', name: 'Best Friend',  desc: 'Casual, warm, talks like a real person' },
  { id: 'coach',      emoji: '🎯', name: 'Life Coach',   desc: 'Action-oriented, motivating, solution-focused' },
  { id: 'mentor',     emoji: '📖', name: 'Wise Mentor',  desc: 'Thoughtful, draws on experience, big picture' },
  { id: 'minimal',    emoji: '◈',  name: 'Minimal',      desc: 'Short, direct, no fluff — just the truth' },
];

const FOCUS_AREAS = [
  { id: 'anxiety',    emoji: '🌬️', label: 'Anxiety & Stress' },
  { id: 'growth',     emoji: '🌱', label: 'Personal Growth' },
  { id: 'mood',       emoji: '◎',  label: 'Mood Tracking' },
  { id: 'relations',  emoji: '💛', label: 'Relationships' },
  { id: 'work',       emoji: '🎯', label: 'Work & Focus' },
  { id: 'sleep',      emoji: '🌙', label: 'Sleep & Rest' },
  { id: 'grief',      emoji: '🕊️', label: 'Grief & Loss' },
  { id: 'body',       emoji: '✦',  label: 'Body & Health' },
  { id: 'creative',   emoji: '✿',  label: 'Creativity' },
];

const TABS = ['Identity', 'Personality', 'Voice', 'Focus'];

function buildSystemPrompt(char) {
  const w = char.warmth >= 7 ? 'very warm and nurturing' : char.warmth <= 3 ? 'cool and composed' : 'balanced in warmth';
  const d = char.directness >= 7 ? 'very direct and honest' : char.directness <= 3 ? 'gentle and diplomatic' : 'moderately direct';
  const e = char.energy >= 7 ? 'high energy and enthusiastic' : char.energy <= 3 ? 'calm and measured' : 'steady in energy';
  const h = char.humor >= 7 ? 'playful and uses humor' : char.humor <= 3 ? 'serious in tone' : 'occasionally lighthearted';
  const dep = char.depth >= 7 ? 'goes deep and philosophical' : char.depth <= 3 ? 'keeps things light and practical' : 'balances depth with practicality';

  const voiceMap = {
    therapist:  'You speak like an experienced therapist — reflective, never rushing to advice, always validating feelings first.',
    bestfriend: 'You speak like a close best friend — casual, real, never clinical. Use natural language, not therapy-speak.',
    coach:      'You speak like a life coach — action-oriented, forward-focused, helping the user find their next step.',
    mentor:     'You speak like a wise mentor — drawing on perspective and experience, thinking long-term, asking big questions.',
    minimal:    'You are extremely concise — 1-2 sentences maximum. No pleasantries. Just the most useful thing to say.',
  };

  const focusMap = {
    anxiety:   'anxiety, stress, and overwhelm',
    growth:    'personal growth and self-improvement',
    mood:      'mood patterns and emotional awareness',
    relations: 'relationships and interpersonal dynamics',
    work:      'work, productivity, and focus',
    sleep:     'sleep, rest, and recovery',
    grief:     'grief, loss, and difficult emotions',
    body:      'physical health and body awareness',
    creative:  'creativity and self-expression',
  };

  const traits = (char.traits ?? []).join(', ');
  const focusLabels = (char.focusAreas ?? []).map(f => focusMap[f]).filter(Boolean).join(', ');
  const voice = voiceMap[char.voiceStyle] ?? voiceMap.therapist;

  return `You are ${char.name}, a custom AI wellness companion.\n\nPersonality: You are ${w}, ${d}, ${e}, ${h}, and ${dep}.${traits ? ` Your defining traits are: ${traits}.` : ''}\n\n${voice}\n\n${focusLabels ? `Your specialties are: ${focusLabels}. Steer conversations toward these areas when relevant.` : ''}\n\nKeep every response to 2-3 sentences maximum unless the user asks for more. Always end with one thoughtful question or observation. Never use generic affirmations like "That's great!" or "I understand." Make the user feel genuinely heard.`;
}

export default function CharacterBuilderScreen({ navigation, route }) {
  const existing = route.params?.character ?? null;

  const [activeTab, setActiveTab] = useState(0);
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(existing?.color ?? AVATAR_COLORS[0]);
  const [symbol, setSymbol] = useState(existing?.symbol ?? '✦');
  const [warmth, setWarmth] = useState(existing?.warmth ?? 5);
  const [directness, setDirectness] = useState(existing?.directness ?? 5);
  const [energy, setEnergy] = useState(existing?.energy ?? 5);
  const [humor, setHumor] = useState(existing?.humor ?? 5);
  const [depth, setDepth] = useState(existing?.depth ?? 5);
  const [traits, setTraits] = useState(new Set(existing?.traits ?? []));
  const [voiceStyle, setVoiceStyle] = useState(existing?.voiceStyle ?? 'therapist');
  const [focusAreas, setFocusAreas] = useState(new Set(existing?.focusAreas ?? []));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, Lato_400Regular, Lato_700Bold });
  if (!fontsLoaded) return null;

  const sliderValues = { warmth, directness, energy, humor, depth };
  const setSlider = { warmth: setWarmth, directness: setDirectness, energy: setEnergy, humor: setHumor, depth: setDepth };

  const personalityPill = () => {
    const w = warmth >= 7 ? 'warm' : warmth <= 3 ? 'cool' : 'balanced';
    const d = directness >= 7 ? 'direct' : directness <= 3 ? 'gentle' : 'measured';
    const e = energy >= 7 ? 'energetic' : energy <= 3 ? 'calm' : 'steady';
    const h = humor >= 7 ? 'playful' : humor <= 3 ? 'serious' : '';
    return [w, d, e, h].filter(Boolean).join(' · ');
  };

  const toggleTrait = (t) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = new Set(traits);
    if (next.has(t)) next.delete(t);
    else if (next.size < 4) next.add(t);
    setTraits(next);
  };

  const toggleFocus = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = new Set(focusAreas);
    if (next.has(id)) next.delete(id);
    else if (next.size < 3) next.add(id);
    setFocusAreas(next);
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('Please give your character a name.'); setActiveTab(0); return; }
    setLoading(true);
    try {
      const charData = {
        name: name.trim(),
        color, symbol,
        warmth, directness, energy, humor, depth,
        traits: [...traits],
        voiceStyle,
        focusAreas: [...focusAreas],
        systemPrompt: buildSystemPrompt({
          name: name.trim(), warmth, directness, energy,
          humor, depth, traits: [...traits], voiceStyle, focusAreas: [...focusAreas],
        }),
      };

      const { data: { user } } = await supabase.auth.getUser();

      // Guest mode — save to AsyncStorage
      if (!user) {
        const raw = await AsyncStorage.getItem('lumaid_guest_characters');
        const all = raw ? JSON.parse(raw) : [];
        if (existing) {
          const updated = all.map(c => c.id === existing.id ? { ...charData, id: existing.id } : c);
          await AsyncStorage.setItem('lumaid_guest_characters', JSON.stringify(updated));
        } else {
          await AsyncStorage.setItem('lumaid_guest_characters', JSON.stringify([
            ...all, { ...charData, id: Date.now().toString() },
          ]));
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
        return;
      }

      // Logged in — save to Supabase
      charData.user_id = user.id;
      let result;
      if (existing) {
        result = await supabase.from('characters').update(charData).eq('id', existing.id);
      } else {
        result = await supabase.from('characters').insert(charData);
      }
      if (result.error) throw result.error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (err) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const renderIdentity = () => (
    <View>
      <View style={styles.avatarPreview}>
        <View style={[styles.avatarOrb, { backgroundColor: color + '18', borderColor: color + '60' }]}>
          <Text style={[styles.avatarSymbol, { color }]}>
            {name.trim() ? name.trim()[0].toUpperCase() : symbol}
          </Text>
        </View>
        <Text style={styles.avatarName}>{name.trim() || 'Your character'}</Text>
        <View style={[styles.pill, { backgroundColor: color + '15', borderColor: color + '35' }]}>
          <Text style={[styles.pillText, { color }]}>{personalityPill()}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>CHARACTER NAME</Text>
      <TextInput
        style={[styles.input, { borderColor: name.trim() ? color + '60' : COLORS.border }]}
        placeholder="Give them a name..."
        placeholderTextColor={COLORS.muted}
        value={name}
        onChangeText={setName}
        maxLength={24}
        autoCorrect={false}
      />

      <Text style={styles.sectionLabel}>ACCENT COLOR</Text>
      <View style={styles.colorGrid}>
        {AVATAR_COLORS.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setColor(c); }}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>AVATAR SYMBOL</Text>
      <View style={styles.symbolGrid}>
        {AVATAR_SYMBOLS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.symbolBtn, symbol === s && { borderColor: color, backgroundColor: color + '15' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSymbol(s); }}
          >
            <Text style={[styles.symbolText, { color: symbol === s ? color : COLORS.muted }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPersonality = () => (
    <View>
      <Text style={styles.sectionLabel}>PERSONALITY SLIDERS</Text>
      <View style={styles.glassCard}>
        {SLIDERS.map((s, i) => (
          <View key={s.key}>
            <View style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{s.label}</Text>
                <Text style={[styles.sliderValue, { color }]}>{sliderValues[s.key]}/10</Text>
              </View>
              <View style={styles.sliderTrack}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.sliderDot, n <= sliderValues[s.key] && { backgroundColor: color }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSlider[s.key](n); }}
                  />
                ))}
              </View>
              <View style={styles.sliderEnds}>
                <Text style={styles.sliderEnd}>{s.low}</Text>
                <Text style={styles.sliderEnd}>{s.high}</Text>
              </View>
            </View>
            {i < SLIDERS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 8 }]}>QUICK TRAITS</Text>
      <Text style={styles.subLabel}>Pick up to 4 traits that define your character.</Text>
      <View style={styles.traitsGrid}>
        {TRAIT_OPTIONS.map(t => {
          const on = traits.has(t);
          return (
            <TouchableOpacity
              key={t}
              style={[styles.traitChip, on && { backgroundColor: color + '20', borderColor: color }]}
              onPress={() => toggleTrait(t)}
            >
              <Text style={[styles.traitText, { color: on ? color : COLORS.muted }]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderVoice = () => (
    <View>
      <Text style={styles.sectionLabel}>HOW SHOULD THEY SPEAK?</Text>
      <Text style={styles.subLabel}>This shapes how your character responds in every conversation.</Text>
      <View style={{ gap: 8, marginTop: 10 }}>
        {VOICE_STYLES.map(v => {
          const on = voiceStyle === v.id;
          return (
            <TouchableOpacity
              key={v.id}
              style={[styles.voiceCard, on && { borderColor: color, backgroundColor: color + '10' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setVoiceStyle(v.id); }}
            >
              <Text style={styles.voiceEmoji}>{v.emoji}</Text>
              <View style={styles.voiceInfo}>
                <Text style={[styles.voiceName, on && { color }]}>{v.name}</Text>
                <Text style={styles.voiceDesc}>{v.desc}</Text>
              </View>
              <View style={[styles.voiceCheck, { backgroundColor: on ? color : COLORS.surfaceUp }]}>
                {on && <Text style={styles.voiceCheckText}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderFocus = () => (
    <View>
      <Text style={styles.sectionLabel}>SPECIALTY AREAS</Text>
      <Text style={styles.subLabel}>Pick up to 3 areas your companion specializes in.</Text>
      <View style={styles.focusGrid}>
        {FOCUS_AREAS.map(f => {
          const on = focusAreas.has(f.id);
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.focusCard, on && { borderColor: color, backgroundColor: color + '15' }]}
              onPress={() => toggleFocus(f.id)}
            >
              <Text style={styles.focusEmoji}>{f.emoji}</Text>
              <Text style={[styles.focusLabel, on && { color }]}>{f.label}</Text>
              {on && (
                <View style={[styles.focusBadge, { backgroundColor: color }]}>
                  <Text style={styles.focusBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.promptPreview, { borderColor: color + '30' }]}>
        <Text style={[styles.promptLabel, { color }]}>✦  SYSTEM PROMPT PREVIEW</Text>
        <Text style={styles.promptText} numberOfLines={6}>
          {buildSystemPrompt({
            name: name.trim() || 'Your character',
            warmth, directness, energy, humor, depth,
            traits: [...traits], voiceStyle, focusAreas: [...focusAreas],
          })}
        </Text>
      </View>
    </View>
  );

  const tabContent = [renderIdentity, renderPersonality, renderVoice, renderFocus];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={[styles.blobTop, { backgroundColor: color + '20' }]} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{existing ? 'Edit Character' : 'New Character'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === i && { backgroundColor: color + '20', borderColor: color }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(i); }}
            >
              <Text style={[styles.tabText, activeTab === i && { color }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.tabContent}>
          {tabContent[activeTab]()}
        </View>

        <View style={styles.navRow}>
          {activeTab > 0 && (
            <TouchableOpacity style={styles.navBtnSecondary} onPress={() => setActiveTab(activeTab - 1)}>
              <Text style={styles.navBtnSecondaryText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {activeTab < TABS.length - 1 ? (
            <TouchableOpacity style={[styles.navBtnPrimary, { backgroundColor: color }]} onPress={() => setActiveTab(activeTab + 1)}>
              <Text style={styles.navBtnPrimaryText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtnPrimary, { backgroundColor: color }, loading && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.navBtnPrimaryText}>{existing ? 'Save Changes →' : 'Create Character →'}</Text>}
            </TouchableOpacity>
          )}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  blobTop: {
    position: 'absolute', width: width * 1.2, height: width * 0.8,
    borderRadius: width * 0.6, top: -width * 0.3, alignSelf: 'center', opacity: 0.25,
  },
  scroll: { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: {
    width: 40, height: 40, backgroundColor: COLORS.surface, borderRadius: 13,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 18, color: COLORS.text },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: COLORS.text },
  tabScroll: { marginBottom: 20 },
  tabRow: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  tabText: { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.muted },
  tabContent: { marginBottom: 20 },
  avatarPreview: { alignItems: 'center', marginBottom: 28 },
  avatarOrb: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarSymbol: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 38 },
  avatarName: { fontFamily: 'Lato_700Bold', fontSize: 20, color: COLORS.text, marginBottom: 8 },
  pill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  pillText: { fontFamily: 'Lato_700Bold', fontSize: 12 },
  sectionLabel: { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 0.12, marginBottom: 10 },
  subLabel: { fontFamily: 'Lato_400Regular', fontSize: 12, color: COLORS.muted, marginBottom: 12, marginTop: -6 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 14,
    fontFamily: 'Lato_400Regular', fontSize: 16, color: COLORS.text, marginBottom: 22,
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotActive: { borderWidth: 3, borderColor: COLORS.white, transform: [{ scale: 1.15 }] },
  symbolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  symbolBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
  },
  symbolText: { fontSize: 20 },
  glassCard: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 20, padding: 18, marginBottom: 22,
  },
  sliderRow: { paddingVertical: 2 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sliderLabel: { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.text },
  sliderValue: { fontFamily: 'Lato_700Bold', fontSize: 13 },
  sliderTrack: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  sliderDot: { flex: 1, height: 7, borderRadius: 4, backgroundColor: COLORS.border },
  sliderEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderEnd: { fontFamily: 'Lato_400Regular', fontSize: 10, color: COLORS.muted },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  traitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  traitChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  traitText: { fontFamily: 'Lato_700Bold', fontSize: 12 },
  voiceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  voiceEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  voiceInfo: { flex: 1 },
  voiceName: { fontFamily: 'Lato_700Bold', fontSize: 14, color: COLORS.text, marginBottom: 3 },
  voiceDesc: { fontFamily: 'Lato_400Regular', fontSize: 12, color: COLORS.muted, lineHeight: 17 },
  voiceCheck: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  voiceCheckText: { fontFamily: 'Lato_700Bold', fontSize: 11, color: COLORS.white },
  focusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  focusCard: {
    width: (width - 52) / 2, padding: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
    position: 'relative',
  },
  focusEmoji: { fontSize: 22, marginBottom: 6 },
  focusLabel: { fontFamily: 'Lato_700Bold', fontSize: 12, color: COLORS.textSoft },
  focusBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  focusBadgeText: { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.white },
  promptPreview: { borderWidth: 1, borderRadius: 16, backgroundColor: COLORS.surface, padding: 16 },
  promptLabel: { fontFamily: 'Lato_700Bold', fontSize: 10, letterSpacing: 0.12, marginBottom: 8 },
  promptText: { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.textSoft, lineHeight: 18 },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  navBtnPrimary: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 50, alignItems: 'center' },
  navBtnPrimaryText: { fontFamily: 'Lato_700Bold', fontSize: 15, color: COLORS.white, letterSpacing: 0.3 },
  navBtnSecondary: {
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 50,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  navBtnSecondaryText: { fontFamily: 'Lato_400Regular', fontSize: 14, color: COLORS.textSoft },
  errorBox: {
    backgroundColor: COLORS.danger + '15', borderWidth: 1, borderColor: COLORS.danger + '40',
    borderRadius: 14, padding: 12, marginBottom: 16,
  },
  errorText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.danger, textAlign: 'center' },
});