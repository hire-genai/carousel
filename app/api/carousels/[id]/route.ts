import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const carousel = await prisma.carousel.findFirst({
    where: { id: params.id, userId: session.userId },
  });

  if (!carousel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    carousel: {
      id: carousel.id,
      title: carousel.title,
      slides: JSON.parse(carousel.slides),
      status: carousel.status,
      createdAt: carousel.createdAt,
      updatedAt: carousel.updatedAt,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, slides, status, renderedImages, caption } = await req.json();

  const existing = await prisma.carousel.findFirst({
    where: { id: params.id, userId: session.userId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.carousel.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(slides !== undefined && { slides: JSON.stringify(slides) }),
      ...(status !== undefined && { status }),
      ...(renderedImages !== undefined && { renderedImages: JSON.stringify(renderedImages) }),
      ...(caption !== undefined && { caption }),
    },
  });

  return NextResponse.json({ ok: true, carousel: { id: updated.id, title: updated.title } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.carousel.findFirst({
    where: { id: params.id, userId: session.userId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.carousel.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
