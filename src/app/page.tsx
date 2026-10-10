"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Bookmark,
  BrainCircuit,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  Eraser,
  FileText,
  Globe2,
  Headphones,
  Mic,
  MicOff,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

const languages = [
  { code: "en", label: "English", speech: "en-US" },
  { code: "bn", label: "বাংলা", speech: "bn-BD" },
  { code: "es", label: "Español", speech: "es-ES" },
  { code: "ar", label: "العربية", speech: "ar-SA" },
  { code: "hi", label: "हिन्दी", speech: "hi-IN" },
] as const;

const voiceStyles = [
  { id: "clear", label: "Clear mentor", hint: "Balanced & focused", pitch: 1 },
  { id: "warm", label: "Warm companion", hint: "Friendly & encouraging", pitch: 1.08 },
  { id: "energetic", label: "Energetic coach", hint: "Bright & motivating", pitch: 1.18 },
] as const;

const voiceProfiles = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Multilingual clarity" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Warm, natural delivery" },
] as const;

const tutorPersonas = [
  { id: "friendly", label: "Friendly Study Buddy", description: "Warm, simple, and encouraging" },
  { id: "strict", label: "Strict Professor", description: "Formal, precise, and academic" },
  { id: "socratic", label: "Socratic Mentor", description: "Thought-provoking and inquiry-led" },
] as const;

type LanguageCode = (typeof languages)[number]["code"];
type VoiceStyleId = (typeof voiceStyles)[number]["id"];
type VoiceProfileId = (typeof voiceProfiles)[number]["id"];
type TutorPersonaId = (typeof tutorPersonas)[number]["id"];
type Activity = "idle" | "listening" | "processing" | "speaking";
type ConversationMessage = { id: number; role: "user" | "assistant"; text: string };
type SavedInsight = { id: number; text: string; savedAt: string };
type UserSettings = { groqApiKey: string; elevenLabsApiKey: string; elevenLabsVoiceId: string };
type StudySummary = { takeaways: string[]; flashcards: Array<{ question: string; answer: string }> };

const SETTINGS_STORAGE_KEY = "aivora-voice-tutor-settings";
const SAVED_INSIGHTS_STORAGE_KEY = "aivora-voice-tutor-saved-insights";
const VOICE_ENABLED_STORAGE_KEY = "aivora-voice-tutor-voice-enabled";
const emptySettings: UserSettings = { groqApiKey: "", elevenLabsApiKey: "", elevenLabsVoiceId: "" };

const quickPrompts = [
  "Explain Python loops",
  "Teach me Spanish basics",
  "Help me debug React useEffect",
  "Quantum physics simplified",
];

interface SpeechRecognitionEventLike {
  results: { [index: number]: { [index: number]: { transcript: string; isFinal: boolean } } };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function renderMarkdown(text: string, onCopyCode: (code: string) => void, copiedCode: string | null) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-bold tracking-tight text-white first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-bold text-white first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold text-cyan-100">{children}</h3>,
        p: ({ children }) => <p className="mb-3 leading-7 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200">{children}</a>,
        blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-violet-300/50 pl-4 italic text-slate-400">{children}</blockquote>,
        table: ({ children }) => <div className="my-4 overflow-x-auto rounded-xl border border-white/10"><table className="min-w-full border-collapse text-left text-xs">{children}</table></div>,
        thead: ({ children }) => <thead className="bg-white/[0.08] text-cyan-100">{children}</thead>,
        th: ({ children }) => <th className="border-b border-white/10 px-3 py-2 font-semibold">{children}</th>,
        td: ({ children }) => <td className="border-b border-white/[0.06] px-3 py-2 align-top text-slate-300">{children}</td>,
        code: ({ className, children }) => {
          const code = String(children).replace(/\n$/, "");
          const isBlock = Boolean(className);
          if (!isBlock) return <code className="rounded bg-violet-300/10 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-200">{children}</code>;
          return (
            <div className="my-3 overflow-hidden rounded-xl border border-cyan-300/15 bg-[#090e1a]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300/70">{className?.replace("language-", "") || "Code snippet"}</span>
                <button type="button" onClick={() => onCopyCode(code)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white">
                  {copiedCode === code ? <Check size={13} /> : <Clipboard size={13} />}
                  {copiedCode === code ? "Copied" : "Copy code"}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-cyan-50"><code>{code}</code></pre>
            </div>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function splitSpeechText(text: string) {
  const cleanText = text.replace(/```[\w-]*\n?/g, "").replace(/[`*_>#]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
  return cleanText.match(/[^.!?;:]+[.!?;:]?(?:\s+|$)/g)?.map((part) => part.trim()).reduce<string[]>((chunks, sentence) => {
    const previous = chunks[chunks.length - 1];
    if (previous && `${previous} ${sentence}`.length <= 220) chunks[chunks.length - 1] = `${previous} ${sentence}`;
    else chunks.push(sentence);
    return chunks;
  }, []) ?? [cleanText];
}

export default function Home() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyleId>("clear");
  const [voiceProfileId, setVoiceProfileId] = useState<VoiceProfileId>(voiceProfiles[0].id);
  const [persona, setPersona] = useState<TutorPersonaId>("friendly");
  const [speed, setSpeed] = useState(0.88);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [activity, setActivity] = useState<Activity>("idle");
  const [transcript, setTranscript] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [error, setError] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(emptySettings);
  const [settingsDraft, setSettingsDraft] = useState<UserSettings>(emptySettings);
  const [settingsNotice, setSettingsNotice] = useState("");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [savedInsightsOpen, setSavedInsightsOpen] = useState(false);
  const [savedInsightsHydrated, setSavedInsightsHydrated] = useState(false);
  const [waveform, setWaveform] = useState([34, 52, 72, 45, 84, 58, 38, 66, 48, 76, 42]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recognitionTextRef = useRef("");
  const voiceEnabledRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const messageIdRef = useRef(0);
  const selectedLanguage = languages.find((item) => item.code === language) ?? languages[0];
  const selectedVoice = voiceStyles.find((item) => item.id === voiceStyle) ?? voiceStyles[0];
  const selectedVoiceProfile = voiceProfiles.find((item) => item.id === voiceProfileId) ?? voiceProfiles[0];

  useEffect(() => {
    const loadSettings = window.setTimeout(() => {
      const storedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!storedSettings) return;
      try {
        const parsed = JSON.parse(storedSettings) as Partial<UserSettings>;
        const savedSettings = {
          groqApiKey: typeof parsed.groqApiKey === "string" ? parsed.groqApiKey : "",
          elevenLabsApiKey: typeof parsed.elevenLabsApiKey === "string" ? parsed.elevenLabsApiKey : "",
          elevenLabsVoiceId: typeof parsed.elevenLabsVoiceId === "string" ? parsed.elevenLabsVoiceId : "",
        };
        setSettings(savedSettings);
        setSettingsDraft(savedSettings);
        if (savedSettings.elevenLabsVoiceId && voiceProfiles.some((profile) => profile.id === savedSettings.elevenLabsVoiceId)) {
          setVoiceProfileId(savedSettings.elevenLabsVoiceId as VoiceProfileId);
        }
      } catch {
        window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
      }
    }, 0);
    return () => window.clearTimeout(loadSettings);
  }, []);

  useEffect(() => {
    const loadVoicePreference = window.setTimeout(() => {
      const storedPreference = window.localStorage.getItem(VOICE_ENABLED_STORAGE_KEY);
      if (storedPreference !== null) setIsVoiceEnabled(storedPreference !== "false");
    }, 0);
    return () => window.clearTimeout(loadVoicePreference);
  }, []);

  useEffect(() => {
    voiceEnabledRef.current = isVoiceEnabled;
    window.localStorage.setItem(VOICE_ENABLED_STORAGE_KEY, String(isVoiceEnabled));
  }, [isVoiceEnabled]);

  useEffect(() => {
    const loadSavedInsights = window.setTimeout(() => {
      const storedInsights = window.localStorage.getItem(SAVED_INSIGHTS_STORAGE_KEY);
      if (storedInsights) {
        try {
          const parsed = JSON.parse(storedInsights) as unknown;
          if (Array.isArray(parsed)) {
            setSavedInsights(parsed.filter((item): item is SavedInsight => (
              typeof item === "object" && item !== null
              && typeof (item as { id?: unknown }).id === "number"
              && typeof (item as { text?: unknown }).text === "string"
              && typeof (item as { savedAt?: unknown }).savedAt === "string"
            )));
          }
        } catch {
          window.localStorage.removeItem(SAVED_INSIGHTS_STORAGE_KEY);
        }
      }
      setSavedInsightsHydrated(true);
    }, 0);
    return () => window.clearTimeout(loadSavedInsights);
  }, []);

  useEffect(() => {
    if (!savedInsightsHydrated) return;
    window.localStorage.setItem(SAVED_INSIGHTS_STORAGE_KEY, JSON.stringify(savedInsights));
  }, [savedInsights, savedInsightsHydrated]);

  useEffect(() => {
    if (activity !== "listening" && activity !== "speaking") return;
    const waveformTimer = window.setInterval(() => {
      setWaveform((current) => current.map((height) => Math.max(18, Math.min(100, height + Math.round((Math.random() - 0.5) * (activity === "speaking" ? 52 : 44))))));
    }, activity === "speaking" ? 110 : 130);
    return () => window.clearInterval(waveformTimer);
  }, [activity]);

  useEffect(() => {
    if (sessionStartedAt === null) return;
    const updateTimer = () => setSessionSeconds(Math.floor((Date.now() - sessionStartedAt) / 1000));
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, [sessionStartedAt]);

  const speakWithBrowserFallback = (text: string) => {
    if (!voiceEnabledRef.current) return;
    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    const chunks = splitSpeechText(text).filter(Boolean);
    const voices = synthesis.getVoices();
    const voice = voices.find((item) => item.lang.toLowerCase() === selectedLanguage.speech.toLowerCase()) ?? voices.find((item) => item.lang.toLowerCase().startsWith(selectedLanguage.code)) ?? voices.find((item) => item.lang.toLowerCase().startsWith("en"));
    let chunkIndex = 0;
    const speakNext = () => {
      const chunk = chunks[chunkIndex];
      if (!chunk) { setActivity("idle"); return; }
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = selectedLanguage.speech;
      utterance.voice = voice ?? null;
      utterance.rate = speed;
      utterance.pitch = selectedVoice.pitch;
      utterance.onend = () => { chunkIndex += 1; window.setTimeout(speakNext, 80); };
      utterance.onerror = () => setActivity("idle");
      synthesis.speak(utterance);
    };
    setActivity("speaking");
    speakNext();
  };

  const speakText = async (text: string) => {
    if (!voiceEnabledRef.current) {
      audioRef.current?.pause();
      window.speechSynthesis.cancel();
      return;
    }
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    window.speechSynthesis.cancel();
    setActivity("speaking");

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId: settings.elevenLabsVoiceId || selectedVoiceProfile.id, apiKey: settings.elevenLabsApiKey }),
      });
      if (!response.ok) throw new Error("ElevenLabs audio is unavailable.");

      const audioUrl = URL.createObjectURL(await response.blob());
      if (!voiceEnabledRef.current) {
        URL.revokeObjectURL(audioUrl);
        setActivity("idle");
        return;
      }
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audio.playbackRate = speed;
      audioRef.current = audio;
      audio.onended = () => {
        setActivity("idle");
        URL.revokeObjectURL(audioUrl);
        if (audioUrlRef.current === audioUrl) audioUrlRef.current = null;
      };
      audio.onerror = () => {
        setActivity("idle");
        setError("Unable to play ElevenLabs audio. Please try again.");
      };
      await audio.play();
    } catch {
      speakWithBrowserFallback(text);
    }
  };

  useEffect(() => () => {
    recognitionRef.current?.stop();
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    window.speechSynthesis.cancel();
  }, []);

  const askTutor = async (message: string) => {
    const userMessage = message.trim();
    if (!userMessage || activity === "processing") return;
    if (sessionStartedAt === null) setSessionStartedAt((current) => current ?? Date.now());
    setTranscript("");
    setConversation((current) => [...current, { id: ++messageIdRef.current, role: "user", text: userMessage }]);
    setActivity("processing");
    setError("");
    try {
      const result = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, language, voiceStyle, persona, groqApiKey: settings.groqApiKey }),
      });
      const data = (await result.json()) as { text?: string; error?: string };
      if (!result.ok || !data.text) throw new Error(data.error ?? "No response received.");
      setConversation((current) => [...current, { id: ++messageIdRef.current, role: "assistant", text: data.text as string }]);
      void speakText(data.text);
    } catch (requestError) {
      setActivity("idle");
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    }
  };

  const toggleListening = () => {
    if (activity === "listening") { recognitionRef.current?.stop(); return; }
    if (activity === "processing" || activity === "speaking") return;
    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setError("Voice input is not supported in this browser. Try Chrome or Edge."); return; }
    const recognition = new Recognition();
    recognition.lang = selectedLanguage.speech;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim() ?? "";
      recognitionTextRef.current = text;
      setTranscript(text);
    };
    recognition.onerror = () => { setActivity("idle"); setError("I couldn't hear that clearly. Please try again."); };
    recognition.onend = () => {
      setActivity((current) => current === "listening" ? "idle" : current);
      const text = recognitionTextRef.current.trim();
      recognitionTextRef.current = "";
      if (!text) return;
      const command = text.toLowerCase().replace(/[.!?,]/g, "").trim();
      if (/\b(clear chat|clear history|new session|start over)\b/.test(command)) {
        clearChat();
        setError("New learning session started.");
      } else if (/\b(repeat that|repeat text|say that again|repeat response)\b/.test(command)) {
        const lastResponse = [...conversation].reverse().find((message) => message.role === "assistant");
        if (lastResponse) void speakText(lastResponse.text);
        else setError("There is no tutor response to repeat yet.");
      } else {
        void askTutor(text);
      }
    };
    recognitionRef.current = recognition;
    recognitionTextRef.current = "";
    setTranscript("");
    setError("");
    setActivity("listening");
    recognition.start();
  };

  const clearChat = () => {
    recognitionRef.current?.stop();
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    window.speechSynthesis.cancel();
    setConversation([]);
    setTranscript("");
    setError("");
    setActivity("idle");
    setSessionStartedAt(null);
    setSessionSeconds(0);
    messageIdRef.current = 0;
  };

  const openSettings = () => {
    setSettingsDraft(settings);
    setSettingsOpen(true);
  };

  const toggleVoice = () => {
    setIsVoiceEnabled((current) => {
      const nextValue = !current;
      voiceEnabledRef.current = nextValue;
      if (!nextValue) {
        recognitionRef.current?.stop();
        audioRef.current?.pause();
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        window.speechSynthesis.cancel();
        setActivity("idle");
      }
      return nextValue;
    });
  };

  const saveSettings = () => {
    const nextSettings = {
      groqApiKey: settingsDraft.groqApiKey.trim(),
      elevenLabsApiKey: settingsDraft.elevenLabsApiKey.trim(),
      elevenLabsVoiceId: settingsDraft.elevenLabsVoiceId.trim(),
    };
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    if (nextSettings.elevenLabsVoiceId && voiceProfiles.some((profile) => profile.id === nextSettings.elevenLabsVoiceId)) {
      setVoiceProfileId(nextSettings.elevenLabsVoiceId as VoiceProfileId);
    }
    setSettingsOpen(false);
    setSettingsNotice("Settings saved locally.");
    window.setTimeout(() => setSettingsNotice(""), 2600);
  };

  const resetSettings = () => {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    setSettings(emptySettings);
    setSettingsDraft(emptySettings);
    setVoiceProfileId(voiceProfiles[0].id);
    setSettingsOpen(false);
    setSettingsNotice("Settings reset to defaults.");
    window.setTimeout(() => setSettingsNotice(""), 2600);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  const createStudyNotes = () => conversation
    .map((message, index) => `${index + 1}. ${message.role === "user" ? "Learner" : "Aivora Tutor"}\n${message.text}`)
    .join("\n\n");

  const exportNotes = () => {
    if (!conversation.length) return;
    const notes = [
      "AIVORA STUDY SESSION",
      "====================",
      `Date: ${new Date().toLocaleString()}`,
      `Session duration: ${formatDuration(sessionSeconds)}`,
      `Language: ${selectedLanguage.label}`,
      `Messages: ${conversation.length}`,
      "",
      "TRANSCRIPT",
      "----------",
      createStudyNotes(),
      "",
      "Generated by Aivora Voice Tutor",
      "",
    ].join("\n");
    const blob = new Blob([notes], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Aivora-Study-Session.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const copyNotes = async () => {
    if (!conversation.length) return;
    try {
      await navigator.clipboard.writeText(createStudyNotes());
      setError("Study notes copied to your clipboard.");
      window.setTimeout(() => setError(""), 1800);
    } catch {
      setError("Unable to copy study notes. Please try again.");
    }
  };

  const startQuiz = () => {
    const topic = [...conversation].reverse().find((message) => message.role === "user")?.text;
    void askTutor(`Create a quick interactive quiz about this learning topic: "${topic ?? "the topic we are currently studying"}". Ask 3 questions one at a time, wait for my answer after each question, and give brief feedback before continuing. Start with question 1 only.`);
  };

  const generateSummary = async () => {
    if (!conversation.length || summaryLoading) return;
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation, language: selectedLanguage.label, groqApiKey: settings.groqApiKey }),
      });
      const data = (await response.json()) as StudySummary & { error?: string };
      if (!response.ok || !Array.isArray(data.takeaways) || !Array.isArray(data.flashcards)) {
        throw new Error(data.error ?? "Unable to generate study notes.");
      }
      setSummary(data);
      setSummaryOpen(true);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Unable to generate study notes.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const copySummary = async () => {
    if (!summary) return;
    const markdown = `# Aivora AI Study Notes\n\n## Key takeaways\n${summary.takeaways.map((item) => `- ${item}`).join("\n")}\n\n## Flashcards\n${summary.flashcards.map((card) => `### Q: ${card.question}\nA: ${card.answer}`).join("\n\n")}`;
    try {
      await navigator.clipboard.writeText(markdown);
      setSettingsNotice("Study notes copied to clipboard.");
      window.setTimeout(() => setSettingsNotice(""), 2600);
    } catch {
      setSummaryError("Unable to copy study notes. Please try again.");
    }
  };

  const downloadSummary = () => {
    if (!summary) return;
    const markdown = `# Aivora AI Study Notes\n\n## Key takeaways\n${summary.takeaways.map((item) => `- ${item}`).join("\n")}\n\n## Flashcards\n${summary.flashcards.map((card) => `### Q: ${card.question}\nA: ${card.answer}`).join("\n\n")}\n`;
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "Aivora-AI-Study-Notes.md";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const selectedPersona = tutorPersonas.find((item) => item.id === persona) ?? tutorPersonas[0];

  const copyResponse = async (message: ConversationMessage) => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(null), 1800);
    } catch { setError("Unable to copy this response. Please try again."); }
  };

  const toggleSavedInsight = (message: ConversationMessage) => {
    setSavedInsights((current) => {
      if (current.some((insight) => insight.id === message.id)) {
        return current.filter((insight) => insight.id !== message.id);
      }
      return [{ id: message.id, text: message.text, savedAt: new Date().toISOString() }, ...current];
    });
  };

  const copySavedInsight = async (insight: SavedInsight) => {
    try {
      await navigator.clipboard.writeText(insight.text);
      setSettingsNotice("Insight copied to clipboard.");
      window.setTimeout(() => setSettingsNotice(""), 2600);
    } catch {
      setError("Unable to copy this insight. Please try again.");
    }
  };

  const deleteSavedInsight = (insightId: number) => {
    setSavedInsights((current) => current.filter((insight) => insight.id !== insightId));
  };
  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1800);
    } catch { setError("Unable to copy this code. Please try again."); }
  };

  const isActive = activity === "listening" || activity === "processing";
  const statusCopy = { idle: "Tap to speak", listening: "Listening…", processing: "Thinking…", speaking: "Speaking…" }[activity];
  const statusLabel = { idle: "Ready to learn", listening: "Listening...", processing: "Processing with Groq...", speaking: "Speaking..." }[activity];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#080b13] text-slate-100">
      <div className="pointer-events-none absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] py-4 sm:gap-4 sm:py-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Aivora Voice Tutor">
            <Image
              src="/logo.png"
              alt="Aivora Voice Tutor logo"
              width={60}
              height={60}
              priority
              className="h-10 w-10 rounded-full object-cover opacity-100 mix-blend-screen drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] drop-shadow-[0_0_16px_rgba(34,211,238,0.38)] sm:h-14 sm:w-14"
            />
            <div>
              <p className="truncate text-sm font-bold tracking-tight text-white sm:text-lg">Aivora Voice Tutor</p>
              <p className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-300/70 sm:block">AI-powered learning companion</p>
            </div>
          </div>
          <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <label className="relative flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm text-slate-300 sm:px-3">
              <Globe2 size={15} className="text-cyan-300" />
              <select value={language} onChange={(event) => setLanguage(event.target.value as LanguageCode)} className="max-w-20 cursor-pointer appearance-none bg-transparent pr-4 outline-none sm:max-w-none sm:pr-5" aria-label="Choose tutor language">
                {languages.map((item) => <option key={item.code} value={item.code} className="bg-[#111827]">{item.label}</option>)}
              </select><ChevronDown size={14} className="pointer-events-none absolute right-2" />
            </label>
            <button type="button" onClick={openSettings} aria-label="Open settings" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"><Settings size={15} /> <span className="hidden sm:inline">Settings</span></button>
            <button type="button" onClick={toggleVoice} aria-pressed={isVoiceEnabled} aria-label={isVoiceEnabled ? "Mute tutor voice" : "Unmute tutor voice"} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${isVoiceEnabled ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100 hover:border-emerald-200/40 hover:bg-emerald-300/15" : "border-rose-300/25 bg-rose-300/[0.06] text-rose-200 hover:border-rose-200/40 hover:bg-rose-300/15"}`}><span className="relative">{isVoiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}<span className={`absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full ${isVoiceEnabled ? "bg-emerald-300" : "bg-rose-300"}`} /></span><span className="hidden sm:inline">Voice: {isVoiceEnabled ? "ON" : "MUTE"}</span></button>
            <button type="button" onClick={() => setSavedInsightsOpen(true)} aria-label={`Open saved insights${savedInsights.length ? `, ${savedInsights.length} saved` : ""}`} className="relative inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-sm text-amber-100 transition hover:border-amber-200/40 hover:bg-amber-300/15"><Bookmark size={15} /> <span className="hidden sm:inline">Saved Insights</span>{savedInsights.length > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">{savedInsights.length}</span>}</button>
            {conversation.length > 0 && <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-xs font-medium text-cyan-100" aria-label="Session duration"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> {formatDuration(sessionSeconds)}</div>
              <button type="button" onClick={copyNotes} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"><FileText size={14} /> Copy notes</button>
              <button type="button" onClick={exportNotes} aria-label="Download study notes" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-300/30 hover:bg-violet-300/10 hover:text-violet-100"><Download size={14} /> Download Notes</button>
              <button type="button" onClick={() => void generateSummary()} disabled={summaryLoading} className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-2 text-xs font-medium text-fuchsia-100 transition hover:border-fuchsia-200/50 hover:bg-fuchsia-300/20 disabled:cursor-wait disabled:opacity-60"><Sparkles size={14} className={summaryLoading ? "animate-pulse" : ""} /> {summaryLoading ? "Generating..." : "AI Study Notes"}</button>
              <button type="button" onClick={clearChat} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-rose-300/30 hover:bg-rose-300/10 hover:text-rose-100"><Eraser size={14} /> Clear chat</button>
            </div>}
          </div>
        </header>

        <section className={`flex flex-1 flex-col ${conversation.length === 0 ? "items-center justify-center py-8 text-center sm:py-16" : "min-h-0 py-3 sm:py-6"}`}>
        {conversation.length === 0 ? <div className="flex w-full flex-col items-center text-center">
          <div className={`mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${activity === "listening" ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-200" : activity === "processing" ? "border-amber-300/25 bg-amber-300/10 text-amber-200" : activity === "speaking" ? "border-violet-300/25 bg-violet-300/10 text-violet-200" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"}`}><span className={`h-1.5 w-1.5 rounded-full ${activity === "idle" ? "bg-emerald-300" : "animate-pulse bg-current"}`} />{statusLabel}</div>
          <p className="mb-7 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">Your always-on learning companion</p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">Speak your questions.<br /><span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Grow your ideas.</span></h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">Learn languages, untangle code, and explore anything that sparks your curiosity — naturally, by voice.</p>

          <div className="relative mt-12">
            <div className={`absolute inset-[-2rem] rounded-full bg-violet-500/10 blur-2xl transition-all duration-700 ${activity === "listening" ? "scale-125 bg-cyan-400/20" : activity === "processing" ? "scale-110 bg-amber-400/20" : ""}`} />
            {isActive && <><span className={`absolute inset-[-1rem] animate-ping rounded-full border ${activity === "processing" ? "border-amber-300/30" : "border-cyan-300/30"}`} /><span className={`absolute inset-[-2rem] rounded-full border ${activity === "processing" ? "animate-[pulse-ring_2s_ease-out_infinite] border-amber-300/15" : "animate-[ping_2.2s_ease-out_infinite] border-cyan-300/15"}`} /><span className="absolute inset-[-3rem] animate-[pulse-ring_2.8s_ease-out_infinite] rounded-full border border-violet-300/10" /></>}
            {(activity === "listening" || activity === "speaking") && <div className="pointer-events-none absolute -inset-x-14 top-1/2 flex -translate-y-1/2 items-center justify-center gap-1.5" aria-label={activity === "speaking" ? "AI speaking waveform" : "Live audio waveform"} role="status">
              {waveform.map((height, index) => <span key={index} className={`w-1.5 rounded-full bg-gradient-to-t from-cyan-400 via-violet-300 to-white shadow-[0_0_12px_rgba(103,232,249,0.8)] transition-[height] duration-150 ${activity === "speaking" ? "animate-pulse" : ""}`} style={{ height: `${height}%`, maxHeight: "5.5rem", minHeight: "0.75rem", animationDelay: `${index * 70}ms` }} />)}
            </div>}
            <button type="button" onClick={toggleListening} aria-label={activity === "listening" ? "Stop listening" : "Start voice conversation"} className={`group relative grid h-36 w-36 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-violet-500 to-indigo-600 shadow-2xl shadow-violet-900/60 transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-4 focus:ring-offset-[#080b13] ${activity === "listening" ? "from-cyan-400 to-blue-600" : activity === "processing" ? "from-amber-400 to-orange-600" : ""}`}>{activity === "listening" ? <MicOff size={38} /> : activity === "processing" ? <RotateCcw size={38} className="animate-spin" /> : <Mic size={42} className="transition-transform group-hover:scale-110" />}</button>
          </div>
          <p className="mt-7 text-sm font-medium text-slate-300">{statusCopy}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${activity === "idle" ? "bg-emerald-400" : "animate-pulse bg-cyan-300"}`} /> Ready in {selectedLanguage.label}</div>

          <div className="mt-8 grid w-full max-w-3xl gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-center">
            <label className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 px-3 py-2.5"><SlidersHorizontal size={16} className="text-violet-300" /><span className="flex-1"><span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tutor voice</span><select value={voiceStyle} onChange={(event) => setVoiceStyle(event.target.value as VoiceStyleId)} className="mt-1 w-full bg-transparent text-sm text-slate-200 outline-none" aria-label="Choose tutor voice"><option value="clear" className="bg-[#111827]">Clear mentor</option><option value="warm" className="bg-[#111827]">Warm companion</option><option value="energetic" className="bg-[#111827]">Energetic coach</option></select></span></label>
            <label className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 px-3 py-2.5"><Headphones size={16} className="text-fuchsia-300" /><span className="flex-1"><span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Teaching style</span><select value={persona} onChange={(event) => setPersona(event.target.value as TutorPersonaId)} className="mt-1 w-full bg-transparent text-sm text-slate-200 outline-none" aria-label="Choose AI tutor teaching style">{tutorPersonas.map((item) => <option key={item.id} value={item.id} className="bg-[#111827]">{item.label}</option>)}</select></span></label>
            <label className="flex items-center gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] px-3 py-2.5"><Volume2 size={16} className="text-cyan-300" /><span className="flex-1"><span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">AI voice profile</span><select value={voiceProfileId} onChange={(event) => setVoiceProfileId(event.target.value as VoiceProfileId)} className="mt-1 w-full bg-transparent text-sm text-slate-200 outline-none" aria-label="Choose AI voice profile">{voiceProfiles.map((profile) => <option key={profile.id} value={profile.id} className="bg-[#111827]">{profile.name} · {profile.description}</option>)}</select></span></label>
            <label className="rounded-xl border border-white/[0.07] bg-black/10 px-3 py-2.5"><span className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500"><span>Speech rate</span><span className="text-cyan-300">{speed.toFixed(2)}x</span></span><input type="range" min="0.6" max="1.25" step="0.01" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="mt-3 w-full accent-cyan-300" aria-label="Text to speech playback rate" /><span className="mt-1 flex justify-between text-[10px] text-slate-600"><span>Gentle</span><span>Fast</span></span></label>
            <div className="hidden px-2 text-right text-[10px] text-slate-600 lg:block"><span className="block">{selectedVoice.hint}</span><span className="mt-1 block text-fuchsia-300/50">{selectedPersona.description}</span><span className="mt-1 block text-cyan-300/50">{selectedVoiceProfile.description}</span></div>
          </div>
          <div className="mt-4 flex w-full max-w-3xl items-end gap-1.5 rounded-2xl border border-white/10 bg-white/[0.035] p-2 sm:gap-2 sm:p-3 text-left backdrop-blur-xl">
            <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void askTutor(transcript); } }} placeholder="Type a question or tap the microphone to speak..." rows={2} className="min-h-12 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600" aria-label="Tutor question" />
            <button type="button" onClick={toggleListening} disabled={activity === "processing" || activity === "speaking"} aria-label={activity === "listening" ? "Stop microphone input" : "Start microphone input"} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition ${activity === "listening" ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-100" : "border-white/10 bg-white/[0.06] text-slate-300 hover:border-cyan-300/30 hover:text-cyan-100"} disabled:cursor-not-allowed disabled:opacity-40`}><Mic size={19} /></button>
            <button type="button" onClick={() => void askTutor(transcript)} disabled={!transcript.trim() || activity === "processing" || activity === "speaking"} className="h-11 shrink-0 rounded-xl bg-violet-500 px-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4">Send</button>
          </div>
          {summaryError && <p role="alert" className="mt-3 w-full max-w-3xl text-left text-sm text-rose-300">{summaryError}</p>}

          <div className="mt-8 w-full max-w-3xl text-left"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Try asking</p><div className="flex flex-wrap gap-1.5 sm:gap-2">
            {quickPrompts.map((prompt) => <button key={prompt} type="button" disabled={activity === "processing" || activity === "speaking"} onClick={() => void askTutor(prompt)} className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-slate-300 transition hover:border-violet-300/40 hover:bg-violet-300/10 hover:text-violet-100 disabled:cursor-not-allowed disabled:opacity-50">{prompt}</button>)}
            <button type="button" disabled={activity === "processing" || activity === "speaking"} onClick={startQuiz} className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3.5 py-2 text-xs font-medium text-fuchsia-100 transition hover:border-fuchsia-200/50 hover:bg-fuchsia-300/20 disabled:cursor-not-allowed disabled:opacity-40"><BrainCircuit size={14} /> Quiz me</button>
          </div></div>

          {(conversation.length > 0 || transcript || error) && <div className="mt-8 w-full max-w-3xl rounded-3xl border border-white/10 bg-white/[0.045] p-4 text-left shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-white/[0.07] pb-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Live conversation</p><span className="text-xs text-slate-600">{conversation.length} messages</span></div>
            <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
              {conversation.map((message) => <div key={message.id} className={`message-enter flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[80%] ${message.role === "user" ? "rounded-br-md bg-violet-500/20 text-violet-50" : "rounded-bl-md border border-white/10 bg-[#121827]/90 text-slate-200"}`}>
                <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{message.role === "user" ? "You" : <><Bot size={12} /> Aivora</>}</div>
                <div className="text-sm leading-6">{message.role === "assistant" ? renderMarkdown(message.text, (code) => void copyCode(code), copiedCode) : message.text}</div>
                {message.role === "assistant" && <div className="mt-3 flex items-center gap-1 border-t border-white/[0.07] pt-2"><button type="button" onClick={() => speakText(message.text)} disabled={!isVoiceEnabled} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-white/10 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"><Volume2 size={13} /> Replay</button><button type="button" onClick={() => void copyResponse(message)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-white/10 hover:text-slate-200">{copiedMessageId === message.id ? <Check size={13} /> : <Clipboard size={13} />}{copiedMessageId === message.id ? "Copied" : "Copy answer"}</button><button type="button" onClick={() => toggleSavedInsight(message)} aria-label={savedInsights.some((insight) => insight.id === message.id) ? "Remove saved insight" : "Save insight"} className={`ml-auto rounded-md p-1.5 transition ${savedInsights.some((insight) => insight.id === message.id) ? "text-amber-300 hover:bg-amber-300/10" : "text-slate-500 hover:bg-white/10 hover:text-amber-200"}`}><Bookmark size={14} fill={savedInsights.some((insight) => insight.id === message.id) ? "currentColor" : "none"} /></button></div>}
              </div></div>)}
              {transcript && activity === "listening" && <div className="message-enter flex justify-end"><div className="max-w-[92%] rounded-2xl rounded-br-md border border-cyan-300/15 bg-cyan-300/[0.08] px-4 py-3 text-sm text-cyan-100 sm:max-w-[80%]"><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300/70">Listening live</div>{transcript}</div></div>}
            </div>
            {error && <div role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] p-3 text-sm text-rose-200">{error}</div>}
          </div>}
        </div> : <div className="flex min-h-0 flex-1 gap-2 text-left sm:gap-4">
          <aside className="hidden w-60 shrink-0 flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl lg:flex">
            <button type="button" onClick={clearChat} className="flex items-center justify-center gap-2 rounded-xl border border-violet-300/25 bg-violet-300/10 px-3 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-300/20"><Mic size={16} /> New Chat</button>
            <div className="mt-6">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Chat history</p>
              <div className="mt-2 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-3">
                <p className="truncate text-sm font-medium text-cyan-100">{conversation.find((message) => message.role === "user")?.text ?? "Current learning session"}</p>
                <p className="mt-1 text-[11px] text-slate-500">{conversation.length} messages · {formatDuration(sessionSeconds)}</p>
              </div>
            </div>
            <div className="mt-auto rounded-xl border border-white/[0.07] bg-black/10 p-3 text-xs leading-5 text-slate-500">
              <p className="font-medium text-slate-300">Study mode</p>
              <p className="mt-1">{selectedPersona.label} · {selectedLanguage.label}</p>
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Active conversation</p><p className="mt-1 text-sm text-slate-300">{selectedPersona.label} · {selectedLanguage.label}</p></div>
              <button type="button" onClick={clearChat} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-violet-300/30 hover:bg-violet-300/10 hover:text-violet-100 lg:hidden"><Mic size={14} /> New Chat</button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-28 pr-0 sm:space-y-4 sm:pr-1">
              {conversation.map((message) => <div key={message.id} className={`message-enter flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[94%] rounded-2xl px-4 py-3 sm:max-w-[78%] ${message.role === "user" ? "rounded-br-md bg-violet-500/20 text-violet-50" : "rounded-bl-md border border-white/10 bg-[#121827]/90 text-slate-200"}`}>
                <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{message.role === "user" ? "You" : <><Bot size={12} /> Aivora</>}</div>
                <div className="text-sm leading-6">{message.role === "assistant" ? renderMarkdown(message.text, (code) => void copyCode(code), copiedCode) : message.text}</div>
                {message.role === "assistant" && <div className="mt-3 flex items-center gap-1 border-t border-white/[0.07] pt-2"><button type="button" onClick={() => speakText(message.text)} disabled={!isVoiceEnabled} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-white/10 hover:text-slate-200 disabled:opacity-40"><Volume2 size={13} /> Replay</button><button type="button" onClick={() => void copyResponse(message)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-white/10 hover:text-slate-200">{copiedMessageId === message.id ? <Check size={13} /> : <Clipboard size={13} />}{copiedMessageId === message.id ? "Copied" : "Copy"}</button><button type="button" onClick={() => toggleSavedInsight(message)} aria-label="Save insight" className={`ml-auto rounded-md p-1.5 ${savedInsights.some((insight) => insight.id === message.id) ? "text-amber-300" : "text-slate-500 hover:text-amber-200"}`}><Bookmark size={14} fill={savedInsights.some((insight) => insight.id === message.id) ? "currentColor" : "none"} /></button></div>}
              </div></div>)}
              {activity === "processing" && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 animate-bounce rounded-full bg-amber-300" /><span className="h-2 w-2 animate-bounce rounded-full bg-amber-300 [animation-delay:120ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-amber-300 [animation-delay:240ms]" /> Aivora is thinking</span></div></div>}
            </div>
            <div className="sticky bottom-0 mt-3 border-t border-white/[0.07] bg-[#080b13]/95 pt-3 backdrop-blur-xl">
              <div className="flex items-end gap-1.5 rounded-2xl border border-white/10 bg-white/[0.05] p-1.5 sm:gap-2 sm:p-2">
                <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void askTutor(transcript); } }} placeholder="Message Aivora..." rows={1} className="min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 sm:px-3" aria-label="Message Aivora" />
                <button type="button" onClick={toggleListening} disabled={activity === "processing" || activity === "speaking"} aria-label="Use microphone" className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${activity === "listening" ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-100" : "border-white/10 bg-white/[0.06] text-slate-300"} disabled:opacity-40`}><Mic size={18} /></button>
                <button type="button" onClick={() => void askTutor(transcript)} disabled={!transcript.trim() || activity === "processing" || activity === "speaking"} className="h-11 shrink-0 rounded-xl bg-violet-500 px-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-40 sm:px-4">Send</button>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-600">Aivora can make mistakes. Check important information.</p>
            </div>
          </div>
        </div>}
        </section>
        {settingsOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="settings-title" className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#101624] p-5 shadow-2xl shadow-black/50 sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300/70">Personalize your tutor</p><h2 id="settings-title" className="mt-1 text-xl font-semibold text-white">Settings</h2><p className="mt-2 text-sm leading-6 text-slate-400">Credentials stay in this browser and are sent only with your tutor requests.</p></div>
              <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><X size={18} /></button>
            </div>
            <div className="mt-6 space-y-4">
              {([["groqApiKey", "Groq API Key", "gsk_...", "password"], ["elevenLabsApiKey", "ElevenLabs API Key", "sk_...", "password"], ["elevenLabsVoiceId", "ElevenLabs Voice ID", "EXAVITQu4vr4xnSDxMaL", "text"]] as const).map(([key, label, placeholder, type]) => <label key={key} className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span><input type={type} value={settingsDraft[key]} onChange={(event) => setSettingsDraft((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} autoComplete="off" className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10" /></label>)}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={resetSettings} className="rounded-xl px-3 py-2.5 text-sm text-rose-300 transition hover:bg-rose-300/10">Reset to Default</button>
              <div className="flex gap-3"><button type="button" onClick={() => setSettingsOpen(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10">Cancel</button><button type="button" onClick={saveSettings} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Save Settings</button></div>
            </div>
          </section>
        </div>}
        {summaryOpen && summary && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSummaryOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="summary-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-fuchsia-300/15 bg-[#101624] p-5 shadow-2xl shadow-black/50 sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-fuchsia-300/70">AI-powered revision guide</p><h2 id="summary-title" className="mt-1 text-2xl font-semibold text-white">Your Study Notes</h2></div><button type="button" onClick={() => setSummaryOpen(false)} aria-label="Close study notes" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><X size={18} /></button></div>
            <div className="mt-6"><h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Key takeaways</h3><ul className="mt-3 space-y-2">{summary.takeaways.map((item) => <li key={item} className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.05] px-4 py-3 text-sm leading-6 text-slate-200"><span className="mr-2 text-cyan-300">•</span>{item}</li>)}</ul></div>
            <div className="mt-7"><h3 className="text-sm font-semibold uppercase tracking-wider text-violet-300">Quick revision flashcards</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{summary.flashcards.map((card) => <article key={card.question} className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-sm font-semibold leading-5 text-white">Q: {card.question}</p><p className="mt-3 border-t border-white/[0.08] pt-3 text-sm leading-6 text-slate-300">A: {card.answer}</p></article>)}</div></div>
            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => void copySummary()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"><Clipboard size={15} /> Copy to Clipboard</button><button type="button" onClick={downloadSummary} className="inline-flex items-center justify-center gap-2 rounded-xl bg-fuchsia-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-300"><Download size={15} /> Export Markdown</button></div>
          </section>
        </div>}
        {savedInsightsOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSavedInsightsOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="saved-insights-title" className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-amber-300/15 bg-[#101624] p-5 shadow-2xl shadow-black/50 sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300/70">Your personal library</p><h2 id="saved-insights-title" className="mt-1 text-2xl font-semibold text-white">Saved Insights <span className="text-amber-300">({savedInsights.length})</span></h2><p className="mt-2 text-sm leading-6 text-slate-400">Keep the tutor responses you want to revisit later.</p></div><button type="button" onClick={() => setSavedInsightsOpen(false)} aria-label="Close saved insights" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><X size={18} /></button></div>
            {savedInsights.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-5 py-10 text-center"><Bookmark size={28} className="mx-auto text-amber-300/60" /><p className="mt-3 text-sm font-medium text-slate-300">No saved insights yet</p><p className="mt-1 text-xs text-slate-500">Tap the bookmark icon on an Aivora response to build your study library.</p></div> : <div className="mt-6 space-y-3">{savedInsights.map((insight) => <article key={insight.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{insight.text}</p><div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3"><span className="text-[10px] uppercase tracking-wider text-slate-600">{new Date(insight.savedAt).toLocaleDateString()}</span><div className="flex gap-1"><button type="button" onClick={() => void copySavedInsight(insight)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"><Clipboard size={13} /> Copy</button><button type="button" onClick={() => deleteSavedInsight(insight.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-rose-300/10 hover:text-rose-200"><Trash2 size={13} /> Delete</button></div></div></article>)}</div>}
          </section>
        </div>}
        {settingsNotice && <div role="status" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2.5 text-sm font-medium text-emerald-200 shadow-lg shadow-black/30">{settingsNotice}</div>}
        <div className="grid gap-3 border-t border-white/[0.07] py-6 text-left sm:grid-cols-3">{[{ title: "Learn naturally", text: "Ask anything, in your own words." }, { title: "Build with confidence", text: "Get clear, practical coding help." }, { title: "Made for progress", text: "Small steps. Big breakthroughs." }].map(({ title, text }) => <div key={title} className="rounded-xl p-2"><p className="text-sm font-medium text-slate-200">{title}</p><p className="text-xs text-slate-500">{text}</p></div>)}</div>
        <footer className="flex flex-col items-center justify-between gap-2 border-t border-white/[0.07] py-5 text-xs text-slate-600 sm:flex-row"><p>Built with curiosity for <span className="text-slate-400">EurekaDEV 2026</span></p><a href="https://github.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-slate-300">Hackathon entry</a></footer>
      </div>
    </main>
  );
}
