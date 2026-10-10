import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_OUTPUT_TOKENS = 800;
const languageNames: Record<string, string> = { bn: "Bengali", en: "English", es: "Spanish", ar: "Arabic", hi: "Hindi" };
const personaNames: Record<string, string> = {
  friendly: "Friendly Study Buddy: use casual positive energy, explain concepts in simple terms, be warm and encouraging, and celebrate progress.",
  strict: "Strict Professor: use a professional, academic, and formal tone; demand precision, define terms carefully, and correct errors directly.",
  socratic: "Socratic Mentor: guide active learning with thought-provoking counter-questions, hints, and reflection before giving a direct answer whenever practical.",
};

type ChatRequest = { message?: unknown; language?: unknown; voiceStyle?: unknown; persona?: unknown; groqApiKey?: unknown };
type GroqResponse = { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };

const systemPrompt = (language: string, voiceStyle = "clear", persona = "friendly") => `
You are Aivora, a world-class professional EdTech tutor for learning and
coding. Produce answers that are engaging, structured, accurate, and easy to
scan. Answer in ${language}, unless the learner explicitly requests another
language. Use a ${voiceStyle} speaking tone and follow this instructional
persona: ${personaNames[persona] ?? personaNames.friendly}

Use clear Markdown typography in every substantive answer:
- Start with a concise heading when it improves organization.
- Use **bold** for important terms and short section labels.
- Use ordered or unordered lists for steps, comparisons, and takeaways.
- Use fenced Markdown code blocks with a language identifier for all code.
- Format tables strictly with standard Markdown pipe syntax, including a
  header row, a separator row, and matching column counts on every row.
- Keep paragraphs concise and add helpful examples where appropriate.

For coding questions, explain the reasoning before or after the solution,
identify assumptions, and include practical examples. For general learning,
use useful analogies and finish with a short actionable next step. Keep the
content natural enough for voice playback while retaining rich Markdown for
the visual interface. Never claim to have performed actions you cannot perform.
`;

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const customGroqApiKey = typeof body.groqApiKey === "string" ? body.groqApiKey.trim() : "";
  const groqApiKey = customGroqApiKey || process.env.GROQ_API_KEY || process.env.GROQ;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!groqApiKey && !geminiApiKey) {
    return NextResponse.json({ error: "No AI provider is configured. Add GROQ or GEMINI_API_KEY to .env.local." }, { status: 500 });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const language = languageNames[typeof body.language === "string" ? body.language : "en"] ?? languageNames.en;
  const voiceStyle = typeof body.voiceStyle === "string" && ["clear", "warm", "energetic"].includes(body.voiceStyle) ? body.voiceStyle : "clear";
  const persona = typeof body.persona === "string" && Object.hasOwn(personaNames, body.persona) ? body.persona : "friendly";
  if (!message) return NextResponse.json({ error: "A message is required." }, { status: 400 });
  if (message.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ error: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` }, { status: 413 });
  if (groqApiKey) return respondWithGroq(groqApiKey, message, language, voiceStyle, persona);

  try {
    const client = new GoogleGenerativeAI(geminiApiKey as string);
    const model = client.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt(language, voiceStyle, persona),
      generationConfig: { temperature: 0.7, maxOutputTokens: MAX_OUTPUT_TOKENS },
    });
    const result = await model.generateContent(message);
    const text = result.response.text().trim();
    if (!text) return NextResponse.json({ error: "The tutor returned an empty response. Please try again." }, { status: 502 });
    return NextResponse.json({ text });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown Gemini error";
    console.error("Gemini request failed:", errorMessage);
    const isAccessError = /denied|permission|unauthorized|forbidden|api key/i.test(errorMessage);
    const isModelError = /model.*(not found|no longer available)|404 not found/i.test(errorMessage);
    return NextResponse.json({ error: isAccessError ? "Gemini rejected this API key or project. Check Gemini API access in Google AI Studio." : isModelError ? `The configured Gemini model (${GEMINI_MODEL}) is unavailable for this project. Set GEMINI_MODEL to a model enabled for your API key.` : "The tutor is temporarily unavailable. Please try again." }, { status: 502 });
  }
}

async function respondWithGroq(apiKey: string, message: string, language: string, voiceStyle: string, persona: string) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: systemPrompt(language, voiceStyle, persona) }, { role: "user", content: message }],
        temperature: 0.7,
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
      cache: "no-store",
    });
    const data = (await response.json()) as GroqResponse;
    if (!response.ok) {
      const providerError = data.error?.message ?? response.statusText;
      console.error("Groq API error:", providerError);
      return NextResponse.json({ error: response.status === 401 || response.status === 403 ? "Groq rejected the API key. Check GROQ in .env.local." : "The Groq tutor is temporarily unavailable. Please try again." }, { status: 502 });
    }
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return NextResponse.json({ error: "Groq returned an empty response. Please try again." }, { status: 502 });
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Groq request failed:", error instanceof Error ? error.message : "Unknown Groq error");
    return NextResponse.json({ error: "Unable to reach the Groq tutor right now. Please try again." }, { status: 503 });
  }
}
