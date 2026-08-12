import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOtp, deliverOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { email, mode } = await req.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    const purpose = mode === "signup" ? "signup" : "login";

    const existing = await prisma.user.findUnique({ where: { email: normalized } });

    if (purpose === "signup" && existing) {
      return NextResponse.json(
        { error: "Account already exists. Please log in instead." },
        { status: 400 }
      );
    }
    if (purpose === "login" && !existing) {
      return NextResponse.json(
        { error: "No account found. Please sign up first." },
        { status: 404 }
      );
    }

    const code = await createOtp(normalized, purpose);
    await deliverOtp(normalized, code, purpose);

    // In dev, return the OTP in the response so the user can test easily.
    // Remove this in production.
    return NextResponse.json({
      ok: true,
      email: normalized,
      purpose,
      devOtp: process.env.NODE_ENV !== "production" ? code : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
