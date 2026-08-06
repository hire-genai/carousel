import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function uploadImageToLinkedIn(
  imageDataUrl: string,
  accessToken: string,
  userUrn: string
): Promise<string | null> {
  // Strip base64 header
  const base64 = imageDataUrl.split(",")[1];
  if (!base64) return null;
  const buffer = Buffer.from(base64, "base64");

  // 1. Register upload
  const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
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
        serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
      },
    }),
  });

  if (!registerRes.ok) {
    const t = await registerRes.text();
    console.error("[TextPost publish] registerUpload failed:", t);
    return null;
  }

  const registerData = await registerRes.json();
  const uploadUrl: string = registerData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
  const assetUrn: string = registerData.value?.asset;
  if (!uploadUrl || !assetUrn) return null;

  // 2. Upload binary
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/jpeg",
    },
    body: new Uint8Array(buffer),
  });

  if (!uploadRes.ok) {
    console.error("[TextPost publish] binary upload failed:", uploadRes.status);
    return null;
  }

  return assetUrn;
}

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.textPost.findFirst({ where: { id: params.id, userId: session.userId } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const account = await prisma.linkedInAccount.findUnique({ where: { userId: session.userId } });
  if (!account) return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
  if (new Date(account.expiresAt) < new Date()) {
    return NextResponse.json({ error: "LinkedIn token expired. Reconnect in Settings." }, { status: 401 });
  }

  try {
    // Upload image if present
    let assetUrn: string | null = null;
    if (post.imageData) {
      assetUrn = await uploadImageToLinkedIn(post.imageData, account.accessToken, account.linkedinUrn);
    }

    // Build UGC post body
    const shareContent = assetUrn
      ? {
          shareCommentary: { text: post.content },
          shareMediaCategory: "IMAGE",
          media: [{ status: "READY", media: assetUrn }],
        }
      : {
          shareCommentary: { text: post.content },
          shareMediaCategory: "NONE",
        };

    const body = {
      author: account.linkedinUrn,
      lifecycleState: "PUBLISHED",
      specificContent: { "com.linkedin.ugc.ShareContent": shareContent },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      await prisma.textPost.update({ where: { id: params.id }, data: { status: "failed", errorMsg: text } });
      return NextResponse.json({ error: `LinkedIn error: ${text}` }, { status: 502 });
    }

    const liPostId = res.headers.get("x-restli-id") ?? null;
    await prisma.textPost.update({
      where: { id: params.id },
      data: { status: "published", publishedAt: new Date(), linkedinPostId: liPostId },
    });
    return NextResponse.json({ ok: true, linkedinPostId: liPostId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await prisma.textPost.update({ where: { id: params.id }, data: { status: "failed", errorMsg: msg } });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
