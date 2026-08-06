import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { title, headlines } = await req.json();

    const prompt = `You are a LinkedIn content expert. Write a short, high-performing LinkedIn post caption for a carousel about "${title}".

Key slides cover: ${headlines.map((h: string, i: number) => `${i + 1}. ${h}`).join(", ")}.

Rules:
- Hook: 1 punchy opening line
- 4-5 bullet points (use • symbol) with concrete insights
- End with 1 short engagement question
- 3-4 relevant hashtags on last line
- Max 160 words total
- NO filler phrases, NO lengthy paragraphs

Return ONLY the caption text.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 350,
      messages: [{ role: "user", content: prompt }],
    });

    const caption = response.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ caption });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
