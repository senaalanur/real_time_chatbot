import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

const AVATAR_COLORS = [
  '#4F8EF7', '#4FB87A', '#F7A94F',
  '#9B8FD4', '#E06B6B', '#4ECDC4',
  '#F7DC6F', '#EC407A', '#26C6DA',
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

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  if (!fontsLoaded) return null;

  const getPersonalityDescription = () => {
    const w = warmth >= 7 ? 'warm and caring' : warmth <= 3 ? 'cool and professional' : 'balanced';
    const d = directness >= 7 ? 'very direct' : directness <= 3 ? 'gentle and soft' : 'measured';
    const e = energy >= 7 ? 'high energy' : energy <= 3 ? 'calm and quiet' : 'steady';
    return `${w}, ${d}, ${e}`;
  };

  const buildSystemPrompt = () => {
    const warmthDesc = warmth >= 7 ? 'deeply empathetic and warm, like a close friend'
      : warmth <= 3 ? 'professional and objective, keeping emotional distance'
      : 'balanced between warmth and objectivity';

    const directnessDesc = directness >= 7 ? 'very direct and honest, saying exactly what you think without softening'
      : directness <= 3 ? 'gentle and careful with words, always cushioning feedback'
      : 'balanced between honesty and tact';

    const energyDesc = energy >= 7 ? 'enthusiastic and energetic, bringing high positive energy'
      : energy <= 3 ? 'calm and quiet, speaking softly and slowly'
      : 'steady and consistent in energy';

    return `You are ${name} — a personal AI wellness companion. Your personality is ${warmthDesc}, ${directnessDesc}, and ${energyDesc}. You listen deeply before responding. You never lecture or give unsolicited advice. You ask one thoughtful follow-up question per response. Keep every reply to 2–3 sentences maximum. The user feels genuinely heard after every conversation with you.`;
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please give your character a name.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const characterData = {
        user_id: user.id,
        name: name.trim(),
        color,
        warmth,
        directness,
        energy,
      };

      let result;
      if (existingCharacter) {
        result = await supabase
          .from('characters')
          .update(characterData)
          .eq('id', existingCharacter.id);
      } else {
        result = await supabase
          .from('characters')
          .insert(characterData);
      }

      if (result.error) throw result.error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();

    } catch (err) {
      setError(err.message ?? 'Something went wrong. Try again.');
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
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
          <TouchableOpacity
            key={i}
            style={[
              styles.sliderDot,
              i <= value && { backgroundColor: color },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setValue(i);
            }}
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {existingCharacter ? 'Edit Character' : 'New Character'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar preview */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: color + '20', borderColor: color }]}>
            <Text style={[styles.avatarInitials, { color }]}>
              {name.trim() ? name.trim()[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.avatarName}>{name.trim() || 'Your character'}</Text>
          <Text style={styles.avatarDesc}>{getPersonalityDescription()}</Text>
        </View>

        {/* Name input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CHARACTER NAME</Text>
          <TextInput
            style={styles.input}
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
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setColor(c);
                }}
              />
            ))}
          </View>
        </View>

        {/* Personality sliders */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PERSONALITY</Text>
          <View style={styles.card}>
            <SliderRow
              label="Warmth"
              value={warmth}
              setValue={setWarmth}
              lowLabel="Cool"
              highLabel="Warm"
            />
            <View style={styles.divider} />
            <SliderRow
              label="Directness"
              value={directness}
              setValue={setDirectness}
              lowLabel="Gentle"
              highLabel="Direct"
            />
            <View style={styles.divider} />
            <SliderRow
              label="Energy"
              value={energy}
              setValue={setEnergy}
              lowLabel="Calm"
              highLabel="Energetic"
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: color }, loading && styles.btnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.saveBtnText}>
                {existingCharacter ? 'Save Changes' : 'Create Character'}
              </Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
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

  avatarWrap: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 88, height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitials: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 36,
  },
  avatarName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 4,
  },
  avatarDesc: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
  },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.12,
    marginBottom: 10,
  },

  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: COLORS.text,
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorDot: {
    width: 36, height: 36,
    borderRadius: 18,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: COLORS.white,
    transform: [{ scale: 1.15 }],
  },

  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 18,
  },
  sliderRow: { paddingVertical: 4 },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sliderLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: COLORS.text,
  },
  sliderValue: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
  },
  sliderTrack: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  sliderDot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLow: {
    fontFamily: 'Lato_400Regular',
    fontSize: 10,
    color: COLORS.muted,
  },
  sliderHigh: {
    fontFamily: 'Lato_400Regular',
    fontSize: 10,
    color: COLORS.muted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },

  errorBox: {
    backgroundColor: COLORS.danger + '18',
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.danger,
    textAlign: 'center',
  },

  saveBtn: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});