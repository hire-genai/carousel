"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  token: string;
  inviteEmail: string;
  invitedBy: string;
  workspaceName: string;
  role: string;
  isLoggedIn: boolean;
  currentUserEmail: string | null;
}

export default function InviteAcceptClient({
  token,
  inviteEmail,
  invitedBy,
  workspaceName,
  role,
  isLoggedIn,
  currentUserEmail,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  const emailMismatch = isLoggedIn && currentUserEmail && currentUserEmail !== inviteEmail;

  async function accept() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/teams/invite/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to accept invite.");
      setAccepted(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-[#16161e] border border-white/10 rounded-3xl p-8 shadow-2xl">
          {accepted ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-black text-white mb-2">You&apos;re in!</h2>
              <p className="text-white/40 text-sm">
                Welcome to <span className="text-white font-semibold">{workspaceName}</span>. Redirecting to dashboard…
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center text-3xl mb-4">
                  👥
                </div>
                <h1 className="text-2xl font-black text-white mb-1">You&apos;re Invited!</h1>
                <p className="text-white/40 text-sm">to join a team workspace on SkygenAI</p>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                <DetailRow label="Workspace" value={workspaceName} />
                <DetailRow label="Invited by" value={invitedBy} />
                <DetailRow label="Your role" value={role.charAt(0).toUpperCase() + role.slice(1)} highlight />
                <DetailRow label="Invite email" value={inviteEmail} />
              </div>

              {emailMismatch && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                  ⚠️ You&apos;re logged in as <strong>{currentUserEmail}</strong> but this invite was
                  sent to <strong>{inviteEmail}</strong>. You can still accept — it will link to your
                  current account.
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  ⚠️ {error}
                </div>
              )}

              {isLoggedIn ? (
                <button
                  onClick={accept}
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Accepting…
                    </>
                  ) : "Accept Invite"}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-white/40 text-xs text-center">
                    Sign in or create an account to accept this invite
                  </p>
                  <a
                    href={`/login?next=/invite/${token}`}
                    className="w-full block text-center py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-500/20"
                  >
                    Log in to Accept
                  </a>
                  <a
                    href={`/signup?next=/invite/${token}`}
                    className="w-full block text-center py-3 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.10] text-white/70 hover:text-white font-semibold text-sm rounded-xl transition"
                  >
                    Create Account
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-4">
          Powered by <a href="/" className="hover:text-white/50 transition">SkygenAI</a>
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <span className="text-white/40 text-xs font-medium">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? "text-blue-400" : "text-white/70"}`}>
        {value}
      </span>
    </div>
  );
}
