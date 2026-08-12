import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildCarouselPrompt, buildProductCarouselPrompt } from "@/lib/prompt";
import { scanProductWebsite } from "@/lib/website-scanner";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { GenerateRequest, CarouselData } from "@/lib/types";

export async function POST(req: NextRequest) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const body: GenerateRequest & { audience?: string; tone?: string; topic?: string; keyPoints?: string[]; painPoints?: string[] } = await req.json();
    let { mode, content, numSlides, audience, tone, topic, keyPoints, painPoints } = body;

    if (!content || typeof content !== "string" || content.trim().length < 3) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }
    if (!numSlides || numSlides < 1 || numSlides > 15) {
      return NextResponse.json({ error: "numSlides must be between 1 and 15." }, { status: 400 });
    }

    // Fetch previous carousel titles for this user to avoid repetition
    let previousTitles: string[] = [];
    const session = await getCurrentSession();
    if (session?.userId) {
      const recent = await prisma.carousel.findMany({
        where: { userId: session.userId, status: "complete" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { title: true },
      });
      previousTitles = recent.map((c) => c.title);
    }

    let systemPrompt: string;

    if (mode === "product") {
      // Scan the product website, then generate using product-aware prompt
      const scanned = await scanProductWebsite(content.trim());
      content = scanned.rawContent;
      systemPrompt = buildProductCarouselPrompt(numSlides, audience, tone, previousTitles);
    } else {
      const label = mode === "url" ? "article text" :
                    mode === "text" ? "pasted content" : "topic idea";
      systemPrompt = buildCarouselPrompt(numSlides, audience, tone, topic, keyPoints, painPoints, previousTitles);
      const userMsg = `Generate ${numSlides} slides from this ${label}:\n\n${content}`;
      content = userMsg;
    }

    const userMessage = mode === "product"
      ? `Generate ${numSlides} slides from this product website content:\n\n${content}`
      : content;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const rawText = response.choices[0]?.message?.content ?? "";
    const cleaned = rawText.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    let carousel: CarouselData;
    try {
      carousel = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON. Raw response: " + rawText.slice(0, 300) },
        { status: 500 }
      );
    }

    if (!carousel.slides || carousel.slides.length === 0) {
      return NextResponse.json({ error: "No slides returned." }, { status: 500 });
    }

    return NextResponse.json({ carousel });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
