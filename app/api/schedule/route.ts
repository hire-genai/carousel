import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await prisma.scheduledPost.findMany({
    where: { userId: session.userId },
    include: { carousel: { select: { id: true, title: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { carouselId?: string; scheduledAt?: string; autoComment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { carouselId, scheduledAt, autoComment } = body;

  if (!carouselId || !scheduledAt) {
    return NextResponse.json(
      { error: "carouselId and scheduledAt are required" },
      { status: 400 }
    );
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return NextResponse.json({ error: "scheduledAt must be a valid ISO date string" }, { status: 400 });
  }

  // Verify the carousel belongs to this user
  const carousel = await prisma.carousel.findFirst({
    where: { id: carouselId, userId: session.userId },
  });
  if (!carousel) {
    return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
  }

  const post = await prisma.scheduledPost.create({
    data: {
      carouselId,
      userId: session.userId,
      scheduledAt: scheduledDate,
      autoComment: autoComment ?? null,
    },
    include: { carousel: { select: { id: true, title: true } } },
  });

  await prisma.carousel.update({
    where: { id: carouselId },
    data: { status: "scheduled" },
  });

  return NextResponse.json({ ok: true, post }, { status: 201 });
}
