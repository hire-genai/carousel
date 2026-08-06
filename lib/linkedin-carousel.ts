import { Slide } from "./types";

interface LinkedInAccount {
  accessToken: string;
  linkedinUrn: string;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function postCarouselToLinkedIn(
  carousel: { title: string; slides: Slide[]; renderedImages?: string[]; caption?: string },
  account: LinkedInAccount,
  autoComment?: string
): Promise<{ postId: string; error?: string }> {
  try {
    const slides = carousel.slides.slice(0, 9); // LinkedIn image carousel max 9

    // 1. Upload images — use pre-rendered PNGs if available, otherwise build from SVG
    let assetUrns: string[] = [];
    if (carousel.renderedImages && carousel.renderedImages.length > 0) {
      // Scheduled carousel: use the exact images saved at "complete" time.
      // If upload fails, throw — do NOT fall back to text. Let cron mark as failed
      // so the user sees it in the dashboard and can retry via Publish Now.
      for (const dataUrl of carousel.renderedImages.slice(0, 9)) {
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64, "base64");
        const urn = await registerAndUpload(buffer, account.accessToken, account.linkedinUrn);
        assetUrns.push(urn);
      }
    } else {
      // No pre-rendered images (legacy flow) — build from SVG, fall back to text on error
      try {
        assetUrns = await uploadSlideImages(slides, account.accessToken, account.linkedinUrn);
      } catch (e) {
        console.log("[LinkedIn] SVG image upload failed, falling back to text post:", e);
      }
    }

    // 2. Post — image carousel if we got URNs, text-only fallback otherwise
    const postCaption = carousel.caption || `📌 ${carousel.title}\n\n#LinkedIn #SkygenAI`;
    const response = assetUrns.length > 0
      ? await postImageCarousel(carousel.title, postCaption, assetUrns, account)
      : await postTextOnly(carousel, slides, postCaption, account);

    if (!response.ok) {
      const error = await response.text();
      return { postId: "", error: `LinkedIn API error: ${response.status} ${error}` };
    }

    const data = (await response.json()) as { id?: string };
    const postId = data.id || "";

    // 3. Auto-comment (unchanged)
    if (autoComment && postId) {
      await postComment(account.accessToken, postId, autoComment).catch(() => {});
    }

    return { postId };
  } catch (e) {
    return { postId: "", error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ─── Image upload pipeline ────────────────────────────────────────────────────

async function uploadSlideImages(slides: Slide[], accessToken: string, userUrn: string): Promise<string[]> {
  const sharp = (await import("sharp")).default;
  const urns: string[] = [];

  for (const slide of slides) {
    const svg = buildSlideSvg(slide);
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const urn = await registerAndUpload(pngBuffer, accessToken, userUrn);
    urns.push(urn);
  }

  return urns;
}

async function registerAndUpload(pngBuffer: Buffer, accessToken: string, userUrn: string): Promise<string> {
  // Step A: Register upload
  const registerRes = await fetch(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: userUrn,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    }
  );

  if (!registerRes.ok) {
    const err = await registerRes.text();
    throw new Error(`Register upload failed: ${registerRes.status} ${err}`);
  }

  const registerData = (await registerRes.json()) as {
    value: { uploadMechanism: { "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": { uploadUrl: string } }; asset: string };
  };

  const uploadUrl =
    registerData.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl;
  const asset = registerData.value.asset;

  // Step B: Upload binary
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/png",
    },
    body: new Uint8Array(pngBuffer),
  });

  if (!uploadRes.ok) {
    throw new Error(`Image upload PUT failed: ${uploadRes.status}`);
  }

  return asset; // e.g. "urn:li:digitalmediaAsset:C5622AQF..."
}

// ─── Post builders ────────────────────────────────────────────────────────────

function postImageCarousel(
  title: string,
  caption: string,
  assetUrns: string[],
  account: LinkedInAccount
): Promise<Response> {
  const media = assetUrns.map((urn, i) => ({
    status: "READY",
    description: { text: `Slide ${i + 1}` },
    media: urn,
    title: { text: title },
  }));

  return fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: account.linkedinUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: "IMAGE",
          media,
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
}

function postTextOnly(
  carousel: { title: string; slides: Slide[] },
  slides: Slide[],
  caption: string,
  account: LinkedInAccount
): Promise<Response> {
  return fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: account.linkedinUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
}

// ─── SVG slide renderer ───────────────────────────────────────────────────────

function buildSlideSvg(slide: Slide): string {
  const design = slide.design;
  const headlineSize = design?.headlineSize ?? "3xl";
  const bodySize = design?.bodySize ?? "base";
  const headlineFontSize = ({ lg: 52, xl: 64, "2xl": 80, "3xl": 96 } as Record<string, number>)[headlineSize] ?? 96;
  const bodyFontSize = ({ xs: 28, sm: 32, base: 36 } as Record<string, number>)[bodySize] ?? 36;

  // Parse gradient colors from CSS gradient string
  const [c1, c2] = parseGradientColors(design?.bgGradient);

  // Word-wrap text into lines
  const headlineLines = wrapText(slide.headline || "", 22);
  const bodyLines = wrapText(slide.body || "", 38);

  const headlineY = 500;
  const bodyY = headlineY + headlineLines.length * (headlineFontSize * 1.3) + 60;

  const headlineSvg = headlineLines
    .map((line, i) => `<text x="540" y="${headlineY + i * headlineFontSize * 1.3}" font-size="${headlineFontSize}" font-weight="900" fill="white" text-anchor="middle" font-family="Arial, sans-serif">${x(line)}</text>`)
    .join("\n");

  const bodySvg = bodyLines
    .map((line, i) => `<text x="540" y="${bodyY + i * bodyFontSize * 1.4}" font-size="${bodyFontSize}" fill="white" opacity="0.88" text-anchor="middle" font-family="Arial, sans-serif">${x(line)}</text>`)
    .join("\n");

  return `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect x="60" y="60" width="960" height="960" rx="32" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
  ${headlineSvg}
  ${bodySvg}
  <text x="540" y="1300" font-size="28" fill="white" opacity="0.4" text-anchor="middle" font-family="Arial, sans-serif">SkygenAI</text>
</svg>`;
}

function parseGradientColors(gradient?: string): [string, string] {
  if (!gradient) return ["#2563EB", "#4F46E5"];
  const matches = gradient.match(/#[0-9a-fA-F]{3,6}/g);
  if (matches && matches.length >= 2) return [matches[0], matches[1]];
  return ["#2563EB", "#4F46E5"];
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 4); // max 4 lines
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function postComment(accessToken: string, postId: string, text: string): Promise<void> {
  await fetch("https://api.linkedin.com/v2/comments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({ object: postId, message: { text } }),
  });
}

function x(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
