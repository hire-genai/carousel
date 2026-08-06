"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Post {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  updatedAt: string;
  imageData: string | null;
  linkedinPostId: string | null;
}

interface Props {
  posts: Post[];
}

const STATUS_STYLES: Record<string, string> = {
  complete: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  scheduled: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  publishing: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  published: "bg-green-500/15 text-green-400 border-green-500/20",
  failed: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function PostsListClient({ posts }: Props) {
  const router = useRouter();
  const [optionsId, setOptionsId] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [publishedModal, setPublishedModal] = useState<Post | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  async function handleSchedule(postId: string) {
    if (!date || !time) return;
    setSaving(true);
    setError("");
    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      if (new Date(scheduledAt) <= new Date()) {
        setError("Scheduled time must be in the future.");
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/text-posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "scheduled", scheduledAt }),
      });
      if (res.ok) {
        setSchedulingId(null);
        setOptionsId(null);
        setDate("");
        setTime("09:00");
        router.refresh();
      } else {
        setError("Failed to schedule post.");
      }
    } catch {
      setError("Failed to schedule post.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelSchedule(postId: string) {
    setCancelling(true);
    try {
      const res = await fetch(`/api/text-posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "complete", scheduledAt: null }),
      });
      if (res.ok) { setOptionsId(null); router.refresh(); }
    } catch { /* */ }
    finally { setCancelling(false); }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((p) => {
          const isOptionsOpen = optionsId === p.id;
          const isScheduling = schedulingId === p.id;
          const isPublished = p.status === "published";
          const isScheduled = p.status === "scheduled";
          const isComplete = p.status === "complete";

          const dateLabel =
            isScheduled && p.scheduledAt
              ? new Date(p.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : isPublished && p.publishedAt
              ? new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <div
              key={p.id}
              className="group bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.14] rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 flex flex-col"
            >
              {/* Image — top */}
              {p.imageData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageData}
                  alt=""
                  className="w-full h-36 object-cover cursor-pointer"
                  onClick={() => isPublished ? setPublishedModal(p) : undefined}
                />
              )}

              <div className="p-4 flex flex-col gap-2 flex-1">
                {/* Status row + options */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[p.status] ?? "bg-white/10 text-white/40 border-white/10"}`}>
                    {p.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/25 text-[11px]">{dateLabel}</span>
                    {!isPublished && (
                      <Link href={`/dashboard/posts/new?id=${p.id}`} className="text-white/20 hover:text-white/50 transition text-sm px-1 rounded hover:bg-white/[0.05]">✏</Link>
                    )}
                    {/* ··· options */}
                    <div className="relative">
                      <button
                        onClick={() => setOptionsId(isOptionsOpen ? null : p.id)}
                        className="text-white/25 hover:text-white/60 transition px-1.5 py-0.5 rounded-lg hover:bg-white/[0.06] text-sm font-bold leading-none"
                      >
                        ···
                      </button>
                      {isOptionsOpen && (
                        <div className="absolute right-0 top-full mt-1 bg-[#1a1a2e] border border-white/[0.12] rounded-xl p-1.5 z-30 w-44 shadow-2xl">
                          {isPublished && (
                            <button
                              onClick={() => { setPublishedModal(p); setOptionsId(null); }}
                              className="w-full text-left px-3 py-2 rounded-lg text-[12px] text-white/70 hover:bg-white/[0.08] hover:text-white transition flex items-center gap-2"
                            >
                              <span>🔗</span> View LinkedIn Post
                            </button>
                          )}
                          {isComplete && (
                            <button
                              onClick={() => { setSchedulingId(p.id); setOptionsId(null); }}
                              className="w-full text-left px-3 py-2 rounded-lg text-[12px] text-white/70 hover:bg-white/[0.08] hover:text-white transition flex items-center gap-2"
                            >
                              <span>⏰</span> Schedule
                            </button>
                          )}
                          {isScheduled && (
                            <>
                              <button
                                onClick={() => { setSchedulingId(p.id); setOptionsId(null); }}
                                className="w-full text-left px-3 py-2 rounded-lg text-[12px] text-white/70 hover:bg-white/[0.08] hover:text-white transition flex items-center gap-2"
                              >
                                <span>📅</span> Change Time
                              </button>
                              <button
                                onClick={() => handleCancelSchedule(p.id)}
                                disabled={cancelling}
                                className="w-full text-left px-3 py-2 rounded-lg text-[12px] text-red-400/80 hover:bg-red-500/[0.08] hover:text-red-300 transition flex items-center gap-2"
                              >
                                <span>✕</span> Cancel Schedule
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content preview */}
                {isPublished ? (
                  <button
                    onClick={() => setPublishedModal(p)}
                    className="text-white/65 text-[13px] leading-relaxed text-left hover:text-white/85 transition line-clamp-3 flex-1"
                  >
                    {p.content}
                  </button>
                ) : (
                  <p className="text-white/65 text-[13px] leading-relaxed line-clamp-3 flex-1">
                    {p.content}
                  </p>
                )}
              </div>

              {/* Inline scheduler */}
              {isScheduling && (
                <div className="px-4 pb-4 border-t border-white/[0.07] pt-3 flex flex-col gap-3">
                  <p className="text-[11px] text-white/30 uppercase tracking-widest font-semibold">
                    {p.scheduledAt ? "Change Schedule" : "Set Schedule"}
                  </p>
                  <div className="flex items-end gap-2 flex-wrap">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={minDateStr}
                      className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white text-[12px] focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                    />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white text-[12px] focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                    />
                    <button
                      onClick={() => handleSchedule(p.id)}
                      disabled={!date || !time || saving}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[12px] font-semibold transition disabled:opacity-40"
                    >
                      {saving ? "Saving…" : "Confirm"}
                    </button>
                    <button onClick={() => setSchedulingId(null)} className="text-white/30 hover:text-white/60 text-[12px] transition">Cancel</button>
                  </div>
                  {error && <p className="text-red-400 text-[11px]">⚠️ {error}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Published popup */}
      {publishedModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPublishedModal(null)}
        >
          <div
            className="bg-[#16161e] border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center text-white text-sm font-bold">in</div>
                <div>
                  <p className="text-white font-semibold text-sm">LinkedIn Post</p>
                  <p className="text-white/35 text-[11px]">
                    {publishedModal.publishedAt
                      ? `Published ${new Date(publishedModal.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : "Published"}
                  </p>
                </div>
              </div>
              <button onClick={() => setPublishedModal(null)} className="text-white/30 hover:text-white/70 transition text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06]">✕</button>
            </div>
            <div className="px-6 py-5 max-h-72 overflow-y-auto">
              {publishedModal.imageData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publishedModal.imageData} alt="" className="w-full rounded-xl mb-4 object-cover max-h-40 border border-white/[0.08]" />
              )}
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{publishedModal.content}</p>
            </div>
            <div className="px-6 pb-5 pt-3 border-t border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 text-[11px] font-semibold">Successfully posted to LinkedIn</span>
              </div>
              {publishedModal.linkedinPostId && (
                <span className="text-[11px] text-white/25 font-mono">{publishedModal.linkedinPostId.slice(0, 16)}…</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
