import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let brandKit = await prisma.brandKit.findUnique({
    where: { userId: session.userId },
  });

  if (!brandKit) {
    brandKit = await prisma.brandKit.create({
      data: { userId: session.userId },
    });
  }

  return NextResponse.json({
    brandKit: {
      logoData: brandKit.logoData,
      colors: JSON.parse(brandKit.colors) as string[],
      headingFont: brandKit.headingFont,
      bodyFont: brandKit.bodyFont,
      accentColor: brandKit.accentColor,
    },
  });
}

export async function PUT(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { logoData, colors, headingFont, bodyFont, accentColor } = body as {
    logoData?: string | null;
    colors?: string[];
    headingFont?: string;
    bodyFont?: string;
    accentColor?: string;
  };

  const brandKit = await prisma.brandKit.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      ...(logoData !== undefined && { logoData }),
      ...(colors !== undefined && { colors: JSON.stringify(colors) }),
      ...(headingFont !== undefined && { headingFont }),
      ...(bodyFont !== undefined && { bodyFont }),
      ...(accentColor !== undefined && { accentColor }),
    },
    update: {
      ...(logoData !== undefined && { logoData }),
      ...(colors !== undefined && { colors: JSON.stringify(colors) }),
      ...(headingFont !== undefined && { headingFont }),
      ...(bodyFont !== undefined && { bodyFont }),
      ...(accentColor !== undefined && { accentColor }),
    },
  });

  return NextResponse.json({
    ok: true,
    brandKit: {
      logoData: brandKit.logoData,
      colors: JSON.parse(brandKit.colors) as string[],
      headingFont: brandKit.headingFont,
      bodyFont: brandKit.bodyFont,
      accentColor: brandKit.accentColor,
    },
  });
}
