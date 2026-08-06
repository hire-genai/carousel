import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import crypto from "crypto";

// POST /api/teams/invite — send an invite to a collaborator by email
export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, role } = body as { email?: string; role?: string };

  if (!email || !["editor", "viewer"].includes(role ?? "")) {
    return NextResponse.json({ error: "email and a valid role (editor|viewer) are required" }, { status: 400 });
  }

  // Get the current user's first owned workspace
  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.userId },
  });

  if (!workspace) {
    return NextResponse.json({ error: "No workspace found for this account" }, { status: 404 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.teamInvite.create({
    data: {
      workspaceId: workspace.id,
      email: email.toLowerCase().trim(),
      role: role!,
      token,
      invitedById: session.userId,
      expiresAt,
    },
  });

  const inviteUrl = `${process.env.APP_URL}/join/${token}`;

  if (process.env.NODE_ENV === "development") {
    console.log("[TeamInvite] Invite URL:", inviteUrl);
  }

  return NextResponse.json({ ok: true, inviteUrl });
}

// DELETE /api/teams/invite — revoke a pending invite
// Body: { inviteId: string }
export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { inviteId } = body as { inviteId?: string };

  if (!inviteId) {
    return NextResponse.json({ error: "inviteId is required" }, { status: 400 });
  }

  // Only allow revoking invites from workspaces the caller owns
  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.userId },
  });

  if (!workspace) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  }

  const invite = await prisma.teamInvite.findFirst({
    where: { id: inviteId, workspaceId: workspace.id },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  await prisma.teamInvite.delete({ where: { id: inviteId } });

  return NextResponse.json({ ok: true });
}
