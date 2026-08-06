import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

// POST /api/teams/invite/[token] — accept a pending invite
// No auth required; the token is proof of invitation.
export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const invite = await prisma.teamInvite.findUnique({
    where: { token: params.token },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 400 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 400 });
  }

  // Get or create a user record for the invited email
  let user = await prisma.user.findUnique({ where: { email: invite.email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: invite.email },
    });
  }

  // Add as a workspace member (upsert to avoid duplicate errors)
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: invite.workspaceId,
        userId: user.id,
      },
    },
    create: {
      workspaceId: invite.workspaceId,
      userId: user.id,
      role: invite.role,
    },
    update: {}, // already a member — leave role unchanged
  });

  // Mark invite as accepted
  await prisma.teamInvite.update({
    where: { id: invite.id },
    data: { status: "accepted" },
  });

  return NextResponse.json({ ok: true, workspaceId: invite.workspaceId });
}

// DELETE /api/teams/invite/[token] — remove a workspace member
// Repurposes the dynamic segment as a WorkspaceMember id.
// Requires auth; caller must own the workspace.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = params.token; // segment used as WorkspaceMember.id

  // Verify the member belongs to a workspace the caller owns
  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.userId },
  });

  if (!workspace) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId: workspace.id },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });

  return NextResponse.json({ ok: true });
}
