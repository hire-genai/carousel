import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

interface PostBody {
  title: string;
  slides: Array<{ headline: string; body: string }>;
  includeSlides?: boolean;
  authorUrn?: string; // optional: urn:li:organization:xxx to post as a page
}

function buildPostText(title: string, slides: Array<{ headline: string; body: string }>, includeSlides: boolean): string {
  const lines: string[] = [];

  lines.push(`🎯 ${title}`);

  if (includeSlides && slides.length > 0) {
    lines.push("");
    for (const slide of slides) {
      lines.push(`→ ${slide.headline}`);
    }
  }

  lines.push("");
  lines.push("#LinkedIn #carousel #SkygenAI");

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.linkedinAccount) {
      return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
    }

    const body: PostBody = await req.json();
    const { title, slides, includeSlides = true, authorUrn: requestedUrn } = body;

    if (!title || !Array.isArray(slides)) {
      return NextResponse.json({ error: "Missing required fields: title and slides" }, { status: 400 });
    }

    const { accessToken, linkedinUrn } = user.linkedinAccount;

    if (!accessToken || !linkedinUrn) {
      return NextResponse.json({ error: "LinkedIn account data incomplete" }, { status: 400 });
    }

    const postText = buildPostText(title, slides, includeSlides);

    // Use requested URN if it's an org URN (page post), otherwise fall back to personal
    const personId = linkedinUrn.split(":").pop();
    const personalUrn = `urn:li:person:${personId}`;
    const authorUrn =
      requestedUrn && requestedUrn.startsWith("urn:li:organization:")
        ? requestedUrn
        : personalUrn;

    const ugcPayload = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: postText },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const liRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(ugcPayload),
    });

    if (!liRes.ok) {
      const errorText = await liRes.text();
      console.error("LinkedIn API error:", liRes.status, errorText);
      return NextResponse.json(
        { error: `LinkedIn API error: ${liRes.status}` },
        { status: 502 }
      );
    }

    const liData = await liRes.json();

    // The response header or body contains the post ID
    // LinkedIn returns it in the "id" field or the "X-RestLi-Id" header
    const postId: string =
      liData.id ??
      liRes.headers.get("x-restli-id") ??
      liRes.headers.get("X-RestLi-Id") ??
      "";

    return NextResponse.json({ ok: true, postId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/linkedin/post error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
