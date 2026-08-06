import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "high" },
            },
            {
              type: "text",
              text: `This is a portrait slide image (540px wide × 675px tall).

Identify ALL visible text elements in the image. For each text element return:
- "text": exact text content (multi-line text should have \\n between lines)
- "x": left edge in pixels (0–540)
- "y": top edge in pixels (0–675)
- "w": width in pixels
- "h": height in pixels
- "fontSize": estimated font size in pixels
- "bold": true or false
- "italic": true or false
- "color": text color as hex "#rrggbb"
- "bgColor": background color directly behind the text as hex "#rrggbb" (use "transparent" if on a photo/image with no solid bg)
- "textAlign": "left", "center", or "right"
- "fontFamily": closest from: "Inter", "Georgia", "Playfair Display", "Montserrat", "Arial", "Raleway"

Rules:
- Be as accurate as possible with positions
- Include ALL text, including small labels, captions, watermarks
- Return ONLY a valid JSON array, nothing else, no markdown fences
- If no text is found, return []

Example output format:
[{"text":"Hello World","x":40,"y":120,"w":300,"h":60,"fontSize":40,"bold":true,"italic":false,"color":"#ffffff","bgColor":"transparent","textAlign":"left","fontFamily":"Inter"}]`,
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "[]";

    // Strip markdown fences if model added them
    const cleaned = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    let elements: unknown[] = [];
    try {
      elements = JSON.parse(cleaned);
      if (!Array.isArray(elements)) elements = [];
    } catch {
      elements = [];
    }

    return NextResponse.json({ elements });
  } catch (err) {
    console.error("[detect-template-text]", err);
    return NextResponse.json({ elements: [] }, { status: 500 });
  }
}
