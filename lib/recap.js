import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const BACKEND_URL = 'https://lumaid-backend-production-bee3.up.railway.app';

// Moods live on the phone, so the last 7 days are sent along with the login token.
export async function fetchWeeklyRecap() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return { error: 'signin' };

  let moods = [];
  try {
    const raw = await AsyncStorage.getItem('lumaid_mood_history');
    const all = raw ? JSON.parse(raw) : [];
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    moods = all
      .filter(e => e && e.timestamp >= cutoff)
      .map(e => ({ moodId: e.moodId, date: e.date }));
  } catch {}

  try {
    const res = await fetch(`${BACKEND_URL}/recap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ moods }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) return { error: 'signin' };
    if (res.status === 429) return { error: 'limit' };
    if (!res.ok) return { error: 'failed' };
    return json;
  } catch {
    return { error: 'network' };
  }
}
