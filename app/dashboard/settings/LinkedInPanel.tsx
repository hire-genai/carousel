"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  connected: boolean;
  displayName: string | null;
  profileEmail: string | null;
  connectedAt: Date | null;
  expiresAt: Date | null;
  errorCode?: string | null;
}

const SCOPE_ERRORS = new Set([
  "unauthorized_scope_error",
  "invalid_scope",
  "insufficient_scope",
  "need_profile_product",
  "profile_fetch_failed",
]);

export default function LinkedInPanel({
  connected,
  displayName,
  profileEmail,
  connectedAt,
  expiresAt,
  errorCode,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function disconnect() {
    if (!confirm("Disconnect your LinkedIn account?")) return;
    setBusy(true);
    await fetch("/api/linkedin/disconnect", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  const isScopeError = !!errorCode && SCOPE_ERRORS.has(errorCode);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0A66C2] flex items-center justify-center font-bold text-white text-sm shadow-lg">
            in
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">LinkedIn</h2>
            <p className="text-white/40 text-xs">Publish and schedule directly to your feed</p>
          </div>
        </div>

        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
            connected
              ? "bg-green-500/15 text-green-400 border border-green-500/20"
              : "bg-white/5 text-white/40 border border-white/10"
          }`}
        >
          {connected ? "● Connected" : "○ Not connected"}
        </span>
      </div>

      {/* Scope error guide — shown when LinkedIn rejects because of missing product */}
      {isScopeError && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/25 space-y-3">
          <p className="text-amber-300 font-bold text-sm">⚠️ LinkedIn App Missing Required Product</p>
          <p className="text-amber-200/70 text-xs leading-relaxed">
            Your LinkedIn Developer app doesn&apos;t have the required scope permissions. Follow these steps to fix it:
          </p>
          <ol className="text-xs text-amber-200/70 space-y-1.5 list-decimal pl-4">
            <li>
              Go to{" "}
              <a
                href="https://www.linkedin.com/developers/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-300 underline hover:text-amber-200"
              >
                linkedin.com/developers/apps
              </a>{" "}
              and open your app
            </li>
            <li>Click the <strong className="text-amber-300">Products</strong> tab</li>
            <li>
              Request <strong className="text-amber-300">&ldquo;Share on LinkedIn&rdquo;</strong> (for posting) and{" "}
              <strong className="text-amber-300">&ldquo;Sign In with LinkedIn using OpenID Connect&rdquo;</strong> (for identity)
            </li>
            <li>Both products are <strong className="text-amber-300">free</strong> and usually approved instantly</li>
            <li>Once approved, click <strong className="text-amber-300">Connect LinkedIn</strong> below again</li>
          </ol>
        </div>
      )}

      {/* Body */}
      {connected ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-white/[0.06]">
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Connected as</p>
              <p className="text-white text-sm">{displayName || "—"}</p>
              {profileEmail && <p className="text-white/40 text-xs mt-0.5">{profileEmail}</p>}
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Since</p>
              <p className="text-white text-sm">
                {connectedAt
                  ? new Date(connectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Token expires</p>
              <p className="text-white text-sm">
                {expiresAt
                  ? new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={disconnect}
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 hover:text-red-300 text-sm font-semibold transition disabled:opacity-40"
            >
              {busy ? "Disconnecting..." : "Disconnect"}
            </button>
            <a
              href="/api/linkedin/connect"
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white text-sm font-semibold transition"
            >
              Reconnect
            </a>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-white/50 text-sm leading-relaxed">
            Connect your LinkedIn account to publish carousels directly, schedule posts, and add auto-comments.
          </p>
          <ul className="text-xs text-white/40 space-y-1.5 pl-4">
            <li>
              • Required scopes:{" "}
              <code className="text-white/60 font-mono">r_liteprofile r_emailaddress w_member_social</code>
            </li>
            <li>• Your tokens are stored locally in the SQLite database, tied to your account only</li>
            <li>• You can disconnect at any time</li>
          </ul>
          <a
            href="/api/linkedin/connect"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#0958AB] text-white font-semibold text-sm shadow-lg mt-2"
          >
            <span className="text-base font-black">in</span>
            Connect LinkedIn
          </a>
        </div>
      )}
    </div>
  );
}
