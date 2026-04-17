import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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

export default function CharactersScreen({ navigation }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  useFocusEffect(
    useCallback(() => {
      loadCharacters();
    }, [])
  );

  const loadCharacters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: true });

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
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Characters</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CharacterBuilder')}
            disabled={characters.length >= 3}
          >
            <Text style={[styles.addText, characters.length >= 3 && { color: COLORS.muted }]}>+</Text>
          </TouchableOpacity>
        </View>

        {characters.length >= 3 && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitText}>You have 3 characters — the maximum.</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} />
        ) : characters.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✦</Text>
            <Text style={styles.emptyTitle}>No characters yet</Text>
            <Text style={styles.emptyText}>
              Create your first AI companion. Give them a name, a color, and a personality that feels right for you.
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CharacterBuilder')}
            >
              <Text style={styles.createBtnText}>Create Your First Character</Text>
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
                  <View style={[styles.avatar, {
                    backgroundColor: character.color + '20',
                    borderColor: character.color,
                  }]}>
                    <Text style={[styles.avatarText, { color: character.color }]}>
                      {character.name[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{character.name}</Text>
                    <Text style={styles.cardDesc}>
                      Warmth {character.warmth} · Directness {character.directness} · Energy {character.energy}
                    </Text>
                  </View>
                  <Text style={[styles.chatArrow, { color: character.color }]}>→</Text>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('CharacterBuilder', { character })}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteCharacter(character.id)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {characters.length < 3 && (
              <TouchableOpacity
                style={styles.addCard}
                onPress={() => navigation.navigate('CharacterBuilder')}
              >
                <Text style={styles.addCardPlus}>+</Text>
                <Text style={styles.addCardText}>Add Character</Text>
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  addBtn: {
    width: 40, height: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 22,
    color: COLORS.accent,
    fontFamily: 'Lato_700Bold',
  },

  limitBanner: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  limitText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: COLORS.accent,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    color: COLORS.accent,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 10,
  },
  emptyText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: COLORS.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 50,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  createBtnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: COLORS.white,
  },

  list: { gap: 12 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  avatar: {
    width: 48, height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
  },
  cardInfo: { flex: 1 },
  cardName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 3,
  },
  cardDesc: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: COLORS.muted,
  },
  chatArrow: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
  },

  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  editText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: COLORS.accent,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: COLORS.danger,
  },

  addCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  addCardPlus: {
    fontSize: 28,
    color: COLORS.muted,
    fontFamily: 'Lato_700Bold',
  },
  addCardText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: COLORS.textSoft,
  },
  addCardSub: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: COLORS.muted,
  },
});