import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Persona voices ────────────────────────────────────────────────────────────
const PERSONA_MESSAGES = {
  sage: {
    evening: [
      { title: 'Sage is here', body: 'How did today actually feel? Not the surface — the real answer.' },
      { title: 'A moment for you', body: 'The day is winding down. What are you carrying into tonight?' },
      { title: 'Sage is listening', body: 'You don\'t have to have it figured out. Just show up.' },
      { title: 'End your day with intention', body: 'Sage is waiting. Even one honest sentence is enough.' },
    ],
    morning: [
      { title: 'Good morning', body: 'What\'s one thing you\'re hoping today brings? Tell Sage.' },
      { title: 'Start with awareness', body: 'How are you waking up today — really?' },
    ],
    streak_warning: [
      { title: 'Don\'t let today slip away', body: 'Your streak is at stake. Sage is here whenever you\'re ready.' },
      { title: 'One check-in left today', body: 'A few honest words with Sage can change how tonight feels.' },
    ],
  },
  spark: {
    evening: [
      { title: 'Spark here ⚡', body: 'You crushed today (or survived it — both count). Let\'s talk!' },
      { title: 'Hey! Don\'t sleep yet', body: 'Quick check-in with Spark before tomorrow. You\'ve got this.' },
      { title: 'Big question from Spark', body: 'What was the best 5 minutes of today? Tell me!' },
      { title: 'Spark misses you', body: 'Come back and keep that streak ALIVE. You\'re on a roll!' },
    ],
    morning: [
      { title: 'GOOD MORNING', body: 'Spark is fired up for you. What are we conquering today?' },
      { title: 'New day, new energy ⚡', body: 'Check in with Spark and set your intention. Let\'s GO.' },
    ],
    streak_warning: [
      { title: 'Don\'t lose it now!', body: 'Your streak ends tonight if you don\'t check in. Spark believes in you!' },
      { title: 'Last chance today ⚡', body: 'Two minutes with Spark keeps that streak alive. Do it!' },
    ],
  },
  zen: {
    evening: [
      { title: 'Zen is here 🌊', body: 'No pressure. Just a gentle space for you tonight.' },
      { title: 'A quiet moment', body: 'Whenever you\'re ready, Zen is here. No rush.' },
      { title: 'How was today?', body: 'Zen holds space for all of it — the hard and the soft.' },
      { title: 'Come as you are', body: 'You don\'t need to be okay. Zen is here either way.' },
    ],
    morning: [
      { title: 'A gentle good morning', body: 'How are you arriving into today? Zen is listening.' },
      { title: 'Breathe first', body: 'Before the day begins — one moment with Zen.' },
    ],
    streak_warning: [
      { title: 'A soft reminder', body: 'Your streak is ending tonight. Zen is here, without judgment.' },
      { title: 'Still here for you', body: 'Whenever you\'re ready today, Zen will be waiting.' },
    ],
  },
  ghost: {
    evening: [
      { title: 'Ghost', body: 'You know what today was. Say it.' },
      { title: 'Check in', body: 'One sentence. That\'s all. Ghost is listening.' },
      { title: '◈', body: 'The day happened. What do you make of it?' },
      { title: 'Ghost noticed', body: 'You haven\'t checked in. Intentional or avoidance?' },
    ],
    morning: [
      { title: 'Today', body: 'What matters most right now? Ghost is direct. So are you.' },
      { title: 'Morning', body: 'One word: how are you starting today?' },
    ],
    streak_warning: [
      { title: 'Streak ends tonight', body: 'Ghost doesn\'t beg. But you\'ll regret breaking it.' },
      { title: '◈ Last chance', body: 'One check-in. That\'s it. Don\'t overthink it.' },
    ],
  },
  default: {
    evening: [
      { title: '✦ How\'s your day going?', body: 'Lumaid is here to listen. Even 2 minutes helps.' },
      { title: 'Evening check-in time', body: 'Reflect on your day with Lumaid before it ends.' },
      { title: 'Your companion is waiting', body: 'What\'s on your mind tonight?' },
      { title: 'Lumaid is here', body: 'Check in today to keep your streak alive.' },
    ],
    morning: [
      { title: '✦ Good morning', body: 'Start your day with a quick check-in. How are you feeling?' },
      { title: 'New day', body: 'Your Lumaid companion is ready. How are you arriving today?' },
    ],
    streak_warning: [
      { title: '✦ Don\'t break your streak!', body: 'You\'re building a wellness habit. One check-in left today.' },
      { title: 'Streak alert', body: 'Check in before midnight to keep your streak going.' },
    ],
  },
};

const ROUGH_MOOD_OVERRIDES = {
  evening: [
    { title: 'Hey, you okay?', body: 'Yesterday felt heavy. Lumaid is here if you want to talk.' },
    { title: 'No pressure tonight', body: 'You don\'t have to have it together. Come as you are.' },
  ],
};

const SUNDAY_RECAP = [
  { title: '✦ Your weekly recap is ready', body: 'See your mood patterns from this week. It\'s worth a look.' },
  { title: 'Week in review', body: 'Lumaid has your 7-day mood story ready. Open it up.' },
];

const MILESTONE_MESSAGES = {
  3:  { title: '✦ 3-day streak!', body: 'You\'re building something real. Three days of showing up.' },
  7:  { title: '🔥 One week streak!', body: '7 days of self-awareness. That\'s genuinely rare.' },
  14: { title: '✦ 2 weeks strong!', body: 'You\'ve made Lumaid part of your life. That matters.' },
  21: { title: '✦ 21 days!', body: 'They say habits form at 21 days. You\'re there.' },
  30: { title: '🏆 30-day streak!', body: 'One month of showing up for yourself. Incredible.' },
  60: { title: '🏆 60 days!', body: 'Two months of consistent self-awareness. You\'re different now.' },
  100:{ title: '🏆 100 days!', body: '100 days with Lumaid. You\'ve built something that lasts.' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getSoulId() {
  try {
    const raw = await AsyncStorage.getItem('lumaid_user');
    if (!raw) return 'default';
    const user = JSON.parse(raw);
    return user.soul ?? 'default';
  } catch {
    return 'default';
  }
}

async function getLastMoodId() {
  try {
    const raw = await AsyncStorage.getItem('lumaid_mood_history');
    if (!raw) return null;
    const all = JSON.parse(raw);
    if (!all.length) return null;
    return all[all.length - 1].moodId;
  } catch {
    return null;
  }
}

async function getCurrentStreak() {
  try {
    const raw = await AsyncStorage.getItem('lumaid_stats');
    if (!raw) return 0;
    const stats = JSON.parse(raw);
    return stats.streak ?? 0;
  } catch {
    return 0;
  }
}

// ── Register permissions ───────────────────────────────────────────────────────
export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('lumaid', {
      name: 'Lumaid',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#A855F7',
    });
  }

  return finalStatus;
}

// ── Schedule all daily notifications ─────────────────────────────────────────
export async function scheduleDailyReminder(eveningHour = 20, eveningMinute = 0) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const soulId = await getSoulId();
  const lastMoodId = await getLastMoodId();
  const persona = PERSONA_MESSAGES[soulId] ?? PERSONA_MESSAGES.default;

  // Evening check-in — use rough mood override if last mood was bad
  const isRoughMood = lastMoodId === 'rough' || lastMoodId === 'low';
  const eveningPool = isRoughMood ? ROUGH_MOOD_OVERRIDES.evening : persona.evening;
  const eveningMsg = pickRandom(eveningPool);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: eveningMsg.title,
      body: eveningMsg.body,
      sound: true,
      badge: 1,
    },
    trigger: { hour: eveningHour, minute: eveningMinute, repeats: true },
  });

  // Morning nudge at 9am
  const morningMsg = pickRandom(persona.morning);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: morningMsg.title,
      body: morningMsg.body,
      sound: true,
      badge: 1,
    },
    trigger: { hour: 9, minute: 0, repeats: true },
  });

  // Streak warning at 10pm — only if they haven't checked in
  const streakMsg = pickRandom(persona.streak_warning);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: streakMsg.title,
      body: streakMsg.body,
      sound: true,
      badge: 1,
    },
    trigger: { hour: 22, minute: 0, repeats: true },
  });

  // Sunday weekly recap reminder at 6pm
  const recapMsg = pickRandom(SUNDAY_RECAP);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: recapMsg.title,
      body: recapMsg.body,
      sound: true,
      badge: 1,
    },
    trigger: { weekday: 1, hour: 18, minute: 0, repeats: true },
  });
}

// ── Streak milestone (fires immediately) ──────────────────────────────────────
export async function scheduleStreakMilestone(streak) {
  if (!MILESTONE_MESSAGES[streak]) return;
  const msg = MILESTONE_MESSAGES[streak];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      sound: true,
      badge: 1,
    },
    trigger: null,
  });
}

// ── Refresh notifications (call after soul change or mood log) ────────────────
export async function refreshNotifications(eveningHour = 20, eveningMinute = 0) {
  await scheduleDailyReminder(eveningHour, eveningMinute);
}

// ── Cancel all ────────────────────────────────────────────────────────────────
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}