import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Voice layer for Lumaid. Everything that touches text-to-speech lives here,
// so the engine can be swapped later without touching any screen.

const AUTOPLAY_KEY = 'lumaid_voice_autoplay';

export async function getVoiceAutoplay() {
  try { return (await AsyncStorage.getItem(AUTOPLAY_KEY)) === 'true'; }
  catch { return false; }
}

export async function setVoiceAutoplay(value) {
  try { await AsyncStorage.setItem(AUTOPLAY_KEY, value ? 'true' : 'false'); }
  catch (err) { console.warn('[LUMAID] setVoiceAutoplay failed:', err.message); }
}

// Pace and pitch give each persona a feel (1.0 = engine default).
const PERSONA_TUNING = {
  sage:  { rate: 0.92, pitch: 0.95 },
  spark: { rate: 1.08, pitch: 1.08 },
  zen:   { rate: 0.85, pitch: 0.92 },
  cass:  { rate: 1.04, pitch: 1.05 },
};
const DEFAULT_TUNING = { rate: 1.0, pitch: 1.0 };

// Preferred iOS voice names per persona, matched by prefix. Whatever the phone
// has installed wins; if none match, the best English voice is used.
const PERSONA_VOICE_PREFS = {
  sage:  ['Samantha', 'Ava', 'Allison'],
  spark: ['Daniel', 'Aaron', 'Nathan', 'Evan', 'Tom'],
  zen:   ['Karen', 'Serena', 'Tessa'],
  cass:  ['Moira', 'Nicky', 'Zoe', 'Susan', 'Joelle'],
};

let voiceList;            // undefined = not loaded yet
const pickedBySoul = {};  // soulId -> voice | null

function qualityScore(v) {
  const q = String(v.quality || '').toLowerCase();
  const base = q.includes('premium') ? 3 : q.includes('enhanced') ? 2 : 1;
  return base + (v.language === 'en-US' ? 0.5 : 0);
}

async function loadVoices() {
  if (voiceList) return voiceList;
  try {
    const all = await Speech.getAvailableVoicesAsync();
    voiceList = all
      .filter(v => v.language && v.language.startsWith('en') &&
        !/speech\.synthesis|eloquence/i.test(v.identifier || ''))
      .sort((a, b) => qualityScore(b) - qualityScore(a));
    console.log('[LUMAID] voices available (top 8):',
      voiceList.slice(0, 8).map(v => `${v.name}/${v.quality}/${v.language}`).join(' | '));
  } catch (err) {
    console.warn('[LUMAID] voice lookup failed:', err.message);
    voiceList = [];
  }
  return voiceList;
}

async function pickVoice(soulId) {
  const key = soulId || 'default';
  if (key in pickedBySoul) return pickedBySoul[key];
  const list = await loadVoices();
  const prefs = (PERSONA_VOICE_PREFS[soulId] || []).map(p => p.toLowerCase());
  const preferred = list.filter(v =>
    prefs.some(p => String(v.name || '').toLowerCase().startsWith(p)));
  const chosen = preferred[0] ?? list[0] ?? null;
  pickedBySoul[key] = chosen;
  console.log(`[LUMAID] voice for ${key}:`,
    chosen ? `${chosen.name} (${chosen.quality}, ${chosen.language})` : 'engine default');
  return chosen;
}

export async function speak(text, soulId, onFinish) {
  const clean = String(text || '').trim();
  if (!clean) return;
  const t0 = Date.now();
  Speech.stop();
  const voice = await pickVoice(soulId);
  const tuning = PERSONA_TUNING[soulId] ?? DEFAULT_TUNING;
  const myId = ++speakId;
  const done = () => {
    if (myId === speakId) { speaking = false; paused = false; emit(); }
    if (onFinish) onFinish();
  };
  speaking = true; paused = false; emit();
  Speech.speak(clean, {
    language: voice?.language ?? 'en-US',
    ...(voice ? { voice: voice.identifier } : {}),
    rate: tuning.rate,
    pitch: tuning.pitch,
    onStart: () => console.log('[LUMAID] tts start latency ms:', Date.now() - t0),
    onDone: done,
    onStopped: done,
    onError: done,
  });
}

export function stopSpeaking() {
  Speech.stop();
}

// ---- Playback state + pause/resume (pause/resume are iOS-only in expo-speech) ----
let speakId = 0;
let speaking = false;
let paused = false;
const listeners = new Set();
const emit = () => listeners.forEach(fn => fn({ speaking, paused }));

export function subscribeVoiceState(fn) {
  listeners.add(fn);
  fn({ speaking, paused });
  return () => listeners.delete(fn);
}

export function pauseSpeaking() {
  if (Platform.OS !== 'ios' || !speaking) return stopSpeaking();
  Speech.pause();
  paused = true;
  emit();
}

export function resumeSpeaking() {
  if (Platform.OS === 'ios' && paused) {
    Speech.resume();
    paused = false;
    emit();
  }
}

// Load and cache the voice for a persona ahead of time so the first reply starts faster.
export async function prewarmVoice(soulId) {
  try { await pickVoice(soulId); } catch (e) { /* non-fatal */ }
}
