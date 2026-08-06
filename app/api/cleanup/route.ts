import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { carouselIds } = body as { carouselIds: string[] };

  if (!Array.isArray(carouselIds) || carouselIds.length === 0) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
  }

  const deleted = await prisma.carousel.deleteMany({
    where: {
      userId: session.userId,
      id: { in: carouselIds },
    },
  });

  return NextResponse.json({ ok: true, deleted: deleted.count });
}

