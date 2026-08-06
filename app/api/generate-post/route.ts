import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentSession } from "@/lib/auth";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TONE_MAP: Record<string, string> = {
  professional: "authoritative, insightful, thought-leader tone",
  casual: "conversational, friendly, approachable tone",
  storytelling: "narrative, story-driven, emotional tone",
  bold: "bold, punchy, high-energy, attention-grabbing tone",
};

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, tone = "professional" } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const toneDesc = TONE_MAP[tone] ?? TONE_MAP.professional;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 600,
    messages: [
      {
        role: "system",
        content: `You write high-performing LinkedIn posts. Use a ${toneDesc}.

Rules:
- Start with a strong hook (first line must stop the scroll)
- Use short paragraphs (1-2 sentences max)
- Add 2-3 blank lines between sections for LinkedIn spacing
- Include 3-5 relevant hashtags at the end
- Max 1500 characters
- No markdown formatting like ** or *
- Return ONLY the post text, nothing else`,
      },
      {
        role: "user",
        content: `Write a LinkedIn post about: ${topic.slice(0, 2000)}`,
      },
    ],
  });

  const post = response.choices[0]?.message?.content?.trim() ?? "";
  if (!post) return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });

  return NextResponse.json({ post });
}
