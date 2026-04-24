import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── Configure how notifications appear when app is in foreground ──────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Request permission and get push token ─────────────────────────────────────
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

// ── Schedule daily streak reminder ────────────────────────────────────────────
export async function scheduleDailyReminder(hour = 20, minute = 0) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const messages = [
    { title: "✦ How's your day going?", body: "Lumaid is here to listen. Even 2 minutes helps." },
    { title: "🌙 Evening check-in time", body: "Reflect on your day with Lumaid before it ends." },
    { title: "✦ Don't break your streak!", body: "You're building a wellness habit. Keep it going." },
    { title: "🌊 Take a breath", body: "Your AI companion is waiting. What's on your mind?" },
    { title: "✦ Lumaid misses you", body: "Check in today to keep your streak alive." },
  ];

  const msg = messages[Math.floor(Math.random() * messages.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      sound: true,
      badge: 1,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

// ── Schedule streak milestone notifications ───────────────────────────────────
export async function scheduleStreakMilestone(streak) {
  const milestones = {
    3:  { title: "✦ 3 day streak!", body: "You're building something real. Lumaid is proud of you." },
    7:  { title: "🔥 One week streak!", body: "7 days of self-awareness. That's genuinely rare." },
    14: { title: "✦ 2 weeks strong!", body: "You've made Lumaid part of your life. That matters." },
    30: { title: "🏆 30 day streak!", body: "One month of showing up for yourself. Incredible." },
  };

  if (milestones[streak]) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: milestones[streak].title,
        body: milestones[streak].body,
        sound: true,
        badge: 1,
      },
      trigger: null, // immediate
    });
  }
}

// ── Cancel all scheduled notifications ───────────────────────────────────────
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}