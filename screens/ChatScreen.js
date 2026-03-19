import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated, Dimensions,
    FlatList,
    KeyboardAvoidingView, Platform,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, SOULS, callGemini } from '../constants';

const { width } = Dimensions.get('window');
const SESSION_KEY = 'echo_session';
const STATS_KEY   = 'echo_stats';

export default function ChatScreen({ route, navigation }) {
  const soulId = route.params?.soul ?? 'zen';
  const soul = SOULS[soulId];

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionLatencies, setSessionLatencies] = useState([]);

  const flatRef = useRef(null);
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
    SpaceMono_400Regular,
  });

  useEffect(() => {
    loadSession();
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    return () => Speech.stop();
  }, []);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnim.stopAnimation();
    }
  }, [isLoading]);

  const loadSession = async () => {
    const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
    if (sessionRaw) {
      setMessages(JSON.parse(sessionRaw).slice(-20));
    } else {
      const openings = {
        sage:  "I'm here. Take a breath. What's on your mind?",
        spark: "Hey! 🌟 So pumped you're here — what are we talking about today?!",
        zen:   "Hello. I'm with you. Whenever you're ready.",
        ghost: "Ready.",
      };
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        text: openings[soulId] ?? "Hello.",
        timestamp: Date.now(),
      }]);
    }
  };

  const saveSession = async (msgs) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(msgs));
    const statsRaw = await AsyncStorage.getItem(STATS_KEY);
    const stats = statsRaw ? JSON.parse(statsRaw) : { totalChats: 0 };
    stats.totalChats = msgs.filter(m => m.role === 'user').length;
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg = {
      id: Date.now().toString(),
      role: 'user', text,
      timestamp: Date.now(),
    };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setIsLoading(true);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { text: reply, latency } = await callGemini(newMsgs, soulId);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant', text: reply,
        latency, timestamp: Date.now(),
      };
      const finalMsgs = [...newMsgs, botMsg];
      setMessages(finalMsgs);
      setSessionLatencies(prev => [...prev, latency]);
      saveSession(finalMsgs);
      speakMessage(reply);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I'm having a moment. Try again?",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const speakMessage = (text) => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(text, {
      rate: soulId === 'spark' ? 1.1 : 0.9,
      pitch: soulId === 'spark' ? 1.1 : 1.0,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const toggleSpeak = (text) => {
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); }
    else speakMessage(text);
  };

  const avgLatency = sessionLatencies.length
    ? Math.round(sessionLatencies.reduce((a, b) => a + b, 0) / sessionLatencies.length)
    : null;

  if (!fontsLoaded) return null;

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <Animated.View style={[
        styles.msgRow,
        isUser ? styles.msgRowUser : styles.msgRowBot,
        { opacity: fadeIn },
      ]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: soul.color + '20' }]}>
            <Text style={{ fontSize: 14 }}>{soul.emoji}</Text>
          </View>
        )}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => !isUser && toggleSpeak(item.text)}
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleBot,
          ]}
        >
          <Text style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextBot,
          ]}>
            {item.text}
          </Text>
          {item.latency && (
            <Text style={styles.latencyText}>⚡ {item.latency}ms</Text>
          )}
        </TouchableOpacity>
        {isUser && (
          <View style={[styles.avatar, { backgroundColor: COLORS.surfaceUp }]}>
            <Text style={{ fontSize: 14 }}>👤</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const TypingIndicator = () => (
    <View style={[styles.msgRow, styles.msgRowBot]}>
      <View style={[styles.avatar, { backgroundColor: soul.color + '20' }]}>
        <Text style={{ fontSize: 14 }}>{soul.emoji}</Text>
      </View>
      <View style={styles.bubbleBot}>
        <View style={styles.typingDots}>
          {[0, 1, 2].map(i => (
            <Animated.View
              key={i}
              style={[styles.typingDot, {
                backgroundColor: soul.color,
                opacity: typingAnim,
              }]}
            />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatarSmall, { backgroundColor: soul.color + '20' }]}>
            <Text style={{ fontSize: 16 }}>{soul.emoji}</Text>
          </View>
          <View>
            <Text style={styles.headerSoul}>{soul.name}</Text>
            {avgLatency && (
              <Text style={styles.headerLatency}>avg {avgLatency}ms</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.speakToggle}
          onPress={() => toggleSpeak(messages[messages.length - 1]?.text ?? '')}
        >
          <Text style={{ fontSize: 18 }}>{isSpeaking ? '🔊' : '🔇'}</Text>
        </TouchableOpacity>
      </View>

      {/* Soul tagline */}
      <View style={[styles.taglineBar, { backgroundColor: soul.color + '10' }]}>
        <Text style={[styles.taglineText, { color: soul.color }]}>
          {soul.tagline}
        </Text>
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

      {/* Input */}
      <View style={styles.inputBar}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${soul.name}...`}
            placeholderTextColor={COLORS.muted}
            multiline
            returnKeyType="send"
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: input.trim() ? soul.color : COLORS.border },
          ]}
          onPress={send}
          disabled={isLoading || !input.trim()}
        >
          {isLoading
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Text style={styles.sendIcon}>↑</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4, marginRight: 8 },
  backText: { fontSize: 22, color: COLORS.text },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatarSmall: {
    width: 36, height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSoul: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: COLORS.text,
  },
  headerLatency: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: COLORS.muted,
  },
  speakToggle: { padding: 8 },

  // Tagline bar
  taglineBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  taglineText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },

  // Messages
  msgList: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  msgRow: {
    flexDirection: 'row',
    gap: 8,
    maxWidth: width * 0.85,
  },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowBot:  { alignSelf: 'flex-start' },

  avatar: {
    width: 34, height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  bubble: {
    padding: 14,
    borderRadius: 18,
    maxWidth: width * 0.65,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  bubbleUser: {
    backgroundColor: COLORS.text,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    lineHeight: 23,
  },
  bubbleTextUser: { color: COLORS.white },
  bubbleTextBot:  { color: COLORS.text },

  latencyText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 6,
  },

  typingDots: { flexDirection: 'row', gap: 5, padding: 6 },
  typingDot: { width: 7, height: 7, borderRadius: 4 },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: COLORS.text,
  },
  sendBtn: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: COLORS.white,
    fontFamily: 'Lato_700Bold',
  },
});