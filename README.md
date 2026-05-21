# 🌙 Lumaid — AI Wellness Companion

> A production-grade AI wellness app built with React Native + Expo. Talk to your AI companion about real life — stress, anxiety, focus, reflection. Track your mood daily, build streaks, and grow with a companion that actually listens.

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat&logo=react)
![Expo](https://img.shields.io/badge/Expo-54-000000?style=flat&logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-Auth_+_DB-3ECF8E?style=flat&logo=supabase)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat)
![Platforms](https://img.shields.io/badge/Platforms-iOS_%7C_Android-lightgrey?style=flat)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## ✨ MVP Features

| Feature | Details |
|---|---|
| 🔐 **Authentication** | Supabase email/password auth |
| 🎭 **4 Wellness Personas** | Sage, Spark, Zen, Cass — distinct AI companions with unique personalities |
| 🌿 **Mood Check-in** | Daily emoji-based mood tracking with streak system |
| 🧠 **Persistent Memory** | AI remembers context across sessions and soul switches |
| 🔥 **Streak System** | Daily check-in streaks with milestone notifications |
| 🔔 **Smart Notifications** | Persona-specific daily reminders + streak warnings |
| 🌿 **Wellness Tools** | Daily check-in, vent session, evening reflection, anxiety support, gratitude practice, focus mode |
| 🎙️ **Voice Output** | expo-speech TTS — tap any message to hear it read aloud |
| 📈 **Mood Journal** | Daily check-ins, 14-day bar chart, streak tracking |
| 🔒 **Secure Backend** | Node.js/Express proxy — Groq API key never exposed to client |
| ⚡ **Rate Limiting** | 20 messages/hour per IP — protects API costs |
| 🎨 **Dark Glassmorphism UI** | Deep navy/black base, frosted glass cards, persona accent colors |
| ✉️ **Founder Newsletter** | Opt-in at onboarding — personal notes from the Lumaid team |

---

## 📱 Screens

**Auth** — Sign in / Sign up with email and password

**Onboarding** — Welcome → Name → Soul selection → Ready (with newsletter opt-in)

**Home** — Animated breathing orb, soul switcher, wellness tools, mood check-in, streak badge

**Chat** — Empathetic short responses with thinking delay, typing indicator, wellness tools panel, persistent memory, TTS voice output

**Mood Journal** — 14-day mood bar chart, streak + average stats, entry history

**Profile** — Stats, companion info, settings, sign out

---

## 🏗️ Architecture
React Native / Expo
Auth → Onboarding → Home → Chat / Journal / Profile
│
▼
Node.js / Express Backend (Railway)
Rate limiting · Groq API proxy · Memory summarization
API key never leaves server
│
▼
Groq API — LLaMA 3.3 70B
Soul system prompt + conversation history + persistent memory
│
├──────────────────────┐
▼                      ▼
Supabase                  AsyncStorage
Auth + Memory             Chat history per soul
Email subscribers         Mood history + streak

---

## 🎭 Wellness Personas

| Persona | Personality | Best For |
|---|---|---|
| 🌿 **Sage** | Wise, warm, therapeutic | Reflection, big decisions |
| ⚡ **Spark** | Hype, energetic, celebratory | Motivation, confidence |
| 🌊 **Zen** | Calm, non-judgmental, grounding | Stress, anxiety, venting |
| ✦ **Cass** | Unbothered nepo baby, careless but always right | When you need brutal honesty with zero drama |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | React Navigation v7 |
| Auth | Supabase (email/password) |
| Database | Supabase (memory + email subscribers) |
| AI | Groq API — LLaMA 3.3 70B |
| Backend | Node.js + Express (Railway) |
| Storage | AsyncStorage (mood, stats, chat history) |
| Voice | expo-speech (TTS) |
| Notifications | expo-notifications |
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
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

### 3. Backend

Backend is deployed on Railway at `https://lumaid-backend-production.up.railway.app`.

To run locally:

```bash
cd ../lumaid-backend
npm install
```

Create a `.env` file in `lumaid-backend/`:
GROQ_KEY=your_groq_api_key
PORT=3001

```bash
node server.js
```

### 4. Run on your phone

```bash
npx expo start
```

Scan the QR code with your iPhone camera (Expo Go).

---

## 🗄️ Supabase Setup

```sql
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

create table user_memory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  memory_summary text,
  last_updated timestamp with time zone default now()
);

alter table user_memory enable row level security;
create policy "Users can manage their own memory"
  on user_memory for all using (auth.uid() = user_id);

create table email_subscribers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  subscribed boolean default true,
  subscribed_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table email_subscribers enable row level security;
create policy "Users can view own subscription"
  on email_subscribers for select using (auth.uid() = user_id);
create policy "Users can insert own subscription"
  on email_subscribers for insert with check (auth.uid() = user_id);
create policy "Users can update own subscription"
  on email_subscribers for update using (auth.uid() = user_id);
```

---

## 🔮 Roadmap (V2)

- [ ] Custom persona builder — create your own AI companion with personality sliders
- [ ] Weekly recap cards — shareable mood summary with AI insights
- [ ] Voice input — speak instead of type (Whisper API)
- [ ] Smart notifications — personalized messages based on mood patterns
- [ ] Streak system enhancements — milestones, rewards
- [ ] Export weekly recap as image for Instagram/TikTok
- [ ] Freemium monetization — Free / Pro / Max tiers
- [ ] App Store & Google Play launch

---

## 👩‍💻 Built by

**Sena Alanur** — [GitHub @senaalanur](https://github.com/senaalanur)

---

## 📜 License

MIT