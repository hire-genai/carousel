import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { YoutubeTranscript } from "youtube-transcript";

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

async function fetchYouTubeTranscript(url: string): Promise<string> {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Could not extract YouTube video ID from URL.");

  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  if (!transcript || transcript.length === 0) {
    throw new Error("No transcript available for this video.");
  }

  const text = transcript
    .map((t) => t.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // Truncate to ~8000 chars to keep Claude context reasonable
  return text.slice(0, 8000);
}

async function fetchArticleText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CarouselBot/1.0; +https://skygenai.app)",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Failed to fetch URL: HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, footer, header, aside, iframe, noscript").remove();

  // Prefer article/main content areas
  const candidates = ["article", "main", "[role=main]", ".post-content", ".entry-content", ".article-body", "body"];
  let text = "";
  for (const sel of candidates) {
    const t = $(sel).first().text();
    if (t && t.trim().length > 200) {
      text = t;
      break;
    }
  }

  text = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  if (!text) throw new Error("Could not extract readable text from that URL.");
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const { url, mode } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    let content: string;

    if (mode === "youtube") {
      content = await fetchYouTubeTranscript(url);
    } else {
      content = await fetchArticleText(url);
    }

    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
