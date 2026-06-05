// ── Design Tokens — Lumaid Light & Airy ──────────────────────────────────────
export const COLORS = {
  // Backgrounds
  bg:           '#EDEAE2',
  bgCard:       '#F7F4EC',
  surface:      'rgba(200,170,80,0.10)',
  surfaceUp:    'rgba(200,170,80,0.16)',
  surfaceHigh:  'rgba(200,170,80,0.22)',

  // Borders
  border:       'rgba(200,170,80,0.30)',
  borderBright: 'rgba(200,170,80,0.50)',
  borderGlow:   'rgba(200,170,80,0.65)',

  // Text
  text:         '#2C1F00',
  textSoft:     '#6B5030',
  muted:        '#9B7B2E',

  // Accent — warm gold
  accent:       '#F5C832',
  accentDark:   '#D4A017',
  accentSoft:   'rgba(245,200,50,0.12)',
  accentGlow:   'rgba(245,200,50,0.28)',

  // Cyan (kept for Zen soul)
  cyan:         '#06B6D4',
  cyanSoft:     'rgba(6,182,212,0.10)',
  cyanGlow:     'rgba(6,182,212,0.22)',

  // Semantic
  danger:       '#DC2626',
  success:      '#16A34A',
  warning:      '#D97706',

  // Utility
  white:        '#F7F4EC',
  shadow:       'rgba(44,31,0,0.12)',
  glass:        'rgba(255,253,247,0.92)',
  glassBright:  'rgba(255,255,255,0.70)',
};

export const GRADIENTS = {
  gold:   ['#D4A017', '#F5C832'],
  cyan:   ['#0891B2', '#06B6D4'],
  pink:   ['#DB2777', '#EC4899'],
  green:  ['#059669', '#34D399'],
  amber:  ['#D97706', '#FBBF24'],
};

export const SOULS = {
  sage: {
    id: 'sage',
    name: 'Sage',
    emoji: '🌿',
    color: '#16A34A',
    colorDark: '#15803D',
    glow: 'rgba(22,163,74,0.15)',
    glowBright: 'rgba(22,163,74,0.30)',
    tagline: 'Wisdom, patience, perspective.',
    systemPrompt: `You are Sage — a warm wellness companion with the presence of a seasoned therapist. You listen first, respond second. You never rush, never lecture. Reflect back what the user is feeling before offering any perspective. Ask one thoughtful follow-up question per response. Keep every reply to 2–3 sentences maximum. Never use emojis. End with a grounding observation or a single open question.`,
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    emoji: '⚡',
    color: '#F59E0B',
    colorDark: '#D97706',
    glow: 'rgba(245,158,11,0.15)',
    glowBright: 'rgba(245,158,11,0.30)',
    tagline: 'Energy, hype, good vibes only.',
    systemPrompt: `You are Spark — a high-energy wellness companion who genuinely believes in the user. You celebrate every win, reframe every setback. Use casual, punchy language. Max 2 sentences. One follow-up question. You may use ONE emoji per response. Never preach. Make the user feel capable right now.`,
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    emoji: '🌊',
    color: '#06B6D4',
    colorDark: '#0891B2',
    glow: 'rgba(6,182,212,0.15)',
    glowBright: 'rgba(6,182,212,0.30)',
    tagline: 'Calm, grounded, no judgment.',
    systemPrompt: `You are Zen — a completely non-judgmental wellness companion. You are like a quiet, safe room. Always acknowledge the emotion behind the words before anything else. Speak in soft, measured language. Never alarm, never push advice. 2 gentle sentences maximum. Ask one soft question. The user always feels heard after talking to you.`,
  },
  cass: {
    id: 'cass',
    name: 'Cass',
    emoji: '✦',
    color: '#A855F7',
    colorDark: '#9333EA',
    glow: 'rgba(168,85,247,0.15)',
    glowBright: 'rgba(168,85,247,0.30)',
    tagline: 'Babe, this is so not that deep.',
    systemPrompt: `You are Cass — a wealthy, unbothered nepo baby who has never stressed a day in their life and genuinely cannot understand why you would either. You are dismissive but weirdly always right. You never offer sympathy — only solutions, delivered with light eye-roll energy. Use Gen Z language naturally: "babe", "hon", "literally", "not me", "okay but", "so". Keep replies to 1–2 sentences max. Never dramatize anything. Your core message is always some version of: relax, spend money on it, move on, you're overthinking. You care — you just refuse to show it. End with one careless but oddly correct suggestion.`,
  },
};

export const QUICK_ACTIONS = [
  { id: 'checkin',   label: 'Daily Check-in',     emoji: '🌅', color: '#D97706', prompt: 'I want to do my daily check-in. Ask me how I am feeling today and help me reflect on it.' },
  { id: 'vent',      label: 'I Need to Vent',      emoji: '💬', color: '#DC2626', prompt: "I just need to vent. Listen to me, acknowledge how I feel, and ask follow-up questions. Don't jump to solutions." },
  { id: 'reflect',   label: 'Evening Reflection',  emoji: '🌙', color: '#A855F7', prompt: 'Guide me through a short evening reflection. Ask me one thoughtful question at a time about my day.' },
  { id: 'anxiety',   label: 'Feeling Anxious',     emoji: '🌬️', color: '#06B6D4', prompt: 'I am feeling anxious right now. Help me slow down and work through what is on my mind.' },
  { id: 'focus',     label: 'Focus Mode',          emoji: '🎯', color: '#16A34A', prompt: 'Help me get focused. Ask what I need to accomplish today, then help me break it into clear steps.' },
  { id: 'gratitude', label: 'Gratitude Practice',  emoji: '✨', color: '#F5C832', prompt: 'Guide me through a quick gratitude practice. Ask me one question at a time.' },
];

export const MOODS = [
  { id: 'great', label: 'Great', emoji: '✦', color: '#16A34A', value: 5 },
  { id: 'good',  label: 'Good',  emoji: '◎', color: '#06B6D4', value: 4 },
  { id: 'okay',  label: 'Okay',  emoji: '○', color: '#F5C832', value: 3 },
  { id: 'low',   label: 'Low',   emoji: '◌', color: '#D97706', value: 2 },
  { id: 'rough', label: 'Rough', emoji: '✕', color: '#DC2626', value: 1 },
];

// ── API ───────────────────────────────────────────────────────────────────────
const BACKEND_URL = 'https://lumaid-backend-production-bee3.up.railway.app';

export async function callClaude(messages, soulId = 'zen', memory = '') {
  const soul = SOULS[soulId];
  const history = messages.slice(-12);

  const memoryContext = memory
    ? `\n\nWhat you know about this user from past conversations:\n${memory}\n\nUse this context to make responses feel personal and continuous, but never explicitly mention that you have a memory file.`
    : '';

  const apiMessages = [
    { role: 'system', content: soul.systemPrompt + memoryContext },
    ...history.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];

  const start = Date.now();
  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages }),
  });

  const data = await res.json();
  const latency = Date.now() - start;

  if (!res.ok) {
    console.error('Backend error:', data);
    throw new Error(data?.error ?? 'API error');
  }

  return { text: data.text, latency };
}

// ── Feature Flags ─────────────────────────────────────────────────────────────
export const FEATURES = {
  weeklyRecap:      false,
  characterBuilder: false,
  voiceInput:       false,
  notifications:    false,
};