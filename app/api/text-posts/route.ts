import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await prisma.textPost.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, content: true, status: true, scheduledAt: true, publishedAt: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, status = "draft", imageData, scheduledAt } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const post = await prisma.textPost.create({
    data: {
      userId: session.userId,
      content: content.trim(),
      status,
      ...(imageData && { imageData }),
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
    },
  });
  return NextResponse.json({ post }, { status: 201 });
}
