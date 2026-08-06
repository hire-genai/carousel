import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      linkedinConnected: !!user.linkedinAccount,
      workspaces: user.workspaces,
      linkedin: user.linkedinAccount
        ? {
            displayName: user.linkedinAccount.displayName,
            linkedinUrn: user.linkedinAccount.linkedinUrn,
            connectedAt: user.linkedinAccount.connectedAt,
            expiresAt: user.linkedinAccount.expiresAt,
          }
        : null,
    },
  });
}
