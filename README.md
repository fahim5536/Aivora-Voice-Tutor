# Aivora Voice Tutor 🎙️✨

> ## Next-Generation Multilingual AI Voice Tutor for Interactive Learning
>
> **EurekaDEV 2026 Hackathon Project** — learn by speaking, listening, exploring, and saving the ideas that matter.

<p align="center">
  <img src="aivora-voice-app/public/logo.png" alt="Aivora Voice Tutor logo" width="140" />
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" alt="Next.js 16" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="https://groq.com/"><img src="https://img.shields.io/badge/AI-Groq_API-F55036?logo=lightning&logoColor=white" alt="Groq API" /></a>
  <a href="https://elevenlabs.io/"><img src="https://img.shields.io/badge/Voice-ElevenLabs-111827?logo=elevenlabs&logoColor=white" alt="ElevenLabs" /></a>
  <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white" alt="Vercel" /></a>
  <img src="https://img.shields.io/badge/License-Hackathon_Demo-8B5CF6" alt="Hackathon demo license" />
  <img src="https://img.shields.io/badge/Hackathon-EurekaDEV_2026-F59E0B" alt="EurekaDEV 2026" />
</p>

<p align="center">
  <strong>Talk naturally. Learn actively. Remember what matters.</strong>
</p>

---

## ✦ Project Overview

Studying is often fragmented across search tabs, notes, videos, and static flashcards. **Aivora Voice Tutor** turns that fragmented experience into an interactive, hands-free learning loop:

1. Ask a question with your voice or keyboard.
2. Get a concise, adaptive explanation from an AI tutor.
3. Hear the answer with natural multilingual speech.
4. Save insights, generate revision notes, and quiz yourself before you forget.

### The value proposition

> **Aivora is an always-on study companion for learners who want the speed of conversation, the clarity of a great teacher, and the memory tools of a focused study system — in one polished interface.**

It is especially useful for:

- Language learners practicing in multiple languages.
- Developers asking coding questions while building.
- Students reviewing a conversation hands-free.
- Learners who benefit from active recall and adaptive teaching styles.

---

## 🚀 Feature Highlights

| Feature | What it delivers |
| --- | --- |
| 🎙️ **Live Voice-to-Voice Interaction** | Web Speech API speech-to-text plus ElevenLabs `eleven_multilingual_v2` text-to-speech for natural hands-free tutoring. |
| 🌊 **Real-Time Audio Waveform Visualizer** | Dynamic animated bars provide immediate visual feedback while listening and while Aivora is speaking. |
| 🎭 **AI Tutor Personas & Teaching Styles** | Switch between **Friendly Study Buddy**, **Strict Professor**, and **Socratic Mentor** to change tone and methodology. |
| ⚙️ **Custom API Settings Modal** | Store personal Groq and ElevenLabs credentials plus a preferred voice ID locally in the browser. |
| 📌 **Voice Study Bookmarking** | Save important tutor responses to a persistent Saved Insights library with copy and delete actions. |
| 📝 **Export Transcript & AI Summary** | Download a readable `.txt` transcript or generate AI takeaways and revision flashcards. |
| 🎯 **Interactive Quizzes & Code Highlighting** | Launch guided quizzes and view markdown code blocks with one-click copying. |
| 🌍 **Multilingual Learning** | English, বাংলা, Español, العربية, and हिन्दी speech/language modes are available in the learning controls. |

---

## 🧊 Product Experience

```text
                  ┌───────────────────────────────────────────┐
                  │              AIVORA VOICE TUTOR            │
                  │  Language • Persona • Voice • Saved Notes  │
                  └──────────────────────┬────────────────────┘
                                         │
                ┌────────────────────────┴────────────────────────┐
                │                                                 │
        ┌───────▼────────┐                                ┌───────▼────────┐
        │   ASK / SPEAK   │                                │  STUDY MEMORY   │
        │  Mic + keyboard │                                │ Bookmarks +     │
        │  live transcript│                                │ notes + quizzes │
        └───────┬────────┘                                └────────────────┘
                │
        ┌───────▼────────┐
        │   GROQ LLM      │
        │ persona-aware   │
        │ tutor response  │
        └───────┬────────┘
                │
        ┌───────▼────────┐       ┌──────────────────────────────┐
        │  ELEVENLABS     │──────►│  WAVEFORM + AUDIO OUTPUT     │
        │ multilingual v2 │       │  visual feedback + playback  │
        └────────────────┘       └──────────────────────────────┘
```

### Request flow

```text
Client speech input
      │
      ├── Web Speech API ──► transcript in composer
      │
      └── POST /api/chat ──► Groq ──► tutor text
                                  │
                                  └── POST /api/tts ──► ElevenLabs audio
                                                        │
                                                        └── waveform + playback

Conversation history ──► POST /api/summary ──► takeaways + flashcards
Saved tutor responses ──► localStorage ──► Saved Insights drawer
```

---

## 🧱 Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                       Next.js App Router                        │
├───────────────────────────────┬─────────────────────────────────┤
│ Client UI                      │ Server API Routes               │
│                               │                                 │
│ src/app/page.tsx              │ /api/chat                       │
│ • voice recognition           │ • Groq tutor completion          │
│ • waveform animation          │ • persona-aware system prompt   │
│ • settings + localStorage     │                                 │
│ • saved insights              │ /api/tts                        │
│ • summaries + exports         │ • ElevenLabs audio generation   │
│                               │ • voice ID fallback             │
│                               │                                 │
│                               │ /api/summary                    │
│                               │ • key takeaways                 │
│                               │ • revision flashcards           │
└───────────────────────────────┴─────────────────────────────────┘
```

### Core integrations

- **Groq** powers fast tutor responses and structured study summaries.
- **ElevenLabs** generates multilingual voice responses through `eleven_multilingual_v2`.
- **Web Speech API** provides browser-native speech recognition and browser fallback speech synthesis.
- **Tailwind CSS** provides the responsive visual system, glassmorphism surfaces, gradients, and motion states.
- **localStorage** preserves custom settings and saved insights on the learner’s device.

---

## 🛠️ Local Setup

### Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended
- A Groq API key for tutor responses and summaries
- An ElevenLabs API key for premium voice playback
- A modern browser with Web Speech API support for microphone input

### 1. Install dependencies

```bash
cd aivora-voice-app
npm install
```

### 2. Configure environment variables

Create `aivora-voice-app/.env.local`:

```env
# Required for AI tutor responses and AI study summaries
GROQ_API_KEY=your_groq_api_key

# Required for ElevenLabs voice output
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Optional provider configuration
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
```

The UI Settings modal can override the Groq key, ElevenLabs key, and voice ID for local browser requests. Those values are stored in `localStorage`; do not use this mechanism for shared or production secrets.

### 3. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Windows build note

On Windows environments where native SWC bindings are unavailable, use the Webpack fallback explicitly:

```bash
npm run dev -- --webpack
npx next build --webpack
```

The standard build script is still available:

```bash
npm run build
```

---

## ☁️ Deploy to Vercel

### 1. Import the project

1. Push the repository to GitHub.
2. Open [Vercel New Project](https://vercel.com/new).
3. Import the repository.
4. Set the **Root Directory** to `aivora-voice-app`.
5. Keep the framework preset as **Next.js**.

### 2. Add environment variables

In **Project Settings → Environment Variables**, add:

| Variable | Required | Purpose |
| --- | :---: | --- |
| `GROQ_API_KEY` | ✅ | Groq tutor responses and AI study summaries. |
| `ELEVENLABS_API_KEY` | ✅ | ElevenLabs text-to-speech generation. |
| `ELEVENLABS_VOICE_ID` | ✅ | Default ElevenLabs voice profile. |
| `GROQ_MODEL` | Optional | Override the default Groq model. |
| `GEMINI_API_KEY` | Optional | Gemini fallback provider. |
| `GEMINI_MODEL` | Optional | Override the Gemini fallback model. |

For production, configure the variables for **Production**, and optionally Preview and Development.

### 3. Deploy

Click **Deploy**, then test:

- Microphone permission and live transcription.
- Groq tutor responses.
- ElevenLabs playback and fallback speech.
- AI Study Notes generation.
- Saved Insights persistence.

> **Security note:** Keep production provider keys in Vercel environment variables. Browser-local custom keys are intentionally a convenience feature for personal demos and are not a replacement for server-side secret management.

---

## 🎬 Hackathon Demo Flow

```text
01  Choose a language + teaching style
02  Tap the microphone and ask a real question
03  Watch the live waveform while Aivora thinks and speaks
04  Bookmark the best explanation
05  Generate AI Study Notes and flashcards
06  Copy or export the transcript for later revision
```

### Suggested judge showcase

> Ask: **“Explain Python loops like I am learning them for the first time.”**
>
> Then switch to **Strict Professor**, ask a follow-up coding question, bookmark the response, and generate a study summary. This demonstrates voice interaction, persona adaptation, persistence, and active recall in under two minutes.

---

## 📁 Project Structure

```text
.
├── README.md
└── aivora-voice-app/
    ├── public/
    │   └── logo.png
    ├── src/app/
    │   ├── api/
    │   │   ├── chat/route.ts
    │   │   ├── summary/route.ts
    │   │   └── tts/route.ts
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── .env.local.example
    ├── next.config.ts
    ├── package.json
    └── tsconfig.json
```

---

## 🌟 Why Aivora Stands Out

| Typical AI chat | Aivora Voice Tutor |
| --- | --- |
| Text-only interaction | Voice-first, hands-free learning |
| One generic assistant personality | Three intentional teaching methodologies |
| Answers disappear in a chat stream | Bookmarkable insights and downloadable notes |
| Passive reading | Voice feedback, quizzes, flashcards, and active recall |
| One-size-fits-all output | Language, persona, voice, pace, and local settings |

---

## 📜 License & Credits

Created as a **EurekaDEV 2026 hackathon demo** for the Aivora Voice Tutor experience.

Built with:

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Groq](https://groq.com/)
- [ElevenLabs](https://elevenlabs.io/)
- [Vercel](https://vercel.com/)

<p align="center">
  <br />
  <strong>✨ Speak your questions. Grow your ideas. ✨</strong>
  <br />
  <sub>Aivora Voice Tutor — EurekaDEV 2026</sub>
</p>
