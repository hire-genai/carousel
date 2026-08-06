import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const carousels = await prisma.carousel.findMany({
    where: { userId: session.userId },
    select: { id: true, title: true, slides: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    carousels: carousels.map((c) => {
      let slideCount = 0;
      try { slideCount = JSON.parse(c.slides).length; } catch { /* */ }
      return {
        id: c.id,
        title: c.title,
        slideCount,
        createdAt: c.createdAt.toISOString(),
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, slides, status, renderedImages, caption } = await req.json();

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.userId },
  });

  const carousel = await prisma.carousel.create({
    data: {
      title: title || "Untitled Carousel",
      slides: JSON.stringify(slides),
      status: status || "draft",
      userId: session.userId,
      workspaceId: workspace?.id ?? null,
      ...(renderedImages !== undefined && { renderedImages: JSON.stringify(renderedImages) }),
      ...(caption !== undefined && { caption }),
    },
  });

  return NextResponse.json({ ok: true, id: carousel.id });
}
