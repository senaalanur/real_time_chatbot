# 🌙 Lumaid — Your AI Companion

> A production-grade AI companion mobile app built with React Native + Expo. Features 4 distinct AI soul personas, mood journaling, voice I/O, quick action prompts, and real-time latency analytics. Available on iOS & Android.

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat&logo=react)
![Expo](https://img.shields.io/badge/Expo-54-000000?style=flat&logo=expo)
![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-API-4285F4?style=flat&logo=google)
![Platforms](https://img.shields.io/badge/Platforms-iOS_%7C_Android-lightgrey?style=flat)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎭 **4 Soul Modes** | Sage, Spark, Zen, Ghost — distinct AI personalities with unique system prompts & voice cadence |
| ⚡ **Quick Actions** | 6 pre-built conversation starters: Summarize My Day, Roleplay Interview, Brainstorm Ideas, Vent, Evening Reflection, Focus Mode |
| 🎙️ **Voice I/O** | expo-speech TTS with soul-adaptive speaking rate and pitch |
| 📊 **Mood Journal** | Daily check-ins, 14-day bar chart, streak tracking, Lumaid-generated insights |
| 🔄 **Fresh Sessions** | Every conversation starts clean — no stale context, full privacy |
| ⚡ **Latency Analytics** | Per-message and session-average API response time displayed in chat |
| 🎨 **Dark Glassmorphism UI** | Electric blue accents, animated breathing orb, smooth transitions |
| 🚀 **App Store Ready** | Expo EAS Build config for iOS & Android deployment |

---

## 📱 Screens

```
Onboarding (4 steps)
  └─ Welcome → Name → Soul selection → Ready

Home
  ├─ Animated breathing orb (tap to chat)
  ├─ Soul switcher
  ├─ Quick Actions grid
  ├─ Daily mood check-in
  └─ Mood Journal shortcut

Chat
  ├─ Fresh session on every open
  ├─ Typing indicator with bounce animation
  ├─ Quick Actions panel (⚡ button)
  ├─ Per-message latency badge
  └─ TTS with soul-matched voice cadence

Journal
  ├─ 14-day mood bar chart
  ├─ Streak + average stats
  ├─ Entry history
  └─ Lumaid insight card
```

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
│  Soul Modes · callClaude() · Theme │
│  Quick Actions · Mood Options      │
└────────────────┬───────────────────┘
                 │ HTTPS fetch
┌────────────────▼───────────────────┐
│         Gemini 2.0 Flash API       │
│  Soul system prompt injection      │
│  + conversation history (last 12)  │
└────────────────────────────────────┘
         │                  │
┌────────▼──────┐  ┌────────▼──────┐
│  AsyncStorage  │  │  expo-speech  │
│  (on-device)  │  │  (TTS voice)  │
└───────────────┘  └───────────────┘
```

---

## 🎭 Soul Modes

| Soul | Personality | Voice | Best For |
|---|---|---|---|
| 🌿 **Sage** | Wise, philosophical, Socratic | Slow & warm | Reflection, big decisions |
| ⚡ **Spark** | Hype, energetic, celebratory | Fast & bright | Motivation, celebrations |
| 🌊 **Zen** | Calm, non-judgmental, grounding | Soft & slow | Stress, anxiety, venting |
| ◈ **Ghost** | Minimal, direct, no fluff | Neutral | Quick answers, focus |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | React Navigation v7 |
| AI | Google Gemini 2.0 Flash via REST API |
| Storage | AsyncStorage (on-device, private) |
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

### 2. Set your Gemini API key
Create a `.env` file in the root:
```
EXPO_PUBLIC_GEMINI_KEY=your_gemini_api_key_here
```
Get a free key at [aistudio.google.com](https://aistudio.google.com)

### 3. Run on your phone
```bash
npx expo start --clear
```
Scan the QR code with **Expo Go** on your phone.

---

## 🔮 Roadmap

- [ ] Whisper Mode — private voice journaling with Lumaid summaries
- [ ] Memory Anchors — Lumaid proactively follows up on things you mention
- [ ] Multi-model support (Claude, GPT-4o alongside Gemini)
- [ ] Home screen widget for mood check-in
- [ ] Streak achievements and milestones

---

## 👩‍💻 Author

**Sena Alanur** — [GitHub @senaalanur](https://github.com/senaalanur)

---

## 📜 License

MIT
