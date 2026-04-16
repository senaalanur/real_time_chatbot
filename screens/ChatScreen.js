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
import { COLORS, QUICK_ACTIONS, SOULS, callClaude } from '../constants';

const { width } = Dimensions.get('window');
const STATS_KEY = 'lumaid_stats';

export default function ChatScreen({ route, navigation }) {
  const soulId = route.params?.soul ?? 'zen';
  const quickActionPrompt = route.params?.quickActionPrompt ?? null;
  const soul = SOULS[soulId];

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
    const openings = {
      sage:  "I'm here. Take a breath. What's on your mind today?",
      spark: "Hey! What are we tackling today?",
      zen:   "Hello. I'm with you. Whenever you're ready.",
      ghost: "Ready.",
    };

    const firstMsg = {
      id: 'init',
      role: 'assistant',
      text: openings[soulId] ?? 'Hello.',
      timestamp: Date.now(),
    };

    setMessages([firstMsg]);
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    if (quickActionPrompt) {
      setTimeout(() => sendMessage(quickActionPrompt, [firstMsg]), 800);
    }

    return () => Speech.stop();
  }, []);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnim.stopAnimation();
      typingAnim.setValue(0);
    }
  }, [isLoading]);

  useEffect(() => {
    Animated.spring(quickActionsAnim, {
      toValue: showQuickActions ? 1 : 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [showQuickActions]);

  const saveStats = async (msgs) => {
    const statsRaw = await AsyncStorage.getItem(STATS_KEY);
    const stats = statsRaw ? JSON.parse(statsRaw) : { totalChats: 0 };
    stats.totalChats = msgs.filter(m => m.role === 'user').length;
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  };

  const sendMessage = async (textOverride = null, msgsOverride = null) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;
    if (!textOverride) setInput('');

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentMsgs = msgsOverride ?? messages;
    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const withUser = [...currentMsgs, userMsg];
    setMessages(withUser);
    setIsLoading(true);
    setShowQuickActions(false);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      // Thinking delay — makes responses feel considered, not instant
      const thinkingDelay = 1200 + Math.random() * 800;
      await new Promise(resolve => setTimeout(resolve, thinkingDelay));

      const { text: reply, latency } = await callClaude(withUser, soulId);

      const botMsg = {
        id: `b_${Date.now()}`,
        role: 'assistant',
        text: reply,
        latency,
        timestamp: Date.now(),
      };
      const final = [...withUser, botMsg];
      setMessages(final);
      setSessionLatencies(prev => [...prev, latency]);
      saveStats(final);
    } catch (err) {
      const isNetworkError = err.message?.includes('Network request failed')
        || err.message?.includes('fetch');
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: isNetworkError
            ? "Can't reach the server right now. Check your connection and try again."
            : "Something went wrong. Try again?",
          timestamp: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  const speakMessage = (text) => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(text, {
      rate: soulId === 'spark' ? 1.1 : soulId === 'ghost' ? 1.0 : 0.88,
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
      <Animated.View
        style={[
          styles.msgRow,
          isUser ? styles.msgRowUser : styles.msgRowBot,
          { opacity: fadeIn },
        ]}
      >
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: soul.glow }]}>
            <Text style={styles.avatarEmoji}>{soul.emoji}</Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={isUser ? 1 : 0.75}
          onPress={() => !isUser && toggleSpeak(item.text)}
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: soul.color }]
              : [styles.bubbleBot, { borderLeftColor: soul.color }],
            item.isError && styles.bubbleError,
          ]}
        >
          <Text style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextBot,
            item.isError && { color: COLORS.danger },
          ]}>
            {item.text}
          </Text>
        </TouchableOpacity>

        {isUser && (
          <View style={[styles.avatar, { backgroundColor: COLORS.surfaceUp }]}>
            <Text style={styles.avatarEmoji}>○</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const TypingIndicator = () => (
    <View style={[styles.msgRow, styles.msgRowBot]}>
      <View style={[styles.avatar, { backgroundColor: soul.glow }]}>
        <Text style={styles.avatarEmoji}>{soul.emoji}</Text>
      </View>
      <View style={[styles.bubbleBot, styles.bubble, styles.typingBubble, { borderLeftColor: soul.color }]}>
        {[0, 1, 2].map(i => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: soul.color,
                opacity: typingAnim,
                transform: [{
                  translateY: typingAnim.interpolate({
                    inputRange: [0.3, 1],
                    outputRange: [0, i === 1 ? -5 : -2],
                  }),
                }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );

  const QuickActionsSheet = () => (
    <Animated.View
      style={[
        styles.quickSheet,
        {
          opacity: quickActionsAnim,
          transform: [{
            translateY: quickActionsAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}
    >
      <Text style={styles.quickSheetTitle}>WELLNESS TOOLS</Text>
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map(action => (
          <TouchableOpacity
            key={action.id}
            style={[styles.quickCard, { borderColor: soul.color + '40' }]}
            onPress={() => {
              setShowQuickActions(false);
              sendMessage(action.prompt);
            }}
          >
            <Text style={styles.quickEmoji}>{action.emoji}</Text>
            <Text style={styles.quickLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <Animated.View
        style={[styles.ambientGlow, { backgroundColor: soul.glow }]}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { Speech.stop(); navigation.goBack(); }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, {
            backgroundColor: soul.glow,
            borderColor: soul.color + '60',
          }]}>
            <Text style={{ fontSize: 17 }}>{soul.emoji}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{soul.name}</Text>
            <Text style={styles.headerSub}>
              {avgLatency
                ? `${sessionLatencies.length} messages today`
                : soul.tagline}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.speakBtn}
          onPress={() => {
            const last = [...messages].reverse().find(m => m.role === 'assistant');
            if (last) toggleSpeak(last.text);
          }}
        >
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
          style={[styles.iconBtn, showQuickActions && { backgroundColor: soul.color + '25' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowQuickActions(v => !v);
          }}
        >
          <Text style={{ fontSize: 16, color: showQuickActions ? soul.color : COLORS.muted }}>✦</Text>
        </TouchableOpacity>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Talk to ${soul.name}...`}
            placeholderTextColor={COLORS.muted}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            blurOnSubmit={false}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: input.trim() ? soul.color : COLORS.border },
          ]}
          onPress={() => sendMessage()}
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

  ambientGlow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: width * 1.2,
    height: width * 0.8,
    borderRadius: width * 0.6,
    opacity: 0.3,
    zIndex: 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 58 : 36,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.glass,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceUp,
    marginRight: 10,
  },
  backText: { fontSize: 20, color: COLORS.text },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 38, height: 38,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: COLORS.text,
  },
  headerSub: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 1,
  },
  speakBtn: {
    width: 38, height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceUp,
  },

  msgList: {
    padding: 16,
    paddingBottom: 12,
    gap: 12,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: width * 0.88,
  },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowBot: { alignSelf: 'flex-start' },

  avatar: {
    width: 32, height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: 15 },

  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: width * 0.68,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  bubbleBot: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  bubbleError: {
    borderColor: COLORS.danger + '40',
    backgroundColor: COLORS.danger + '10',
  },
  bubbleText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    lineHeight: 24,
  },
  bubbleTextUser: { color: COLORS.white },
  bubbleTextBot: { color: COLORS.text },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dot: {
    width: 7, height: 7,
    borderRadius: 4,
  },

  quickSheet: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  quickSheetTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.14,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceUp,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickEmoji: { fontSize: 13 },
  quickLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: COLORS.textSoft,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.glass,
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceUp,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: COLORS.surfaceUp,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: COLORS.text,
  },
  sendBtn: {
    width: 40, height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: COLORS.white,
    fontFamily: 'Lato_700Bold',
  },
});