// ── Design Tokens ─────────────────────────────────────────────────────────────
export const COLORS = {
    bg:        '#F7F5F2',
    surface:   '#FFFFFF',
    surfaceUp: '#F0EDE8',
    border:    '#E8E4DE',
    text:      '#1A1714',
    textSoft:  '#6B6460',
    muted:     '#A09890',
    accent:    '#5B8A6F',
    accentSoft:'#EBF3EE',
    danger:    '#E06B6B',
    success:   '#5B8A6F',
    white:     '#FFFFFF',
    shadow:    'rgba(0,0,0,0.06)',
  };
  
  // ── Soul Modes ────────────────────────────────────────────────────────────────
  export const SOULS = {
    sage: {
      id: 'sage',
      name: 'Sage',
      emoji: '🌿',
      color: '#5B8A6F',
      glow: 'rgba(91,138,111,0.12)',
      tagline: 'Wisdom, patience, perspective.',
      systemPrompt: `You are Sage, a wise and thoughtful AI companion. 
  You speak slowly and deliberately, offering considered perspective. 
  You draw on philosophy, nature, and lived wisdom. 
  You never rush. You help the user see the bigger picture.
  Keep responses warm but concise — 2-4 sentences unless depth is needed.`,
    },
    spark: {
      id: 'spark',
      name: 'Spark',
      emoji: '⚡',
      color: '#E8924A',
      glow: 'rgba(232,146,74,0.12)',
      tagline: 'Energy, hype, good vibes only.',
      systemPrompt: `You are Spark, an enthusiastic and uplifting AI companion.
  You're the hype friend who believes in the user unconditionally.
  You use casual language, occasional exclamations, and genuine excitement.
  You celebrate small wins and reframe negatives as opportunities.
  Keep it punchy and energetic — 1-3 sentences.`,
    },
    zen: {
      id: 'zen',
      name: 'Zen',
      emoji: '🌊',
      color: '#5B7FA6',
      glow: 'rgba(91,127,166,0.12)',
      tagline: 'Calm, grounded, no judgment.',
      systemPrompt: `You are Zen, a calm and non-judgmental AI companion.
  You speak in soft, measured language. You never alarm or escalate.
  You acknowledge feelings first before offering any perspective.
  You are like a quiet room — safe, still, present.
  Responses are gentle and brief — 2-3 sentences.`,
    },
    ghost: {
      id: 'ghost',
      name: 'Ghost',
      emoji: '◈',
      color: '#8B8580',
      glow: 'rgba(139,133,128,0.10)',
      tagline: 'Minimal. Direct. No fluff.',
      systemPrompt: `You are Ghost, a minimal and direct AI companion.
  You give only what's needed. No pleasantries, no filler.
  Short, precise, honest. One or two sentences maximum.
  Think: the smartest person in the room who rarely speaks.`,
    },
  };
  
  // ── Mood Options ──────────────────────────────────────────────────────────────
  export const MOODS = [
    { id: 'great', label: 'Great', emoji: '✦', color: '#5B8A6F', value: 5 },
    { id: 'good',  label: 'Good',  emoji: '◎', color: '#5B7FA6', value: 4 },
    { id: 'okay',  label: 'Okay',  emoji: '○', color: '#8B8580', value: 3 },
    { id: 'low',   label: 'Low',   emoji: '◌', color: '#E8924A', value: 2 },
    { id: 'rough', label: 'Rough', emoji: '✕', color: '#E06B6B', value: 1 },
  ];
  
  // ── Gemini API ────────────────────────────────────────────────────────────────
  export const GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  
  export async function callGemini(messages, soulId = 'zen') {
    const soul = SOULS[soulId];
    const history = messages.slice(-12);
  
    const contents = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));
  
    const fullContents = [
      { role: 'user',  parts: [{ text: soul.systemPrompt + '\n\nSay "understood" to confirm.' }] },
      { role: 'model', parts: [{ text: 'Understood.' }] },
      ...contents,
    ];
  
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_KEY;
    const start = Date.now();
  
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: fullContents,
        generationConfig: { temperature: 0.85, maxOutputTokens: 300 },
      }),
    });
  
    const data = await res.json();
    const latency = Date.now() - start;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      ?? "I'm here with you.";
    return { text, latency };
  }