import * as cheerio from "cheerio";

export interface ScannedProduct {
  rawContent: string;
  metaTitle: string;
  metaDescription: string;
}

export async function scanProductWebsite(url: string): Promise<ScannedProduct> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SkygenAI/1.0; +https://skygenai.app)",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Failed to fetch product URL: HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const metaTitle =
    $("title").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    "";
  const metaDescription =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  // Remove non-content elements
  $("script, style, nav, footer, aside, iframe, noscript, svg, head").remove();

  // Extract text from meaningful sections in priority order
  const selectors = [
    "main",
    "article",
    '[role="main"]',
    ".hero",
    ".landing",
    ".features",
    ".benefits",
    ".pricing",
    ".testimonials",
    "section",
    "body",
  ];

  const parts: string[] = [];
  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const t = $(el).text().replace(/\s+/g, " ").trim();
      if (t.length > 100) parts.push(t);
    });
    if (parts.length > 0) break;
  }

  let rawContent = parts.join("\n").replace(/\s+/g, " ").trim().slice(0, 10000);
  if (!rawContent) throw new Error("Could not extract readable content from that URL.");

  const combined = [
    metaTitle ? `Page Title: ${metaTitle}` : "",
    metaDescription ? `Meta Description: ${metaDescription}` : "",
    `\nPage Content:\n${rawContent}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { rawContent: combined, metaTitle, metaDescription };
}
