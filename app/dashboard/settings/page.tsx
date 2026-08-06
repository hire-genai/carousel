import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LinkedInPanel from "./LinkedInPanel";
import TeamPanel from "./TeamPanel";
import ProductPanel from "./ProductPanel";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ linkedin?: string; linkedin_error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;

  // Fetch team data for the first workspace the user owns
  const workspace = user.workspaces[0] ?? null;

  const [members, pendingInvites] = workspace
    ? await Promise.all([
        prisma.workspaceMember.findMany({
          where: { workspaceId: workspace.id },
          include: { user: true },
          orderBy: { joinedAt: "asc" },
        }),
        prisma.teamInvite.findMany({
          where: { workspaceId: workspace.id, status: "pending" },
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], []];

  const memberData = members.map((m) => ({
    id: m.id,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    user: { id: m.user.id, name: m.user.name, email: m.user.email },
  }));

  const inviteData = pendingInvites.map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-[11px] text-white/30 uppercase tracking-widest font-medium mb-1">Settings</p>
        <h1 className="text-3xl font-black tracking-tight">Account &amp; Integrations</h1>
        <p className="text-white/40 text-sm mt-1">Manage your connected accounts and preferences</p>
      </div>

      {/* Success / error banners */}
      {params.linkedin === "connected" && (
        <div className="mb-6 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-300 text-sm">
          ✓ LinkedIn account connected successfully!
        </div>
      )}
      {params.linkedin_error && !["unauthorized_scope_error", "invalid_scope", "insufficient_scope", "need_profile_product", "profile_fetch_failed"].includes(params.linkedin_error) && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-300 text-sm">
          ✗ LinkedIn connection failed: <code className="font-mono">{params.linkedin_error}</code>
        </div>
      )}

      {/* Account section */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-4">
        <h2 className="text-white font-bold text-lg mb-1">Account</h2>
        <p className="text-white/40 text-sm mb-4">Your SkygenAI account details</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Email</p>
            <p className="text-white text-sm">{user.email}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Joined</p>
            <p className="text-white text-sm">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Product */}
      <ProductPanel initialUrl={user.productWebsiteUrl ?? null} />

      {/* LinkedIn */}
      <LinkedInPanel
        connected={!!user.linkedinAccount}
        displayName={user.linkedinAccount?.displayName ?? null}
        profileEmail={user.linkedinAccount?.profileEmail ?? null}
        connectedAt={user.linkedinAccount?.connectedAt ?? null}
        expiresAt={user.linkedinAccount?.expiresAt ?? null}
        errorCode={params.linkedin_error ?? null}
      />

      {/* Team */}
      <TeamPanel
        initialMembers={memberData}
        initialInvites={inviteData}
        workspaceId={workspace?.id ?? ""}
        isOwner={!!workspace && workspace.ownerId === user.id}
      />

      {/* MANUAL STEP callout */}
      <div className="mt-6 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
        <p className="text-amber-300 font-bold text-sm mb-1">📌 MANUAL STEP</p>
        <p className="text-amber-200/70 text-xs leading-relaxed">
          Actual posting to LinkedIn (uploading documents / creating posts programmatically) requires
          LinkedIn&apos;s <strong>&ldquo;Share on LinkedIn&rdquo;</strong> or{" "}
          <strong>Community Management API</strong> approval — a manual application process outside
          this codebase. For now, users can connect their account (OAuth handshake works) and we
          store the tokens. Publishing wire-up will happen in Phase 8.
        </p>
      </div>
    </div>
  );
}
