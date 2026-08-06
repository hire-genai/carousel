"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MemberUser = {
  id: string;
  name: string | null;
  email: string;
};

type Member = {
  id: string;
  role: string;
  joinedAt: string;
  user: MemberUser;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

type Props = {
  initialMembers: Member[];
  initialInvites: Invite[];
  workspaceId: string;
  isOwner: boolean;
};

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    owner: "bg-purple-500/20 text-purple-300",
    editor: "bg-blue-500/20 text-blue-300",
    viewer: "bg-white/10 text-white/50",
  };
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
        styles[role] ?? "bg-white/10 text-white/50"
      }`}
    >
      {role}
    </span>
  );
}

export default function TeamPanel({
  initialMembers,
  initialInvites,
  workspaceId: _workspaceId,
  isOwner,
}: Props) {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [invites, setInvites] = useState<Invite[]>(initialInvites);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [sending, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSendInvite() {
    if (!email.trim()) return;
    setSending(true);
    setFormError(null);
    setInviteLink(null);

    try {
      const res = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send invite");

      setInviteLink(data.inviteUrl as string);
      setEmail("");
      // Refresh server data so the invites list includes the new entry
      router.refresh();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      const res = await fetch("/api/teams/invite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      }
    } catch {
      // silently ignore; user can retry
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const res = await fetch(`/api/teams/invite/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch {
      // silently ignore; user can retry
    }
  }

  function handleCopyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mt-4">
      <h2 className="text-white font-bold text-lg mb-1">Team</h2>
      <p className="text-white/40 text-sm mb-6">
        Manage workspace members and send invitations
      </p>

      {/* ── Members list ── */}
      <div className="mb-6">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
          Members
        </p>

        {members.length === 0 ? (
          <p className="text-white/30 text-sm">No members yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5"
              >
                <div className="min-w-0 mr-4">
                  <p className="text-white text-sm font-medium truncate">
                    {member.user.name ?? member.user.email}
                  </p>
                  {member.user.name && (
                    <p className="text-white/40 text-xs truncate">{member.user.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <RoleBadge role={member.role} />
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pending invites list ── */}
      {invites.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
            Pending Invites
          </p>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5"
              >
                <div className="min-w-0 mr-4">
                  <p className="text-white text-sm truncate">{invite.email}</p>
                  <p className="text-white/40 text-xs">
                    Sent{" "}
                    {new Date(invite.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <RoleBadge role={invite.role} />
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Invite form ── */}
      <div>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
          Invite Member
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
            className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition-colors [color-scheme:dark]"
          >
            <option value="editor" className="bg-[#16161e] text-white">Editor</option>
            <option value="viewer" className="bg-[#16161e] text-white">Viewer</option>
          </select>
          <button
            onClick={handleSendInvite}
            disabled={sending || !email.trim()}
            className="px-5 py-2 bg-white text-black text-sm font-bold rounded-xl disabled:opacity-40 hover:bg-white/90 transition-colors"
          >
            {sending ? "Sending…" : "Send Invite"}
          </button>
        </div>

        {formError && (
          <p className="text-red-400 text-xs mb-3">{formError}</p>
        )}

        {inviteLink && (
          <div className="flex items-center gap-2 p-3 bg-white/[0.03] rounded-xl border border-white/10">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 min-w-0 bg-transparent text-white/60 text-xs font-mono focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="text-xs text-white/50 hover:text-white transition-colors shrink-0 font-medium"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
