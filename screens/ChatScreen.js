import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS, QUICK_ACTIONS, SOULS, callClaude } from '../constants';

const { width } = Dimensions.get('window');
const STATS_KEY = 'lumaid_stats';
const BACKEND_URL = 'https://lumaid-backend-production.up.railway.app';

async function callCharacter(messages, character, memory = '') {
  const warmthDesc = character.warmth >= 7 ? 'deeply empathetic and warm, like a close friend'
    : character.warmth <= 3 ? 'professional and objective'
    : 'balanced between warmth and objectivity';
  const directnessDesc = character.directness >= 7 ? 'very direct and honest'
    : character.directness <= 3 ? 'gentle and careful with words'
    : 'balanced between honesty and tact';
  const energyDesc = character.energy >= 7 ? 'enthusiastic and high energy'
    : character.energy <= 3 ? 'calm and soft-spoken'
    : 'steady and consistent';

  const memoryContext = memory
    ? `\n\nWhat you know about this user from past conversations:\n${memory}\n\nUse this to make responses feel personal and continuous. Never explicitly mention having a memory file.`
    : '';

  const systemPrompt = `You are ${character.name} — a personal AI wellness companion. Your personality is ${warmthDesc}, ${directnessDesc}, and ${energyDesc}. You listen deeply before responding. You never lecture. You ask one thoughtful follow-up question per response. Keep every reply to 2–3 sentences maximum. The user always feels genuinely heard after talking to you.${memoryContext}`;

  const history = messages.slice(-12);
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
  ];

  const start = Date.now();
  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages }),
  });
  const data = await res.json();
  const latency = Date.now() - start;
  if (!res.ok) throw new Error(data?.error ?? 'API error');
  return { text: data.text, latency };
}

export default function ChatScreen({ route, navigation }) {
  const soulId = route.params?.soul ?? 'zen';
  const characterId = route.params?.characterId ?? null;
  const quickActionPrompt = route.params?.quickActionPrompt ?? null;

  const [character, setCharacter] = useState(null);
  const [soul] = useState(SOULS[soulId] ?? SOULS.zen);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionLatencies, setSessionLatencies] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const flatRef = useRef(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
    SpaceMono_400Regular,
  });

  useEffect(() => {
    if (characterId) {
      supabase.from('characters').select('*').eq('id', characterId).single()
        .then(({ data }) => { if (data) setCharacter(data); });
      supabase.from('conversations').select('*').eq('character_id', characterId)
        .order('created_at', { ascending: true }).limit(20)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setMessages(data.map(row => ({
              id: row.id, role: row.role, text: row.content,
              timestamp: new Date(row.created_at).getTime(),
            })));
          }
        });
    }
  }, [characterId]);

  useEffect(() => {
    if (characterId && !character) return;
    const firstMsg = {
      id: 'init', role: 'assistant', timestamp: Date.now(),
      text: character
        ? `Hey, I'm ${character.name}. What's on your mind?`
        : { sage: "I'm here. Take a breath. What's on your mind today?", spark: "Hey! What are we tackling today?", zen: "Hello. I'm with you. Whenever you're ready.", ghost: "Ready." }[soulId] ?? 'Hello.',
    };
    setMessages([firstMsg]);
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (quickActionPrompt) setTimeout(() => sendMessage(quickActionPrompt, [firstMsg]), 800);
    return () => Speech.stop();
  }, [character, characterId]);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(Animated.sequence([
        Animated.timing(typingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(typingAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])).start();
    } else {
      typingAnim.stopAnimation();
      typingAnim.setValue(0);
    }
  }, [isLoading]);

  useEffect(() => {
    Animated.spring(quickActionsAnim, { toValue: showQuickActions ? 1 : 0, tension: 60, friction: 10, useNativeDriver: true }).start();
  }, [showQuickActions]);

  const saveStats = async (msgs) => {
    const statsRaw = await AsyncStorage.getItem(STATS_KEY);
    const stats = statsRaw ? JSON.parse(statsRaw) : { totalChats: 0 };
    stats.totalChats = msgs.filter(m => m.role === 'user').length;
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  };

  const saveMessage = async (role, content) => {
    if (!characterId) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('conversations').insert({
      user_id: user.id, character_id: characterId, soul_id: null, role, content,
    });
  };

  const loadMemory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('user_memory').select('memory_summary').eq('user_id', user.id).single();
      return data?.memory_summary ?? '';
    } catch {
      return '';
    }
  };

  const updateMemory = async (currentMessages) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: existing } = await supabase
        .from('user_memory').select('memory_summary').eq('user_id', user.id).single();

      const res = await fetch(`${BACKEND_URL}/memory/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recentMessages: currentMessages.slice(-10),
          existingMemory: existing?.memory_summary ?? '',
        }),
      });
      const data = await res.json();
      if (data.summary) {
        await supabase.from('user_memory').upsert({
          user_id: user.id,
          memory_summary: data.summary,
          last_updated: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.log('Memory update skipped:', err.message);
    }
  };

  const activeColor = character ? character.color : soul.color;
  const activeGlow = character ? character.color + '30' : soul.glow;
  const activeName = character ? character.name : soul.name;
  const activeInitial = character ? character.name[0].toUpperCase() : null;
  const activeTagline = character ? `Warmth ${character.warmth} · Energy ${character.energy}` : soul.tagline;

  const sendMessage = async (textOverride = null, msgsOverride = null) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;
    if (!textOverride) setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentMsgs = msgsOverride ?? messages;
    const userMsg = { id: `u_${Date.now()}`, role: 'user', text, timestamp: Date.now() };
    const withUser = [...currentMsgs, userMsg];
    setMessages(withUser);
    setIsLoading(true);
    setShowQuickActions(false);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const thinkingDelay = 1200 + Math.random() * 800;
      await new Promise(resolve => setTimeout(resolve, thinkingDelay));

      const memory = await loadMemory();
      const { text: reply, latency } = character
        ? await callCharacter(withUser, character, memory)
        : await callClaude(withUser, soulId, memory);

      const botMsg = { id: `b_${Date.now()}`, role: 'assistant', text: reply, latency, timestamp: Date.now() };
      const final = [...withUser, botMsg];
      setMessages(final);
      setSessionLatencies(prev => [...prev, latency]);
      saveStats(final);
      saveMessage('user', text);
      saveMessage('assistant', reply);

      // Update memory every 5 user messages
      if (final.filter(m => m.role === 'user').length % 5 === 0) {
        updateMemory(final);
      }
    } catch (err) {
      const isNetworkError = err.message?.includes('Network request failed') || err.message?.includes('fetch');
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`, role: 'assistant', isError: true, timestamp: Date.now(),
        text: isNetworkError ? "Can't reach the server. Check your connection." : "Something went wrong. Try again?",
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  const speakMessage = (text) => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(text, { rate: 0.9, pitch: 1.0, onDone: () => setIsSpeaking(false), onError: () => setIsSpeaking(false) });
  };

  const toggleSpeak = (text) => {
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); } else speakMessage(text);
  };

  if (!fontsLoaded) return null;
  if (characterId && !character) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <Animated.View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot, { opacity: fadeIn }]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: activeGlow, borderColor: activeColor + '40' }]}>
            {activeInitial
              ? <Text style={[styles.avatarInitial, { color: activeColor }]}>{activeInitial}</Text>
              : <Text style={styles.avatarEmoji}>{soul.emoji}</Text>}
          </View>
        )}

        <View style={[
          styles.bubble,
          isUser ? [styles.bubbleUser, { backgroundColor: activeColor }] : styles.bubbleBot,
          item.isError && styles.bubbleError,
        ]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot, item.isError && { color: COLORS.danger }]}>
            {item.text}
          </Text>
          {item.isError && (
            <TouchableOpacity style={styles.retryBtn} onPress={() => {
              const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
              if (lastUserMsg) sendMessage(lastUserMsg.text);
            }}>
              <Text style={styles.retryText}>Tap to retry →</Text>
            </TouchableOpacity>
          )}
        </View>

        {isUser && (
          <View style={[styles.avatar, { backgroundColor: COLORS.surfaceUp, borderColor: COLORS.border }]}>
            <Text style={[styles.avatarInitial, { color: COLORS.muted }]}>U</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const TypingIndicator = () => (
    <View style={[styles.msgRow, styles.msgRowBot]}>
      <View style={[styles.avatar, { backgroundColor: activeGlow, borderColor: activeColor + '40' }]}>
        {activeInitial
          ? <Text style={[styles.avatarInitial, { color: activeColor }]}>{activeInitial}</Text>
          : <Text style={styles.avatarEmoji}>{soul.emoji}</Text>}
      </View>
      <View style={[styles.bubbleBot, styles.bubble, styles.typingBubble]}>
        {[0, 1, 2].map(i => (
          <Animated.View key={i} style={[styles.dot, {
            backgroundColor: activeColor,
            opacity: typingAnim,
            transform: [{ translateY: typingAnim.interpolate({ inputRange: [0.3, 1], outputRange: [0, i === 1 ? -5 : -2] }) }],
          }]} />
        ))}
      </View>
    </View>
  );

  const QuickActionsSheet = () => (
    <Animated.View style={[styles.quickSheet, {
      opacity: quickActionsAnim,
      transform: [{ translateY: quickActionsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }]}>
      <Text style={styles.quickSheetTitle}>WELLNESS TOOLS</Text>
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map(action => (
          <TouchableOpacity key={action.id}
            style={[styles.quickCard, { borderColor: action.color + '40', backgroundColor: action.color + '08' }]}
            onPress={() => { setShowQuickActions(false); sendMessage(action.prompt); }}
          >
            <Text style={styles.quickEmoji}>{action.emoji}</Text>
            <Text style={[styles.quickLabel, { color: action.color }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <View style={[styles.bgGlow, { backgroundColor: activeGlow }]} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { Speech.stop(); navigation.goBack(); }} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: activeGlow, borderColor: activeColor + '60' }]}>
            {activeInitial
              ? <Text style={[styles.headerAvatarInitial, { color: activeColor }]}>{activeInitial}</Text>
              : <Text style={{ fontSize: 18 }}>{soul.emoji}</Text>}
          </View>
          <View>
            <Text style={styles.headerName}>{activeName}</Text>
            <Text style={styles.headerSub}>
              {sessionLatencies.length > 0 ? `${sessionLatencies.length} messages today` : activeTagline}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.speakBtn} onPress={() => {
          const last = [...messages].reverse().find(m => m.role === 'assistant');
          if (last) toggleSpeak(last.text);
        }}>
          <Text style={{ fontSize: 16 }}>{isSpeaking ? '🔊' : '🔇'}</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
      />

      {showQuickActions && <QuickActionsSheet />}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={[styles.iconBtn, showQuickActions && { backgroundColor: activeColor + '20', borderColor: activeColor + '40' }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowQuickActions(v => !v); }}
        >
          <Text style={{ fontSize: 16, color: showQuickActions ? activeColor : COLORS.muted }}>✦</Text>
        </TouchableOpacity>

        <View style={[styles.inputWrap, { borderColor: input.trim() ? activeColor + '50' : COLORS.border }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Talk to ${activeName}...`}
            placeholderTextColor={COLORS.muted}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            blurOnSubmit={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() ? activeColor : COLORS.surfaceUp, borderColor: input.trim() ? activeColor : COLORS.border }]}
          onPress={() => sendMessage()}
          disabled={isLoading || !input.trim()}
        >
          {isLoading
            ? <ActivityIndicator size="small" color={input.trim() ? COLORS.white : COLORS.muted} />
            : <Text style={[styles.sendIcon, { color: input.trim() ? COLORS.white : COLORS.muted }]}>↑</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  bgGlow: {
    position: 'absolute', top: -150, alignSelf: 'center',
    width: width * 1.3, height: width * 0.9,
    borderRadius: width * 0.65, opacity: 0.25, zIndex: 0,
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 58 : 36,
    paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.glass,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: 10,
  },
  backText: { fontSize: 20, color: COLORS.text },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  headerAvatarInitial: { fontFamily: 'Lato_700Bold', fontSize: 16 },
  headerName: { fontFamily: 'Lato_700Bold', fontSize: 15, color: COLORS.text },
  headerSub: { fontFamily: 'Lato_400Regular', fontSize: 11, color: COLORS.muted, marginTop: 1 },
  speakBtn: {
    width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },

  msgList: { padding: 16, paddingBottom: 12, gap: 14 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: width * 0.88 },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowBot: { alignSelf: 'flex-start' },

  avatar: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarEmoji: { fontSize: 16 },
  avatarInitial: { fontFamily: 'Lato_700Bold', fontSize: 14 },

  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22, maxWidth: width * 0.68 },
  bubbleUser: {
    borderBottomRightRadius: 6,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  bubbleBot: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 6,
  },
  bubbleError: { borderColor: COLORS.danger + '40', backgroundColor: COLORS.danger + '08' },
  bubbleText: { fontFamily: 'Lato_400Regular', fontSize: 15, lineHeight: 24 },
  bubbleTextUser: { color: COLORS.white },
  bubbleTextBot: { color: COLORS.text },

  retryBtn: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.danger + '30' },
  retryText: { fontFamily: 'Lato_700Bold', fontSize: 12, color: COLORS.danger },

  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 14, paddingHorizontal: 16 },
  dot: { width: 7, height: 7, borderRadius: 4 },

  quickSheet: {
    backgroundColor: COLORS.bgCard, borderTopWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  quickSheetTitle: { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.muted, letterSpacing: 0.14, marginBottom: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickCard: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 22, paddingHorizontal: 13, paddingVertical: 9 },
  quickEmoji: { fontSize: 13 },
  quickLabel: { fontFamily: 'Lato_700Bold', fontSize: 12 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.glass,
  },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  inputWrap: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 120 },
  input: { fontFamily: 'Lato_400Regular', fontSize: 15, color: COLORS.text },
  sendBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  sendIcon: { fontSize: 18, fontFamily: 'Lato_700Bold' },
});