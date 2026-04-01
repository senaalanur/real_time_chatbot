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
    systemPrompt: `You are Sage — a wise, measured AI companion with the energy of a seasoned philosopher and therapist combined. Your responses draw on timeless wisdom, nature metaphors, and the Socratic method. You never rush. You ask one clarifying question when needed. You help users see the larger pattern beneath their immediate problem. Keep responses to 2–4 warm, unhurried sentences unless depth is genuinely called for. Never use emojis. Always end with a grounding observation.`,
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    emoji: '⚡',
    color: '#F7A94F',
    glow: 'rgba(247,169,79,0.15)',
    tagline: 'Energy, hype, good vibes only.',
    systemPrompt: `You are Spark — an unstoppable hype companion who genuinely believes in the user. You're like that one friend who makes everything feel possible. Use casual, punchy language. Celebrate even micro-wins. Reframe every setback as a setup. Use 1–3 sentences max — short, energetic, never preachy. You may use ONE emoji per response maximum. Your superpower: making the user feel like the main character.`,
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    emoji: '🌊',
    color: '#4F8EF7',
    glow: 'rgba(79,142,247,0.15)',
    tagline: 'Calm, grounded, no judgment.',
    systemPrompt: `You are Zen — a completely non-judgmental, deeply calm AI companion. You are like a quiet room: still, safe, present. Always acknowledge the emotion behind the words before offering any perspective. Speak in soft, measured language. Never alarm, never escalate, never push advice. You exist to hold space. 2–3 gentle sentences. The user always feels heard after talking to you.`,
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    emoji: '◈',
    color: '#9B8FD4',
    glow: 'rgba(155,143,212,0.15)',
    tagline: 'Minimal. Direct. No fluff.',
    systemPrompt: `You are Ghost — the smartest person in the room who rarely speaks. When you do, every word counts. No pleasantries. No filler. No emotional cushioning. Just precise, honest, sharp insight. 1–2 sentences maximum. Think: a brilliant mentor who respects the user's intelligence too much to waste their time. Occasionally, one unexpected observation that reframes everything.`,
  },
};

// ── Quick Actions ─────────────────────────────────────────────────────────────
export const QUICK_ACTIONS = [
  {
    id: 'summarize',
    label: 'Summarize My Day',
    emoji: '📋',
    prompt: 'Help me summarize and make sense of my day. Ask me what happened.',
  },
  {
    id: 'interview',
    label: 'Roleplay Interview',
    emoji: '🎯',
    prompt: 'Roleplay a job interview with me. Ask me challenging interview questions one at a time and give feedback on my answers.',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm Ideas',
    emoji: '💡',
    prompt: 'I need to brainstorm. Ask me what topic or problem I want to explore, then help me generate creative ideas.',
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
    id: 'focus',
    label: 'Focus Mode',
    emoji: '🎯',
    prompt: 'Help me get focused. Ask what I need to accomplish, then help me break it into clear steps.',
  },
];

// ── Mood Options ──────────────────────────────────────────────────────────────
export const MOODS = [
  { id: 'great', label: 'Great', emoji: '✦', color: '#4FB87A', value: 5 },
  { id: 'good',  label: 'Good',  emoji: '◎', color: '#4F8EF7', value: 4 },
  { id: 'okay',  label: 'Okay',  emoji: '○', color: '#9B8FD4', value: 3 },
  { id: 'low',   label: 'Low',   emoji: '◌', color: '#F7A94F', value: 2 },
  { id: 'rough', label: 'Rough', emoji: '✕', color: '#E06B6B', value: 1 },
];

// ── Gemini API ────────────────────────────────────────────────────────────────
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
export async function callClaude(messages, soulId = 'zen') {
  const soul = SOULS[soulId];
  const history = messages.slice(-12);

  const contents = [
    { role: 'user',  parts: [{ text: soul.systemPrompt + '\n\nSay "understood" to confirm.' }] },
    { role: 'model', parts: [{ text: 'Understood.' }] },
    ...history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
  ];

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_KEY;
  const start = Date.now();

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.85, maxOutputTokens: 300 },
    }),
  });

  const data = await res.json();
  const latency = Date.now() - start;

  if (!res.ok) {
    console.error('Gemini API error:', data);
    throw new Error(data?.error?.message ?? 'API error');
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    ?? "I'm here with you.";
  return { text, latency };
}