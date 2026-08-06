import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.linkedinAccount) return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });

    const { images, caption } = await req.json() as { images: string[]; caption: string };
    const { accessToken, linkedinUrn } = user.linkedinAccount;

    const personId = linkedinUrn.split(":").pop();
    const authorUrn = `urn:li:person:${personId}`;

    const assetUrns: string[] = [];
    for (const dataUrl of images) {
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");

      const regRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: authorUrn,
            serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
          },
        }),
      });
      if (!regRes.ok) throw new Error(`Register failed: ${regRes.status}`);

      const regData = await regRes.json() as { value: { uploadMechanism: { "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": { uploadUrl: string } }; asset: string } };
      const uploadUrl = regData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
      const asset = regData.value.asset;

      const upRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "image/png" },
        body: new Uint8Array(buffer),
      });
      if (!upRes.ok) throw new Error(`Upload failed: ${upRes.status}`);
      assetUrns.push(asset);
    }

    const media = assetUrns.map((urn, i) => ({ status: "READY", description: { text: `Slide ${i + 1}` }, media: urn, title: { text: "SkygenAI Carousel" } }));

    const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: caption },
            shareMediaCategory: assetUrns.length > 0 ? "IMAGE" : "NONE",
            ...(assetUrns.length > 0 ? { media } : {}),
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      return NextResponse.json({ error: `LinkedIn error: ${postRes.status} ${errText}` }, { status: 502 });
    }

    const postData = await postRes.json() as { id?: string };
    return NextResponse.json({ ok: true, postId: postData.id ?? "" });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
