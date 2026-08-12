import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { headline, body, tone = "professional", carouselTitle } = await req.json();
  if (!headline && !body) return NextResponse.json({ error: "Missing slide content" }, { status: 400 });

  const toneMap: Record<string, string> = {
    professional: "professional and authoritative",
    casual: "conversational and approachable",
    bold: "bold, punchy and attention-grabbing",
    storytelling: "narrative and story-driven",
  };

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 256,
    messages: [
      {
        role: "system",
        content: `You rewrite LinkedIn carousel slides. Keep the same core message but make it more engaging.
Tone: ${toneMap[tone] ?? toneMap.professional}
Rules:
- Headline: max 60 chars, punchy, no fluff
- Body: max 180 chars, clear value, one idea
- Return ONLY valid JSON: {"headline":"...","body":"..."}`
      },
      {
        role: "user",
        content: `Carousel: "${carouselTitle || "LinkedIn post"}"\nHeadline: ${headline}\nBody: ${body}\n\nRewrite this slide.`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const cleaned = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    const result = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "AI returned invalid response", raw }, { status: 500 });
  }
}
