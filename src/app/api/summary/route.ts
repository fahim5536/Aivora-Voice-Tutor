import { NextResponse } from "next/server";

const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
const MAX_TRANSCRIPT_LENGTH = 16_000;
const MAX_OUTPUT_TOKENS = 1_200;

type SummaryRequest = {
  conversation?: unknown;
  language?: unknown;
  groqApiKey?: unknown;
};

type SummaryResult = {
  takeaways?: unknown;
  flashcards?: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

export async function POST(request: Request) {
  let body: SummaryRequest;
  try {
    body = (await request.json()) as SummaryRequest;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const customGroqApiKey = typeof body.groqApiKey === "string" ? body.groqApiKey.trim() : "";
  const groqApiKey = customGroqApiKey || process.env.GROQ_API_KEY || process.env.GROQ;
  if (!groqApiKey) {
    return NextResponse.json({ error: "Groq is not configured. Add a key in Settings or .env.local." }, { status: 503 });
  }

  const conversation = Array.isArray(body.conversation)
    ? body.conversation.filter((item): item is { role: string; text: string } => (
      typeof item === "object" && item !== null
      && typeof (item as { role?: unknown }).role === "string"
      && typeof (item as { text?: unknown }).text === "string"
    ))
    : [];
  if (!conversation.length) return NextResponse.json({ error: "At least one conversation message is required." }, { status: 400 });

  const transcript = conversation
    .map((message) => `${message.role === "user" ? "Learner" : "Aivora Tutor"}: ${message.text.trim()}`)
    .join("\n\n")
    .slice(0, MAX_TRANSCRIPT_LENGTH);
  const language = typeof body.language === "string" ? body.language : "English";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: `You create concise, accurate study materials from a tutor conversation. Return ONLY valid JSON with this exact shape: {"takeaways":["..."],"flashcards":[{"question":"...","answer":"..."}]}. Include 3-6 key takeaways and 3-6 useful revision flashcards. Write in ${language}. Do not invent facts not supported by the transcript.`,
          },
          { role: "user", content: `Conversation transcript:\n\n${transcript}` },
        ],
        temperature: 0.3,
        max_tokens: MAX_OUTPUT_TOKENS,
        response_format: { type: "json_object" },
      }),
      cache: "no-store",
    });
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
    if (!response.ok) {
      console.error("Groq summary API error:", data.error?.message ?? response.statusText);
      return NextResponse.json({ error: response.status === 401 || response.status === 403 ? "Groq rejected the API key." : "Unable to generate study notes right now." }, { status: 502 });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Groq returned an empty study summary." }, { status: 502 });
    const parsed = JSON.parse(content) as SummaryResult;
    const takeaways = isStringArray(parsed.takeaways) ? parsed.takeaways.map((item) => item.trim()) : [];
    const flashcards = Array.isArray(parsed.flashcards)
      ? parsed.flashcards.filter((item): item is { question: string; answer: string } => (
        typeof item === "object" && item !== null
        && typeof (item as { question?: unknown }).question === "string"
        && typeof (item as { answer?: unknown }).answer === "string"
      )).map((item) => ({ question: item.question.trim(), answer: item.answer.trim() })).filter((item) => item.question && item.answer)
      : [];
    if (!takeaways.length && !flashcards.length) return NextResponse.json({ error: "The study summary was empty. Please try again." }, { status: 502 });
    return NextResponse.json({ takeaways, flashcards });
  } catch (error) {
    console.error("Study summary request failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to generate study notes right now. Please try again." }, { status: 503 });
  }
}
