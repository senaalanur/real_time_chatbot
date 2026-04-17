// ── Design Tokens ─────────────────────────────────────────────────────────────
export const COLORS = {
  bg:          '#0D0F14',
  bgCard:      '#12151C',
  surface:     '#181C26',
  surfaceUp:   '#1E2233',
  border:      '#252A3A',
  borderBright:'#313855',
  text:        '#EEF0F8',
  textSoft:    '#8B91A8',
  muted:       '#555D7A',
  accent:      '#4F8EF7',
  accentSoft:  'rgba(79,142,247,0.12)',
  accentGlow:  'rgba(79,142,247,0.25)',
  danger:      '#E06B6B',
  success:     '#4FB87A',
  white:       '#FFFFFF',
  shadow:      'rgba(0,0,0,0.4)',
  glass:       'rgba(24,28,38,0.75)',
};

// ── Soul Modes ────────────────────────────────────────────────────────────────
export const SOULS = {
  sage: {
    id: 'sage',
    name: 'Sage',
    emoji: '🌿',
    color: '#4FB87A',
    glow: 'rgba(79,184,122,0.15)',
    tagline: 'Wisdom, patience, perspective.',
    systemPrompt: `You are Sage — a warm wellness companion with the presence of a seasoned therapist. You listen first, respond second. You never rush, never lecture. Reflect back what the user is feeling before offering any perspective. Ask one thoughtful follow-up question per response. Keep every reply to 2–3 sentences maximum. Never use emojis. End with a grounding observation or a single open question.`,
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    emoji: '⚡',
    color: '#F7A94F',
    glow: 'rgba(247,169,79,0.15)',
    tagline: 'Energy, hype, good vibes only.',
    systemPrompt: `You are Spark — a high-energy wellness companion who genuinely believes in the user. You celebrate every win, reframe every setback. Use casual, punchy language. Max 2 sentences. One follow-up question. You may use ONE emoji per response. Never preach. Make the user feel capable right now.`,
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    emoji: '🌊',
    color: '#4F8EF7',
    glow: 'rgba(79,142,247,0.15)',
    tagline: 'Calm, grounded, no judgment.',
    systemPrompt: `You are Zen — a completely non-judgmental wellness companion. You are like a quiet, safe room. Always acknowledge the emotion behind the words before anything else. Speak in soft, measured language. Never alarm, never push advice. 2 gentle sentences maximum. Ask one soft question. The user always feels heard after talking to you.`,
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    emoji: '◈',
    color: '#9B8FD4',
    glow: 'rgba(155,143,212,0.15)',
    tagline: 'Minimal. Direct. No fluff.',
    systemPrompt: `You are Ghost — precise, sharp, no filler. 1–2 sentences maximum. No pleasantries. Just the most honest, useful thing you can say. Occasionally one unexpected reframe that changes how the user sees the situation. Respect their intelligence. Never over-explain.`,
  },
};

// ── Quick Actions ─────────────────────────────────────────────────────────────
export const QUICK_ACTIONS = [
  {
    id: 'checkin',
    label: 'Daily Check-in',
    emoji: '🌅',
    prompt: 'I want to do my daily check-in. Ask me how I am feeling today and help me reflect on it.',
  },
  {
    id: 'vent',
    label: 'I Need to Vent',
    emoji: '💬',
    prompt: "I just need to vent. Listen to me, acknowledge how I feel, and ask follow-up questions. Don't jump to solutions.",
  },
  {
    id: 'reflect',
    label: 'Evening Reflection',
    emoji: '🌙',
    prompt: 'Guide me through a short evening reflection. Ask me one thoughtful question at a time about my day.',
  },
  {
    id: 'anxiety',
    label: 'Feeling Anxious',
    emoji: '🌬️',
    prompt: 'I am feeling anxious right now. Help me slow down and work through what is on my mind. Ask me what is worrying me.',
  },
  {
    id: 'focus',
    label: 'Focus Mode',
    emoji: '🎯',
    prompt: 'Help me get focused. Ask what I need to accomplish today, then help me break it into clear steps.',
  },
  {
    id: 'gratitude',
    label: 'Gratitude Practice',
    emoji: '✨',
    prompt: 'Guide me through a quick gratitude practice. Ask me one question at a time.',
  },
];

// ── Mood Options ──────────────────────────────────────────────────────────────
export const MOODS = [
  { id: 'great', label: 'Great',   emoji: '✦', color: '#4FB87A', value: 5 },
  { id: 'good',  label: 'Good',    emoji: '◎', color: '#4F8EF7', value: 4 },
  { id: 'okay',  label: 'Okay',    emoji: '○', color: '#9B8FD4', value: 3 },
  { id: 'low',   label: 'Low',     emoji: '◌', color: '#F7A94F', value: 2 },
  { id: 'rough', label: 'Rough',   emoji: '✕', color: '#E06B6B', value: 1 },
];

// ── API ───────────────────────────────────────────────────────────────────────
const BACKEND_URL = 'https://lumaid-backend-production.up.railway.app';

export async function callClaude(messages, soulId = 'zen') {
  const soul = SOULS[soulId];
  const history = messages.slice(-12);

  const apiMessages = [
    { role: 'system', content: soul.systemPrompt },
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