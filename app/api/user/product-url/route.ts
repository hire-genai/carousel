import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { productWebsiteUrl: true },
  });

  return NextResponse.json({ productWebsiteUrl: user?.productWebsiteUrl ?? null });
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productWebsiteUrl } = await req.json();

  if (productWebsiteUrl !== null && typeof productWebsiteUrl !== "string") {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { productWebsiteUrl: productWebsiteUrl || null },
  });

  return NextResponse.json({ ok: true });
}
