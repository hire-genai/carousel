import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.scheduledPost.findFirst({
    where: { id: params.id, userId: session.userId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.scheduledPost.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.scheduledPost.findFirst({
    where: { id: params.id, userId: session.userId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { scheduledAt?: string; autoComment?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { scheduledAt, autoComment } = body;

  if (scheduledAt !== undefined) {
    const d = new Date(scheduledAt);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "scheduledAt must be a valid ISO date string" }, { status: 400 });
    }
  }

  const updated = await prisma.scheduledPost.update({
    where: { id: params.id },
    data: {
      ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
      ...(autoComment !== undefined && { autoComment }),
    },
    include: { carousel: { select: { id: true, title: true } } },
  });

  return NextResponse.json({ ok: true, post: updated });
}
