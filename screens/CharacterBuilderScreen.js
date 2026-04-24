import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
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

export default function CharacterBuilderScreen({ navigation, route }) {
  const existingCharacter = route.params?.character ?? null;
  const [name, setName] = useState(existingCharacter?.name ?? '');
  const [color, setColor] = useState(existingCharacter?.color ?? AVATAR_COLORS[0]);
  const [warmth, setWarmth] = useState(existingCharacter?.warmth ?? 5);
  const [directness, setDirectness] = useState(existingCharacter?.directness ?? 5);
  const [energy, setEnergy] = useState(existingCharacter?.energy ?? 5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, Lato_400Regular, Lato_700Bold });
  if (!fontsLoaded) return null;

  const getPersonalityDesc = () => {
    const w = warmth >= 7 ? 'warm' : warmth <= 3 ? 'cool' : 'balanced';
    const d = directness >= 7 ? 'direct' : directness <= 3 ? 'gentle' : 'measured';
    const e = energy >= 7 ? 'high energy' : energy <= 3 ? 'calm' : 'steady';
    return `${w} · ${d} · ${e}`;
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('Please give your character a name.'); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const characterData = { user_id: user.id, name: name.trim(), color, warmth, directness, energy };
      let result;
      if (existingCharacter) {
        result = await supabase.from('characters').update(characterData).eq('id', existingCharacter.id);
      } else {
        result = await supabase.from('characters').insert(characterData);
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

  const SliderRow = ({ label, value, setValue, lowLabel, highLabel }) => (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.sliderValue, { color }]}>{value}/10</Text>
      </View>
      <View style={styles.sliderTrack}>
        {[1,2,3,4,5,6,7,8,9,10].map(i => (
          <TouchableOpacity
            key={i}
            style={[styles.sliderDot, i <= value && { backgroundColor: color }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setValue(i); }}
          />
        ))}
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLow}>{lowLabel}</Text>
        <Text style={styles.sliderHigh}>{highLabel}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={[styles.blobTop, { backgroundColor: color + '20' }]} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{existingCharacter ? 'Edit Character' : 'New Character'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar preview */}
        <View style={styles.avatarPreview}>
          <View style={[styles.avatarOrb, { backgroundColor: color + '18', borderColor: color + '60' }]}>
            <Text style={[styles.avatarInitial, { color }]}>
              {name.trim() ? name.trim()[0].toUpperCase() : '✦'}
            </Text>
          </View>
          <Text style={styles.avatarName}>{name.trim() || 'Your character'}</Text>
          <View style={[styles.personalityPill, { backgroundColor: color + '15', borderColor: color + '30' }]}>
            <Text style={[styles.personalityText, { color }]}>{getPersonalityDesc()}</Text>
          </View>
        </View>

        {/* Name */}
        <View style={styles.section}>
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
        </View>

        {/* Color picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCENT COLOR</Text>
          <View style={styles.colorGrid}>
            {AVATAR_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setColor(c); }}
              />
            ))}
          </View>
        </View>

        {/* Sliders */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PERSONALITY</Text>
          <View style={styles.glassCard}>
            <SliderRow label="Warmth" value={warmth} setValue={setWarmth} lowLabel="Cool" highLabel="Warm" />
            <View style={styles.divider} />
            <SliderRow label="Directness" value={directness} setValue={setDirectness} lowLabel="Gentle" highLabel="Direct" />
            <View style={styles.divider} />
            <SliderRow label="Energy" value={energy} setValue={setEnergy} lowLabel="Calm" highLabel="Energetic" />
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: color }, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.saveBtnText}>{existingCharacter ? 'Save Changes →' : 'Create Character →'}</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  blobTop: {
    position: 'absolute', width: width * 1.2, height: width * 0.8,
    borderRadius: width * 0.6, top: -width * 0.3, alignSelf: 'center', opacity: 0.3,
  },
  scroll: { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backBtn: {
    width: 40, height: 40, backgroundColor: COLORS.surface, borderRadius: 13,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 18, color: COLORS.text },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: COLORS.text },

  avatarPreview: { alignItems: 'center', marginBottom: 32 },
  avatarOrb: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarInitial: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 40 },
  avatarName: { fontFamily: 'Lato_700Bold', fontSize: 20, color: COLORS.text, marginBottom: 8 },
  personalityPill: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  personalityText: { fontFamily: 'Lato_700Bold', fontSize: 12 },

  section: { marginBottom: 24 },
  sectionLabel: { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 0.12, marginBottom: 10 },

  input: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 14,
    fontFamily: 'Lato_400Regular', fontSize: 16, color: COLORS.text,
  },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot: { width: 38, height: 38, borderRadius: 19 },
  colorDotSelected: { borderWidth: 3, borderColor: COLORS.white, transform: [{ scale: 1.15 }] },

  glassCard: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 20, padding: 18,
  },
  sliderRow: { paddingVertical: 4 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sliderLabel: { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.text },
  sliderValue: { fontFamily: 'Lato_700Bold', fontSize: 13 },
  sliderTrack: { flexDirection: 'row', gap: 5, marginBottom: 6 },
  sliderDot: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLow: { fontFamily: 'Lato_400Regular', fontSize: 10, color: COLORS.muted },
  sliderHigh: { fontFamily: 'Lato_400Regular', fontSize: 10, color: COLORS.muted },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },

  errorBox: {
    backgroundColor: COLORS.danger + '15', borderWidth: 1, borderColor: COLORS.danger + '40',
    borderRadius: 14, padding: 12, marginBottom: 16,
  },
  errorText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.danger, textAlign: 'center' },

  saveBtn: { borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontFamily: 'Lato_700Bold', fontSize: 15, color: COLORS.white, letterSpacing: 0.3 },
});