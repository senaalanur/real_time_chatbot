import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

export default function CharactersScreen({ navigation }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, Lato_400Regular, Lato_700Bold });

  useFocusEffect(useCallback(() => { loadCharacters(); }, []));

  const loadCharacters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('characters').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setCharacters(data ?? []);
    } catch (err) {
      console.error('Error loading characters:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCharacter = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await supabase.from('characters').delete().eq('id', id);
    loadCharacters();
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <View style={[styles.blobTop, { backgroundColor: COLORS.accentGlow }]} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Characters</Text>
          <TouchableOpacity
            style={[styles.addBtn, characters.length >= 3 && { opacity: 0.3 }]}
            onPress={() => navigation.navigate('CharacterBuilder')}
            disabled={characters.length >= 3}
          >
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>

        {characters.length >= 3 && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitText}>✦  3 characters maximum reached</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} size="large" />
        ) : characters.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyOrb}>
              <Text style={styles.emptyOrbText}>✦</Text>
            </View>
            <Text style={styles.emptyTitle}>No characters yet</Text>
            <Text style={styles.emptyText}>
              Create your first AI companion — give them a name, a color, and a personality that feels right for you.
            </Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CharacterBuilder')}>
              <Text style={styles.createBtnText}>Create Your First Character →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {characters.map(character => (
              <View key={character.id} style={[styles.card, { borderLeftColor: character.color }]}>
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => navigation.navigate('Chat', { characterId: character.id })}
                >
                  <View style={[styles.avatar, { backgroundColor: character.color + '18', borderColor: character.color + '50' }]}>
                    <Text style={[styles.avatarText, { color: character.color }]}>{character.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{character.name}</Text>
                    <View style={styles.traitRow}>
                      {[
                        { label: 'W', value: character.warmth },
                        { label: 'D', value: character.directness },
                        { label: 'E', value: character.energy },
                      ].map((t, i) => (
                        <View key={i} style={[styles.traitBadge, { backgroundColor: character.color + '15', borderColor: character.color + '30' }]}>
                          <Text style={[styles.traitLabel, { color: character.color }]}>{t.label}</Text>
                          <Text style={[styles.traitValue, { color: character.color }]}>{t.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.chatArrow, { color: character.color }]}>→</Text>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('CharacterBuilder', { character })}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteCharacter(character.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {characters.length < 3 && (
              <TouchableOpacity style={styles.addCard} onPress={() => navigation.navigate('CharacterBuilder')}>
                <Text style={styles.addCardPlus}>+</Text>
                <Text style={styles.addCardText}>New Character</Text>
                <Text style={styles.addCardSub}>{3 - characters.length} slot{3 - characters.length !== 1 ? 's' : ''} remaining</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
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

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: {
    width: 40, height: 40, backgroundColor: COLORS.surface, borderRadius: 13,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 18, color: COLORS.text },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: COLORS.text },
  addBtn: {
    width: 40, height: 40, backgroundColor: COLORS.accentSoft, borderRadius: 13,
    borderWidth: 1, borderColor: COLORS.accent + '40', alignItems: 'center', justifyContent: 'center',
  },
  addText: { fontSize: 22, color: COLORS.accent, fontFamily: 'Lato_700Bold' },

  limitBanner: {
    backgroundColor: COLORS.accentSoft, borderRadius: 14, padding: 12,
    marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.accent + '30',
  },
  limitText: { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.accent },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyOrb: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accentSoft,
    borderWidth: 1, borderColor: COLORS.accent + '40', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyOrbText: { fontSize: 32, color: COLORS.accent },
  emptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: COLORS.text, marginBottom: 10 },
  emptyText: {
    fontFamily: 'Lato_400Regular', fontSize: 14, color: COLORS.textSoft,
    textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  createBtn: {
    backgroundColor: COLORS.accent, borderRadius: 50,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  createBtnText: { fontFamily: 'Lato_700Bold', fontSize: 14, color: COLORS.white },

  list: { gap: 12 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3, overflow: 'hidden',
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22 },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: 'Lato_700Bold', fontSize: 16, color: COLORS.text, marginBottom: 8 },
  traitRow: { flexDirection: 'row', gap: 6 },
  traitBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  traitLabel: { fontFamily: 'Lato_700Bold', fontSize: 10 },
  traitValue: { fontFamily: 'Lato_700Bold', fontSize: 10 },
  chatArrow: { fontSize: 20, fontFamily: 'Lato_700Bold' },

  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border },
  editBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.border },
  editText: { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.accent },
  deleteBtn: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  deleteText: { fontFamily: 'Lato_700Bold', fontSize: 13, color: COLORS.danger },

  addCard: {
    backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1,
    borderColor: COLORS.border, borderStyle: 'dashed', padding: 28, alignItems: 'center', gap: 4,
  },
  addCardPlus: { fontSize: 28, color: COLORS.muted, fontFamily: 'Lato_700Bold' },
  addCardText: { fontFamily: 'Lato_700Bold', fontSize: 14, color: COLORS.textSoft },
  addCardSub: { fontFamily: 'Lato_400Regular', fontSize: 12, color: COLORS.muted },
});