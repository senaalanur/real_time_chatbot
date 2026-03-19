# 🌙 ECHO — The AI That Grows With You

> A production-grade AI companion mobile app built with React Native + Expo. Features persistent memory, 4 AI soul personas, mood journaling, voice I/O, and real-time latency analytics. Available on iOS & Android.

![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=flat&logo=react)
![Expo](https://img.shields.io/badge/Expo-51-000000?style=flat&logo=expo)
![Gemini](https://img.shields.io/badge/Gemini_Pro-API-4285F4?style=flat&logo=google)
![Platforms](https://img.shields.io/badge/Platforms-iOS_%7C_Android-lightgrey?style=flat)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🧠 **Persistent Memory** | Conversation history stored on-device via AsyncStorage across sessions |
| 🎭 **4 Soul Modes** | Sage, Spark, Zen, Ghost — distinct AI personalities with unique prompts & voice cadence |
| 🎙️ **Voice I/O** | expo-speech for TTS with soul-adaptive speaking rate |
| 📊 **Mood Journal** | Daily check-ins, 14-day bar chart, streak tracking, Echo-generated insights |
| ⚡ **Latency Analytics** | Per-message and session-average Gemini API response time displayed in chat |
| 🚀 **App Store Ready** | Expo EAS Build config for iOS & Android deployment |
| 🎨 **Animated Onboarding** | 4-step animated onboarding with soul selection |

---

## 📱 Screens
```
Onboarding (4 steps)
  └─ Welcome → Name → Soul selection → Ready
Home
  ├─ Animated breathing orb (tap to chat)
  ├─ Soul switcher
  ├─ Daily mood check-in
  └─ Quick actions
Chat
  ├─ Multi-turn conversation with memory
  ├─ Typing indicator
  ├─ Per-message latency badge
  └─ TTS with soul-matched voice cadence
Journal
  ├─ 14-day mood bar chart
  ├─ Streak + average stats
  ├─ Entry history
  └─ Echo insight card
```

---

## 🚀 Quick Start

### 1. Clone & install
```bash
git clone https://github.com/senaalanur/real_time_chatbot.git
cd real_time_chatbot
npm install
```

### 2. Set your Gemini API key
Create a `.env` file in the root:
```
EXPO_PUBLIC_GEMINI_KEY=your_gemini_api_key_here
```
Get a free key at [aistudio.google.com](https://aistudio.google.com)

### 3. Run on your phone
```bash
npx expo start
```
Scan the QR code with **Expo Go** on your phone.

---

## 🏗️ Architecture
```
┌────────────────────────────────────┐
│         React Native / Expo        │
│  Onboarding → Home → Chat/Journal  │
└────────────────┬───────────────────┘
                 │
┌────────────────▼───────────────────┐
│           constants.js             │
│  Soul Modes · callGemini() · Theme │
└────────────────┬───────────────────┘
                 │ HTTPS fetch
┌────────────────▼───────────────────┐
│         Gemini Pro API             │
│  Prompt injection with soul system │
│  + full conversation history       │
└────────────────────────────────────┘
         │                  │
┌────────▼──────┐  ┌────────▼──────┐
│  AsyncStorage  │  │  expo-speech  │
│  (on-device)  │  │  (TTS voice)  │
└───────────────┘  └───────────────┘
```

---

## 🎭 Soul Modes

| Soul | Personality | Voice | Use Case |
|---|---|---|---|
| 🌿 **Sage** | Wise, measured, philosophical | Slow & warm | Reflection, big decisions |
| ⚡ **Spark** | Hype, energetic, celebratory | Fast & bright | Motivation, celebrations |
| 🌊 **Zen** | Calm, non-judgmental, grounding | Soft & slow | Stress, anxiety, venting |
| ◈ **Ghost** | Minimal, direct, no fluff | Neutral | Quick answers, focus |

---

## 🔑 Key Engineering Decisions

**Soul-injected prompt engineering**
Each soul mode injects a personality system prompt as the first turn of every Gemini API call. This makes personality swapping instantaneous and works with any LLM.

**On-device persistence**
All conversation history and mood data lives in AsyncStorage — no server, no account required. Privacy-first by design.

**Latency-first UX**
Every API response is timed and displayed as a badge per message, making performance visible and creating a technical feel that differentiates ECHO from consumer chatbots.

**Cross-platform with Expo**
One codebase ships to both iOS and Android. EAS Build handles app signing and store submission.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo |
| Navigation | React Navigation v6 |
| AI | Google Gemini Pro via REST API |
| Storage | AsyncStorage (on-device) |
| Voice | expo-speech (TTS) |
| Fonts | Playfair Display, Lato, Space Mono |
| Build | Expo EAS Build |

---

## 🔮 Roadmap

- [ ] Whisper Mode — private voice journaling with Echo summaries
- [ ] Memory Anchors — Echo proactively follows up on things you mention
- [ ] Multi-model support (Claude, GPT-4o alongside Gemini)
- [ ] Widget for home screen mood check-in
- [ ] Streak achievements and milestones

---

## 👩‍💻 Author

**Sena Alanur** — [GitHub @senaalanur](https://github.com/senaalanur)

---

## 📜 License

MIT
