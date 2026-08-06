import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, code, mode, next } = await req.json();

    if (!email || !code || typeof email !== "string" || typeof code !== "string") {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const isValid = await verifyOtp(normalized, cleanCode);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired code. Please request a new one." },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({ where: { email: normalized } });
    const isNewUser = !user;

    if (!user) {
      if (mode !== "signup") {
        return NextResponse.json({ error: "Account not found." }, { status: 404 });
      }

      user = await prisma.user.create({
        data: { email: normalized },
      });

      // Create default workspace owned by the new user
      await prisma.workspace.create({
        data: {
          name: normalized.split("@")[0] + "'s Workspace",
          timezone: "Asia/Kolkata",
          ownerId: user.id,
        },
      });
    }

    const token = await createSession({ userId: user.id, email: user.email });
    await setSessionCookie(token);

    // Validate next to prevent open redirect — only allow same-origin paths
    const safeNext =
      next && typeof next === "string" && next.startsWith("/") ? next : "/dashboard";

    return NextResponse.json({
      ok: true,
      isNewUser,
      redirect: safeNext,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
