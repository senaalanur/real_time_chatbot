# 🌙 Lumaid — AI Wellness Companion

> A production-grade AI wellness app built with React Native + Expo. Talk to your AI companion about real life — stress, anxiety, focus, reflection. Create custom AI characters with unique personalities, track your mood, and get weekly AI-generated insights. Available on iOS & Android.

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat&logo=react)
![Expo](https://img.shields.io/badge/Expo-54-000000?style=flat&logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-Auth_+_DB-3ECF8E?style=flat&logo=supabase)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat)
![Platforms](https://img.shields.io/badge/Platforms-iOS_%7C_Android-lightgrey?style=flat)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Authentication** | Supabase email/password auth with confirm password validation |
| 🎭 **4 Wellness Personas** | Sage, Spark, Zen, Ghost — distinct AI companions with unique system prompts |
| ✦ **Custom Character Builder** | Create up to 3 AI companions with custom name, color, and 3 personality sliders |
| 🧠 **Persistent Memory** | Each character remembers your past conversations via Supabase |
| 🌿 **Wellness Tools** | Daily check-in, vent session, evening reflection, anxiety support, gratitude practice, focus mode |
| 📊 **Weekly Recap** | AI-generated mood summary, bar chart, personal reflection, shareable card |
| 🔥 **Streak System** | Daily check-in streaks displayed on home screen |
| 🎙️ **Voice Output** | expo-speech TTS — tap any message to hear it read aloud |
| 📈 **Mood Journal** | Daily check-ins, 14-day bar chart, streak tracking, AI insights |
| 🧠 **Empathetic AI** | Short reflective responses with thinking delay — feels like real listening |
| 🔒 **Secure Backend** | Node.js/Express proxy — Groq API key never exposed to client |
| ⚡ **Rate Limiting** | 20 messages/hour per IP — protects API costs |
| 🎨 **Dark Glassmorphism UI** | Deep navy/black base, frosted glass cards, character accent colors |
| 🚀 **Production Ready** | pm2 process manager, Supabase auth + DB, EAS Build config |

---

## 📱 Screens

**Auth** — Sign in / Sign up with email and password

**Onboarding** — Welcome → Name → Soul selection → Ready

**Home** — Animated breathing orb, soul switcher, wellness tools, mood check-in, streak badge, characters shortcut, weekly recap shortcut

**Characters** — List, create, edit, delete custom AI companions (max 3)

**Character Builder** — Name, accent color picker, warmth/directness/energy sliders with live personality preview

**Chat** — Empathetic short responses with thinking delay, typing indicator, wellness tools panel, persistent memory for custom characters, TTS voice output, retry on error

**Mood Journal** — 14-day mood bar chart, streak + average stats, entry history, AI insight card

**Weekly Recap** — 7-day mood arc, AI-generated personal reflection, mood breakdown, shareable summary

---

## 🏗️ Architecture

```
React Native / Expo
Auth → Onboarding → Home → Chat / Characters / Journal / Recap
        │
        ▼
Node.js / Express Backend
Rate limiting · Groq API proxy
API key never leaves server
        │
        ▼
Groq API — LLaMA 3.3 70B
Soul/character system prompt + conversation history
        │
        ├──────────────────────┐
        ▼                      ▼
Supabase                  AsyncStorage
Auth + Characters         Mood history
Conversations (memory)    Stats + streak
```

---

## 🎭 Wellness Personas

| Persona | Personality | Best For |
|---|---|---|
| 🌿 **Sage** | Wise, philosophical, Socratic | Reflection, big decisions |
| ⚡ **Spark** | Hype, energetic, celebratory | Motivation, confidence |
| 🌊 **Zen** | Calm, non-judgmental, grounding | Stress, anxiety, venting |
| ◈ **Ghost** | Minimal, direct, no fluff | Quick clarity, focus |

---

## ✦ Custom Characters

Users can create up to 3 fully custom AI companions:

- **Name** — anything you want
- **Accent color** — 9 color options
- **Warmth** — cool & professional → warm & caring
- **Directness** — gentle & soft → blunt & honest
- **Energy** — calm & quiet → high energy & enthusiastic

Each character has persistent memory — they remember your past conversations.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | React Navigation v7 |
| Auth | Supabase (email/password) |
| Database | Supabase (characters + conversations) |
| AI | Groq API — LLaMA 3.3 70B |
| Backend | Node.js + Express (API proxy) |
| Process Manager | pm2 |
| Storage | AsyncStorage (mood + stats) |
| Voice | expo-speech (TTS) |
| Haptics | expo-haptics |
| Fonts | Playfair Display, Lato, Space Mono |
| Build | Expo EAS Build |

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone https://github.com/senaalanur/real_time_chatbot.git
cd real_time_chatbot
npm install
```

### 2. Set up environment variables

Create a `.env` file in the root:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up the backend

```bash
cd ../lumaid-backend
npm install
```

Create a `.env` file in `lumaid-backend/`:

```
GROQ_KEY=your_groq_api_key
```

Start the backend:

```bash
node server.js
```

### 4. Update your IP in constants.js

```javascript
const BACKEND_URL = __DEV__
  ? 'http://YOUR_LOCAL_IP:3001'
  : 'https://your-production-backend.com';
```

### 5. Run on your phone

```bash
npx expo start
```

Scan the QR code with your iPhone camera.

---

## 🗄️ Supabase Setup

Run these SQL statements in your Supabase SQL editor:

```sql
create table characters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null,
  warmth integer default 5,
  directness integer default 5,
  energy integer default 5,
  created_at timestamp with time zone default now()
);

alter table characters enable row level security;
create policy "Users can manage their own characters"
  on characters for all using (auth.uid() = user_id);

create table conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  character_id uuid references characters(id) on delete cascade,
  soul_id text,
  role text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table conversations enable row level security;
create policy "Users can manage their own conversations"
  on conversations for all using (auth.uid() = user_id);
```

---

## 🔮 Roadmap

- [ ] Voice input — speak instead of type (Whisper API)
- [ ] Mood history timeline — calendar view of past moods
- [ ] Export weekly recap as image for Instagram/TikTok
- [ ] RevenueCat monetization — freemium + subscription
- [ ] App Store & Google Play launch
- [ ] Backend deployment to production server

---

## 👩‍💻 Author

**Sena Alanur** — [GitHub @senaalanur](https://github.com/senaalanur)

---

## 📜 License

MIT
