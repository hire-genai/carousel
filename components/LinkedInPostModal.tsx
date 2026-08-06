"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LinkedInPage {
  urn: string;
  name: string;
  id: string;
}

interface Props {
  carouselId: string;
  title: string;
  slides: Array<{ headline: string; body: string }>;
  linkedinConnected: boolean;
  onClose: () => void;
}

function buildPreviewText(
  title: string,
  slides: Array<{ headline: string; body: string }>,
  includeSlides: boolean,
  caption: string
): string {
  const lines: string[] = [];

  if (caption.trim()) {
    lines.push(caption.trim());
    lines.push("");
  }

  lines.push(`🎯 ${title}`);

  if (includeSlides && slides.length > 0) {
    lines.push("");
    for (const slide of slides) {
      lines.push(`→ ${slide.headline}`);
    }
  }

  lines.push("");
  lines.push("#LinkedIn #carousel #SkygenAI");

  return lines.join("\n");
}

export default function LinkedInPostModal({
  title,
  slides,
  linkedinConnected,
  onClose,
}: Props) {
  const [includeSlides, setIncludeSlides] = useState(true);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<LinkedInPage[]>([]);
  const [selectedUrn, setSelectedUrn] = useState<string>("personal");

  const previewText = buildPreviewText(title, slides, includeSlides, caption);

  // Fetch admin pages when modal opens
  useEffect(() => {
    if (!linkedinConnected) return;
    fetch("/api/linkedin/pages")
      .then((r) => r.json())
      .then((data) => setPages(data.pages ?? []))
      .catch(() => {});
  }, [linkedinConnected]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handlePost() {
    if (!linkedinConnected || posting || posted) return;
    setPosting(true);
    setError(null);

    try {
      const authorUrn = selectedUrn !== "personal" ? selectedUrn : undefined;
      const res = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slides, includeSlides, authorUrn }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to post to LinkedIn");
        return;
      }

      setPostId(data.postId ?? null);
      setPosted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPosting(false);
    }
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[#0f0f18] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A66C2] flex items-center justify-center font-black text-white text-sm shadow">
              in
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">Post to LinkedIn</h2>
              <p className="text-white/35 text-xs">Publish as a text post to your feed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[72vh] overflow-y-auto">

          {/* Not connected state */}
          {!linkedinConnected && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-4 space-y-2">
              <p className="text-amber-300 font-semibold text-sm">LinkedIn not connected</p>
              <p className="text-amber-200/60 text-xs leading-relaxed">
                Connect your LinkedIn account in Settings to post directly from SkygenAI.
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 mt-1 px-4 py-2 rounded-lg bg-[#0A66C2] hover:bg-[#0958AB] text-white text-xs font-semibold transition"
              >
                <span className="font-black">in</span>
                Go to Settings
              </Link>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            {/* Post As selector — shown only when pages are available */}
            {pages.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">
                  Post as
                </label>
                <select
                  value={selectedUrn}
                  onChange={(e) => setSelectedUrn(e.target.value)}
                  disabled={posted}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white/80 text-sm focus:outline-none focus:border-white/20 disabled:opacity-40 cursor-pointer"
                >
                  <option value="personal">👤 Personal Account</option>
                  {pages.map((page) => (
                    <option key={page.urn} value={page.urn}>
                      🏢 {page.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">
                Add your own caption (optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write something to start your post..."
                rows={3}
                disabled={!linkedinConnected || posted}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white/80 text-sm leading-relaxed placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none disabled:opacity-40"
              />
            </div>

            {/* Include slides toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={includeSlides}
                  onChange={(e) => setIncludeSlides(e.target.checked)}
                  disabled={!linkedinConnected || posted}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full bg-white/10 peer-checked:bg-[#0A66C2] transition-colors peer-disabled:opacity-40" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <span className="text-sm text-white/60 group-hover:text-white/80 transition select-none">
                Include slide headlines
              </span>
            </label>
          </div>

          {/* Preview */}
          <div>
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Post preview</p>

            {/* Phone-frame-like LinkedIn card */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
              {/* Fake LinkedIn profile header */}
              <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#0D4F96] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {selectedUrn !== "personal" ? "🏢" : "You"}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold leading-tight">
                    {selectedUrn !== "personal"
                      ? (pages.find((p) => p.urn === selectedUrn)?.name ?? "Page")
                      : "Your Name"}
                  </p>
                  <p className="text-white/30 text-[10px]">Just now · <span className="text-white/20">🌐</span></p>
                </div>
              </div>

              {/* Post content */}
              <div className="px-4 pb-4">
                <p className="text-white/75 text-sm leading-relaxed whitespace-pre-line">
                  {previewText}
                </p>
              </div>

              {/* Fake LinkedIn action bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.05]">
                {["👍 Like", "💬 Comment", "🔁 Repost", "✉ Send"].map((action) => (
                  <span key={action} className="text-[10px] text-white/20 font-medium">
                    {action}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {posted && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/[0.07] px-4 py-3 space-y-1">
              <p className="text-green-400 font-semibold text-sm">Posted successfully!</p>
              {postId && (
                <a
                  href={`https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-300/70 hover:text-green-300 underline underline-offset-2 transition"
                >
                  View post on LinkedIn →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.07]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition font-medium"
          >
            {posted ? "Close" : "Cancel"}
          </button>

          {linkedinConnected && !posted && (
            <button
              onClick={handlePost}
              disabled={posting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#0958AB] disabled:opacity-50 text-white text-sm font-semibold transition shadow-lg"
            >
              {posting ? (
                <>
                  <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Posting…
                </>
              ) : (
                <>
                  <span className="font-black text-base leading-none">in</span>
                  Post to LinkedIn
                </>
              )}
            </button>
          )}

          {posted && (
            <span className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-sm font-semibold">
              ✓ Posted!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
