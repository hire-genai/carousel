import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import InviteAcceptClient from "./InviteAcceptClient";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const invite = await prisma.teamInvite.findUnique({
    where: { token: params.token },
    include: {
      workspace: { include: { owner: { select: { email: true, name: true } } } },
    },
  });

  const user = await getCurrentUser();

  if (!invite) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-5">🔗</div>
          <h1 className="text-2xl font-black text-white mb-3">Invalid Invite Link</h1>
          <p className="text-white/40 text-sm">
            This invite link doesn&apos;t exist or has already been revoked.
          </p>
          <a
            href="/"
            className="mt-6 inline-block px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition"
          >
            Go to SkygenAI
          </a>
        </div>
      </div>
    );
  }

  const expired = invite.expiresAt < new Date();
  const used = invite.status !== "pending";

  if (expired || used) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-5">{used ? "✅" : "⏰"}</div>
          <h1 className="text-2xl font-black text-white mb-3">
            {used ? "Invite Already Used" : "Invite Expired"}
          </h1>
          <p className="text-white/40 text-sm">
            {used
              ? "This invite link has already been accepted."
              : "This invite link expired. Ask your team owner to send a new one."}
          </p>
          {user ? (
            <a
              href="/dashboard"
              className="mt-6 inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
            >
              Go to Dashboard
            </a>
          ) : (
            <a
              href="/login"
              className="mt-6 inline-block px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition"
            >
              Log in
            </a>
          )}
        </div>
      </div>
    );
  }

  const ownerEmail = invite.workspace.owner.email;
  const ownerName = invite.workspace.owner.name ?? ownerEmail;
  const workspaceName = invite.workspace.name ?? "a workspace";

  return (
    <InviteAcceptClient
      token={params.token}
      inviteEmail={invite.email}
      invitedBy={ownerName}
      workspaceName={workspaceName}
      role={invite.role}
      isLoggedIn={!!user}
      currentUserEmail={user?.email ?? null}
    />
  );
}
