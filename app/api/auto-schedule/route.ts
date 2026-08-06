import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [config, queueCarousels, queueTextPosts, nextPost] = await Promise.all([
    prisma.autoScheduleConfig.findUnique({ where: { userId: session.userId } }),
    prisma.carousel.count({
      where: {
        userId: session.userId,
        status: "complete",
        scheduledPosts: { none: { isAutoScheduled: true, status: { in: ["scheduled", "posted"] } } },
      },
    }),
    prisma.textPost.count({
      where: { userId: session.userId, status: "complete", isAutoScheduled: false },
    }),
    prisma.scheduledPost.findFirst({
      where: {
        userId: session.userId,
        isAutoScheduled: true,
        status: "scheduled",
        scheduledAt: { gt: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      select: { scheduledAt: true },
    }),
  ]);

  return NextResponse.json({
    config: config
      ? { enabled: config.enabled, postsPerDay: config.postsPerDay }
      : { enabled: false, postsPerDay: 1 },
    queueCount: queueCarousels + queueTextPosts,
    nextPublishAt: nextPost?.scheduledAt.toISOString() ?? null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { enabled?: boolean; postsPerDay?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { enabled, postsPerDay } = body;

  if (
    typeof enabled !== "boolean" ||
    typeof postsPerDay !== "number" ||
    postsPerDay < 1 ||
    postsPerDay > 20
  ) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const config = await prisma.autoScheduleConfig.upsert({
    where: { userId: session.userId },
    update: { enabled, postsPerDay },
    create: { userId: session.userId, enabled, postsPerDay },
  });

  return NextResponse.json({ config: { enabled: config.enabled, postsPerDay: config.postsPerDay } });
}
