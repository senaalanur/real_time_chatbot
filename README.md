# 🌙 Lumaid — AI Wellness Companion

> A production-grade AI wellness app built with React Native + Expo. Talk to your AI companion about real life — stress, anxiety, focus, reflection. Features 4 distinct AI personas, mood journaling, voice output, daily wellness tools, and Supabase authentication. Available on iOS & Android.

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat&logo=react)
![Expo](https://img.shields.io/badge/Expo-54-000000?style=flat&logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat&logo=supabase)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3-F55036?style=flat)
![Platforms](https://img.shields.io/badge/Platforms-iOS_%7C_Android-lightgrey?style=flat)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Authentication** | Supabase email/password auth with confirm password validation |
| 🎭 **4 Wellness Personas** | Sage, Spark, Zen, Ghost — distinct AI companions with unique system prompts |
| 🌿 **Wellness Tools** | Daily check-in, vent session, evening reflection, anxiety support, gratitude practice, focus mode |
| 🎙️ **Voice Output** | expo-speech TTS with soul-adaptive speaking rate — tap to listen |
| 📊 **Mood Journal** | Daily check-ins, 14-day bar chart, streak tracking, AI-generated insights |
| 🧠 **Empathetic AI** | Short, reflective responses with thinking delay — feels like real listening |
| 🔒 **Secure Backend** | Node.js/Express proxy server — API keys never exposed to client |
| ⚡ **Rate Limiting** | 20 messages/hour per IP — protects API costs |
| 🎨 **Dark Glassmorphism UI** | Deep navy/black base, frosted glass cards, colored character accents |
| 🚀 **Production Ready** | pm2 process manager, Supabase auth, EAS Build config |

---

## 📱 Screens
Auth
└─ Sign in / Sign up (email + password)
Onboarding (4 steps)
└─ Welcome → Name → Soul selection → Ready
Home
├─ Animated breathing orb (tap to chat)
├─ Soul switcher
├─ Wellness Tools grid
├─ Daily mood check-in
└─ Mood Journal shortcut
Chat
├─ Empathetic short responses with thinking delay
├─ Typing indicator animation
├─ Wellness Tools panel
├─ Character accent color on bot bubbles
└─ TTS voice output (tap to activate)
Journal
├─ 14-day mood bar chart
├─ Streak + average stats
├─ Entry history
└─ Lumaid insight card

---

## 🏗️ Architecture
┌────────────────────────────────────┐
│         React Native / Expo        │
│  Auth → Onboarding → Home → Chat   │
└────────────────┬───────────────────┘
│ HTTPS fetch
┌────────────────▼───────────────────┐
│       Node.js / Express Backend    │
│   Rate limiting · API proxy        │
│   Groq key never leaves server     │
└────────────────┬───────────────────┘
│
┌────────────────▼───────────────────┐
│         Groq API (LLaMA 3.3)       │
│  Soul system prompt injection      │
│  + conversation history (last 12)  │
└────────────────────────────────────┘
│                  │
┌────────▼──────┐  ┌────────▼──────┐
│   Supabase    │  │  AsyncStorage  │
│   (Auth +     │  │  (mood/stats) │
│   user data)  │  └───────────────┘
└───────────────┘

---

## 🎭 Wellness Personas

| Persona | Personality | Best For |
|---|---|---|
| 🌿 **Sage** | Wise, philosophical, Socratic | Reflection, big decisions |
| ⚡ **Spark** | Hype, energetic, celebratory | Motivation, confidence |
| 🌊 **Zen** | Calm, non-judgmental, grounding | Stress, anxiety, venting |
| ◈ **Ghost** | Minimal, direct, no fluff | Quick clarity, focus |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | React Navigation v7 |
| Auth | Supabase (email/password) |
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
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

### 3. Set up the backend
```bash
cd ../lumaid-backend
npm install
```

Create a `.env` file in `lumaid-backend/`:
GROQ_KEY=your_groq_api_key

Start the backend:
```bash
node server.js
# or with pm2:
pm2 start server.js --name lumaid-backend
```

### 4. Update your IP in constants.js
In `constants.js`, set your local IP:
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

## 🔮 Roadmap

- [ ] Custom Character Builder — create your own AI companion with name, avatar, and personality sliders
- [ ] Persistent memory per character — remembers past conversations
- [ ] Weekly life recap card — shareable mood summary with AI reflection
- [ ] Voice input — speak instead of type (Whisper API)
- [ ] Mood history timeline — calendar view of past moods
- [ ] Streak achievements and milestones
- [ ] Export weekly recap as image for Instagram/TikTok

---

## 👩‍💻 Author

**Sena Alanur** — [GitHub @senaalanur](https://github.com/senaalanur)

---

## 📜 License

MIT