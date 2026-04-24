// ── Design Tokens — Lumaid Dark Neon ──────────────────────────────────────────
export const COLORS = {
  bg:           '#08060F',
  bgCard:       '#0F0C1A',
  surface:      'rgba(255,255,255,0.04)',
  surfaceUp:    'rgba(255,255,255,0.07)',
  surfaceHigh:  'rgba(255,255,255,0.10)',
  border:       'rgba(255,255,255,0.08)',
  borderBright: 'rgba(255,255,255,0.15)',
  borderGlow:   'rgba(168,85,247,0.4)',
  text:         '#FFFFFF',
  textSoft:     '#CBD5E1',
  muted:        '#64748B',
  accent:       '#A855F7',
  accentDark:   '#7C3AED',
  accentSoft:   'rgba(168,85,247,0.12)',
  accentGlow:   'rgba(168,85,247,0.25)',
  cyan:         '#06B6D4',
  cyanSoft:     'rgba(6,182,212,0.12)',
  cyanGlow:     'rgba(6,182,212,0.25)',
  danger:       '#F87171',
  success:      '#34D399',
  warning:      '#FBBF24',
  white:        '#FFFFFF',
  shadow:       'rgba(0,0,0,0.6)',
  glass:        'rgba(8,6,15,0.85)',
  glassBright:  'rgba(255,255,255,0.03)',
};

export const GRADIENTS = {
  purple: ['#7C3AED', '#A855F7'],
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
    color: '#34D399',
    colorDark: '#059669',
    glow: 'rgba(52,211,153,0.2)',
    glowBright: 'rgba(52,211,153,0.4)',
    tagline: 'Wisdom, patience, perspective.',
    systemPrompt: `You are Sage — a warm wellness companion with the presence of a seasoned therapist. You listen first, respond second. You never rush, never lecture. Reflect back what the user is feeling before offering any perspective. Ask one thoughtful follow-up question per response. Keep every reply to 2–3 sentences maximum. Never use emojis. End with a grounding observation or a single open question.`,
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    emoji: '⚡',
    color: '#FBBF24',
    colorDark: '#D97706',
    glow: 'rgba(251,191,36,0.2)',
    glowBright: 'rgba(251,191,36,0.4)',
    tagline: 'Energy, hype, good vibes only.',
    systemPrompt: `You are Spark — a high-energy wellness companion who genuinely believes in the user. You celebrate every win, reframe every setback. Use casual, punchy language. Max 2 sentences. One follow-up question. You may use ONE emoji per response. Never preach. Make the user feel capable right now.`,
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    emoji: '🌊',
    color: '#06B6D4',
    colorDark: '#0891B2',
    glow: 'rgba(6,182,212,0.2)',
    glowBright: 'rgba(6,182,212,0.4)',
    tagline: 'Calm, grounded, no judgment.',
    systemPrompt: `You are Zen — a completely non-judgmental wellness companion. You are like a quiet, safe room. Always acknowledge the emotion behind the words before anything else. Speak in soft, measured language. Never alarm, never push advice. 2 gentle sentences maximum. Ask one soft question. The user always feels heard after talking to you.`,
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    emoji: '◈',
    color: '#A855F7',
    colorDark: '#7C3AED',
    glow: 'rgba(168,85,247,0.2)',
    glowBright: 'rgba(168,85,247,0.4)',
    tagline: 'Minimal. Direct. No fluff.',
    systemPrompt: `You are Ghost — precise, sharp, no filler. 1–2 sentences maximum. No pleasantries. Just the most honest, useful thing you can say. Occasionally one unexpected reframe that changes how the user sees the situation. Respect their intelligence. Never over-explain.`,
  },
};

export const QUICK_ACTIONS = [
  { id: 'checkin', label: 'Daily Check-in', emoji: '🌅', color: '#FBBF24', prompt: 'I want to do my daily check-in. Ask me how I am feeling today and help me reflect on it.' },
  { id: 'vent', label: 'I Need to Vent', emoji: '💬', color: '#F87171', prompt: "I just need to vent. Listen to me, acknowledge how I feel, and ask follow-up questions. Don't jump to solutions." },
  { id: 'reflect', label: 'Evening Reflection', emoji: '🌙', color: '#A855F7', prompt: 'Guide me through a short evening reflection. Ask me one thoughtful question at a time about my day.' },
  { id: 'anxiety', label: 'Feeling Anxious', emoji: '🌬️', color: '#06B6D4', prompt: 'I am feeling anxious right now. Help me slow down and work through what is on my mind.' },
  { id: 'focus', label: 'Focus Mode', emoji: '🎯', color: '#34D399', prompt: 'Help me get focused. Ask what I need to accomplish today, then help me break it into clear steps.' },
  { id: 'gratitude', label: 'Gratitude Practice', emoji: '✨', color: '#FBBF24', prompt: 'Guide me through a quick gratitude practice. Ask me one question at a time.' },
];

export const MOODS = [
  { id: 'great', label: 'Great', emoji: '✦', color: '#34D399', value: 5 },
  { id: 'good',  label: 'Good',  emoji: '◎', color: '#06B6D4', value: 4 },
  { id: 'okay',  label: 'Okay',  emoji: '○', color: '#A855F7', value: 3 },
  { id: 'low',   label: 'Low',   emoji: '◌', color: '#FBBF24', value: 2 },
  { id: 'rough', label: 'Rough', emoji: '✕', color: '#F87171', value: 1 },
];

// ── API ───────────────────────────────────────────────────────────────────────
const BACKEND_URL = 'https://lumaid-backend-production.up.railway.app';

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