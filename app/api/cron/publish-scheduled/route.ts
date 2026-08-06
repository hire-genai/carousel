import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postCarouselToLinkedIn } from "@/lib/linkedin-carousel";
import type { Slide } from "@/lib/types";

// ── Time windows (minutes since midnight) ────────────────────────────────────
const WINDOWS = [
  [8 * 60, 11 * 60],   // 08:00–11:00
  [12 * 60, 15 * 60],  // 12:00–15:00
  [17 * 60, 20 * 60],  // 17:00–20:00
] as const;

/**
 * Generates `count` random publish times starting from `now`, spread across
 * morning/afternoon/evening windows. If all windows for today are past, spills
 * into tomorrow (and beyond) cycling through the same windows.
 */
function generateSlotTimes(count: number, now: Date): Date[] {
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const times: Date[] = [];
  let dayOffset = 0;

  while (times.length < count) {
    const dayWindows =
      dayOffset === 0
        ? WINDOWS.filter(([, end]) => nowMins < end)
        : [...WINDOWS];

    if (dayWindows.length === 0) {
      dayOffset++;
      continue;
    }

    for (const [start, end] of dayWindows) {
      if (times.length >= count) break;
      const from = dayOffset === 0 ? Math.max(start, nowMins + 5) : start;
      if (from >= end) continue;
      const mins = from + Math.floor(Math.random() * (end - from));
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      times.push(d);
    }

    dayOffset++;
  }

  return times.sort((a, b) => a.getTime() - b.getTime());
}

// ── Text post publisher (unchanged from before) ───────────────────────────────
async function publishTextPost(
  postId: string,
  content: string,
  imageData: string | null,
  accessToken: string,
  userUrn: string
) {
  let assetUrn: string | null = null;
  if (imageData) {
    const base64 = imageData.split(",")[1];
    if (base64) {
      const buffer = Buffer.from(base64, "base64");
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
      if (registerRes.ok) {
        const rd = await registerRes.json();
        const uploadUrl =
          rd.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
        assetUrn = rd.value?.asset ?? null;
        if (uploadUrl) {
          await fetch(uploadUrl, {
            method: "PUT",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "image/jpeg" },
            body: new Uint8Array(buffer),
          });
        }
      }
    }
  }

  const shareContent = assetUrn
    ? { shareCommentary: { text: content }, shareMediaCategory: "IMAGE", media: [{ status: "READY", media: assetUrn }] }
    : { shareCommentary: { text: content }, shareMediaCategory: "NONE" };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: userUrn,
      lifecycleState: "PUBLISHED",
      specificContent: { "com.linkedin.ugc.ShareContent": shareContent },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`LinkedIn error: ${text}`);

  const liPostId = res.headers.get("x-restli-id") ?? null;
  await prisma.textPost.update({
    where: { id: postId },
    data: { status: "published", publishedAt: new Date(), linkedinPostId: liPostId },
  });
}

// ── Auto-schedule slot generation ────────────────────────────────────────────
async function processAutoSchedule(now: Date): Promise<number> {
  let totalScheduled = 0;

  const autoConfigs = await prisma.autoScheduleConfig.findMany({
    where: { enabled: true },
  });

  if (autoConfigs.length === 0) return totalScheduled;

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  for (const cfg of autoConfigs) {
    try {
      // BUG FIX: Only count ACTIVE (non-failed) auto-scheduled slots for today.
      // Previously, failed posts also counted toward the daily limit, blocking new scheduling.
      const [todayCarouselSlots, todayTextSlots] = await Promise.all([
        prisma.scheduledPost.count({
          where: {
            userId: cfg.userId,
            isAutoScheduled: true,
            status: { in: ["scheduled", "posted"] },
            scheduledAt: { gte: todayStart, lte: todayEnd },
          },
        }),
        prisma.textPost.count({
          where: {
            userId: cfg.userId,
            isAutoScheduled: true,
            status: { in: ["scheduled", "posted"] },
            scheduledAt: { gte: todayStart, lte: todayEnd },
          },
        }),
      ]);

      const remaining = cfg.postsPerDay - todayCarouselSlots - todayTextSlots;

      console.log(`[AutoSchedule] user=${cfg.userId} postsPerDay=${cfg.postsPerDay} todaySlots=${todayCarouselSlots + todayTextSlots} remaining=${remaining}`);

      if (remaining <= 0) {
        console.log(`[AutoSchedule] user=${cfg.userId}: daily quota full, skipping`);
        continue;
      }

      // FIFO queue: find eligible carousels and text posts.
      //
      // Carousel eligibility:
      //   - status="complete" (not yet scheduled or published)
      //   - No ACTIVE auto-scheduled ScheduledPost exists (prevents duplicates).
      //     "active" = status in [scheduled, posted].
      //     Failed auto-scheduled posts are excluded from this check — the carousel
      //     can be re-tried on the next cycle.
      //
      // BUG FIX: Previously there was no transaction wrapping the create+update pair.
      // If the ScheduledPost was created but the Carousel status update failed, the carousel
      // was left in status="complete" with an orphaned ScheduledPost (isAutoScheduled=true,
      // status="scheduled"). The none-filter then permanently excluded it.
      // Now we use a transaction so both succeed or both roll back.
      const [qCarousels, qTextPosts] = await Promise.all([
        prisma.carousel.findMany({
          where: {
            userId: cfg.userId,
            status: "complete",
            scheduledPosts: {
              none: { isAutoScheduled: true, status: { in: ["scheduled", "posted"] } },
            },
          },
          orderBy: { updatedAt: "asc" },
          take: remaining,
        }),
        prisma.textPost.findMany({
          where: {
            userId: cfg.userId,
            status: "complete",
            isAutoScheduled: false,
          },
          orderBy: { updatedAt: "asc" },
          take: remaining,
        }),
      ]);

      console.log(`[AutoSchedule] eligible carousels=${qCarousels.length} textPosts=${qTextPosts.length}`);

      type QItem = { type: "carousel" | "textpost"; id: string; updatedAt: Date };
      const queue: QItem[] = [
        ...qCarousels.map((c) => ({ type: "carousel" as const, id: c.id, updatedAt: c.updatedAt })),
        ...qTextPosts.map((p) => ({ type: "textpost" as const, id: p.id, updatedAt: p.updatedAt })),
      ]
        .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
        .slice(0, remaining);

      if (queue.length === 0) {
        console.log(`[AutoSchedule] user=${cfg.userId}: no eligible posts in queue`);
        continue;
      }

      const times = generateSlotTimes(queue.length, now);

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        const scheduledAt = times[i];
        try {
          if (item.type === "carousel") {
            // BUG FIX: Use a transaction so ScheduledPost.create and Carousel.update
            // are atomic. Previously, if the update failed after the create succeeded,
            // the carousel was stuck in "complete" status forever with an orphaned
            // ScheduledPost that caused the none-filter to exclude it permanently.
            await prisma.$transaction([
              prisma.scheduledPost.create({
                data: { carouselId: item.id, userId: cfg.userId, scheduledAt, isAutoScheduled: true },
              }),
              prisma.carousel.update({
                where: { id: item.id },
                data: { status: "scheduled" },
              }),
            ]);
          } else {
            await prisma.textPost.update({
              where: { id: item.id },
              data: { status: "scheduled", scheduledAt, isAutoScheduled: true },
            });
          }
          console.log(`[AutoSchedule] Queued ${item.type} ${item.id} for ${scheduledAt.toISOString()}`);
          totalScheduled++;
        } catch (e) {
          console.error(`[AutoSchedule] Failed to queue ${item.type} ${item.id}:`, e);
        }
      }
    } catch (e) {
      console.error(`[AutoSchedule] Error processing user ${cfg.userId}:`, e);
    }
  }

  return totalScheduled;
}

// ── Main cron handler ─────────────────────────────────────────────────────────
export async function POST() {
  try {
    const now = new Date();
    console.log(`[Cron] Checking scheduled posts at ${now.toISOString()}`);

    // ── 1. Publish due carousel posts ──
    const dueCarousels = await prisma.scheduledPost.findMany({
      where: { status: "scheduled", scheduledAt: { lte: now } },
      include: { carousel: true, user: { include: { linkedinAccount: true } } },
    });

    // ── 2. Publish due text posts ──
    const dueTextPosts = await prisma.textPost.findMany({
      where: { status: "scheduled", scheduledAt: { lte: now } },
      include: { user: { include: { linkedinAccount: true } } },
    });

    console.log(`[Cron] ${dueCarousels.length} carousel(s), ${dueTextPosts.length} text post(s) due`);

    let published = 0;
    let failed = 0;

    for (const post of dueCarousels) {
      try {
        if (!post.user.linkedinAccount) throw new Error("LinkedIn account disconnected");

        const slidesData = JSON.parse(post.carousel.slides) as Slide[];
        const renderedImages = post.carousel.renderedImages
          ? (JSON.parse(post.carousel.renderedImages) as string[])
          : undefined;
        const result = await postCarouselToLinkedIn(
          {
            title: post.carousel.title,
            slides: slidesData,
            renderedImages,
            caption: post.carousel.caption || undefined,
          },
          { accessToken: post.user.linkedinAccount.accessToken, linkedinUrn: post.user.linkedinAccount.linkedinUrn },
          post.autoComment || undefined
        );
        if (result.error) throw new Error(result.error);

        await prisma.$transaction([
          prisma.scheduledPost.update({
            where: { id: post.id },
            data: { status: "posted", linkedinPostId: result.postId || null },
          }),
          prisma.carousel.update({
            where: { id: post.carousel.id },
            data: { status: "published" },
          }),
        ]);
        published++;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        await prisma.scheduledPost.update({ where: { id: post.id }, data: { status: "failed", errorMsg } });
        console.error(`[Cron] Carousel ${post.id} failed: ${errorMsg}`);
        failed++;
      }
    }

    for (const post of dueTextPosts) {
      try {
        if (!post.user.linkedinAccount) throw new Error("LinkedIn account disconnected");
        await publishTextPost(
          post.id,
          post.content,
          post.imageData,
          post.user.linkedinAccount.accessToken,
          post.user.linkedinAccount.linkedinUrn
        );
        published++;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        await prisma.textPost.update({ where: { id: post.id }, data: { status: "failed", errorMsg } });
        console.error(`[Cron] TextPost ${post.id} failed: ${errorMsg}`);
        failed++;
      }
    }

    // ── 3. Generate new auto-schedule slots for today ──
    const autoScheduled = await processAutoSchedule(now);

    return NextResponse.json({ published, failed, total: dueCarousels.length + dueTextPosts.length, autoScheduled });
  } catch (e) {
    console.error("Cron error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Cron failed" }, { status: 500 });
  }
}
