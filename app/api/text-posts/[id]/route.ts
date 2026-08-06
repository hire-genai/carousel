import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.textPost.findFirst({ where: { id: params.id, userId: session.userId } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { content, status, imageData, scheduledAt } = await req.json();
  const updated = await prisma.textPost.update({
    where: { id: params.id },
    data: {
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
      ...(imageData !== undefined && { imageData }),
      ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
    },
  });
  return NextResponse.json({ post: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.textPost.findFirst({ where: { id: params.id, userId: session.userId } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.textPost.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
