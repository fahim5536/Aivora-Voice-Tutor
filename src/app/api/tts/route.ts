import { NextResponse } from "next/server";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const MAX_TEXT_LENGTH = 4_000;
const VOICE_ID_PATTERN = /^[\w-]+$/;

type TtsRequest = {
  text?: unknown;
  voiceId?: unknown;
  apiKey?: unknown;
};

function getFallbackVoiceId() {
  const configuredVoiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
  return configuredVoiceId && VOICE_ID_PATTERN.test(configuredVoiceId)
    ? configuredVoiceId
    : DEFAULT_VOICE_ID;
}

export async function POST(request: Request) {
  let body: TtsRequest;
  try {
    body = (await request.json()) as TtsRequest;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const customApiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const apiKey = customApiKey || process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs is not configured. Add an API key in Settings or .env.local." },
      { status: 503 },
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const requestedVoiceId = typeof body.voiceId === "string" ? body.voiceId.trim() : "";
  const voiceId = requestedVoiceId && VOICE_ID_PATTERN.test(requestedVoiceId)
    ? requestedVoiceId
    : getFallbackVoiceId();

  if (!text) return NextResponse.json({ error: "Text is required." }, { status: 400 });
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: `Text must be ${MAX_TEXT_LENGTH} characters or fewer.` }, { status: 413 });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const providerError = await response.text();
      console.error("ElevenLabs API error:", providerError.slice(0, 500));
      const message = response.status === 401 || response.status === 403
        ? "ElevenLabs rejected the API key. Check ELEVENLABS_API_KEY in .env.local."
        : "ElevenLabs could not generate audio right now.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": response.headers.get("content-type") ?? "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("ElevenLabs request failed:", error instanceof Error ? error.message : "Unknown ElevenLabs error");
    return NextResponse.json({ error: "Unable to reach ElevenLabs right now." }, { status: 503 });
  }
}