# Lumaid

An AI wellness companion for iOS, built with React Native and Expo. Users talk with one of four companions, check in with their mood each day, and get a weekly reflection on how their week went.

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat&logo=react)
![Expo](https://img.shields.io/badge/Expo-54-000000?style=flat&logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-Auth_and_DB-3ECF8E?style=flat&logo=supabase)

## Features

- **Four companions.** Sage, Spark, Zen, and Cass each have their own voice and approach, from reflective and grounding to upbeat and blunt.
- **Persistent memory.** A short summary of what matters to the user carries across conversations and companion switches.
- **Daily mood check-ins.** Five-point mood logging with streaks and a 14-day journal view.
- **Weekly recap (Pro).** A written reflection on the week, a note from the companion the user talks to most, one suggestion for the week ahead, and a shareable summary card. Free users see their weekly overview and a locked preview.
- **Voice replies (Pro).** On-device text-to-speech with a distinct voice, pace, and pitch per companion, optional autoplay, and play, pause, and stop controls. Pause and resume are iOS only.
- **Notifications.** Companion-specific daily reminders, streak reminders, and a Sunday recap reminder.
- **Wellness tools.** Guided starting points for daily check-ins, venting, evening reflection, anxiety relief, focus, and gratitude.
- **Subscriptions.** Pro tier managed with RevenueCat. Free accounts have a daily message limit.
- **Accounts.** Email and password sign-up with email verification and password reset.

## Architecture

```
React Native / Expo app
  |-- Supabase: auth, conversations, memory, usage
  |-- AsyncStorage: mood history, local chat history
  |-- RevenueCat: subscription status
  '-- Backend (Express on Railway)
        |-- Groq API: chat, memory summaries, weekly recap
        |-- Resend: transactional email
        '-- Supabase admin API: email verification, password reset
```

The app never holds an LLM or email key. All model and email calls go through the backend.

Mood entries are stored on the device only. When a weekly recap is requested, the last seven days of mood entries are sent with the request and are not stored by the server.

## Tech stack

| Area | Technology |
|---|---|
| App | React Native, Expo (SDK 54), React Navigation |
| Auth and data | Supabase |
| Subscriptions | RevenueCat |
| Voice | expo-speech |
| Backend | Node.js, Express, hosted on Railway |
| Language model | Groq (openai/gpt-oss-120b) |
| Email | Resend |

## Companions

| Companion | Style | Good for |
|---|---|---|
| Sage | Warm, grounded, reflective | Big decisions, reflection |
| Spark | Upbeat and encouraging | Motivation, confidence |
| Zen | Calm and unhurried | Stress, anxiety, venting |
| Cass | Unbothered and candid | Honest feedback without the drama |

## Project structure

```
App.js                 Navigation, session handling, app startup
constants.js           Theme colors, moods, companions, quick actions
screens/               Auth, onboarding, home, chat, journal, weekly recap, profile, paywall
components/            Shared UI components (weekly recap card)
lib/                   Supabase client, purchases, voice, recap, notifications
supabase/functions/    Edge functions (send-email, delete-user, check-email-verified)
lumaid-legal/          Separate project for the app's legal pages
```

## Getting started

Requirements: Node.js, npm, and Xcode for iOS builds.

```
npm install
npx expo start -c
```

The `-c` flag clears the cache, which matters after changing environment variables.

## Configuration

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

`EXPO_PUBLIC_SUPABASE_ANON_KEY` takes the Supabase **publishable** key (`sb_publishable_...`). Never put a secret key in the app: everything prefixed `EXPO_PUBLIC_` is bundled into the app binary.

The backend base URL is defined in the source (search for `BACKEND_URL`). Backend setup is documented in the [backend repository](https://github.com/senaalanur/lumaid-backend).

## Security notes

- Only the publishable Supabase key ships in the app.
- Row Level Security should be enabled on every table the app reads.
- API keys for Groq, Resend, and Supabase live only in the backend's environment variables.
- `.env` files are git-ignored.

## Roadmap

- Require a signed-in session on the chat and memory endpoints.
- Verify Pro entitlement on the server for recap requests.
- Weekly recap caching to reduce repeat model calls.
- Pause and resume for voice playback on Android.
