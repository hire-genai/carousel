"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PostPreviewModal from "@/app/dashboard/PostPreviewModal";

interface TextPost {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  updatedAt: string;
  imageData: string | null;
}

interface Props {
  posts: TextPost[];
  linkedinName: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  draft:     { label: "Draft",     cls: "bg-white/[0.07] text-white/40 border-white/[0.1]" },
  scheduled: { label: "Scheduled", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  failed:    { label: "Failed",    cls: "bg-red-500/15 text-red-400 border-red-500/20" },
};

export default function TextPostsScheduler({ posts, linkedinName }: Props) {
  const router = useRouter();
  const [previewPost, setPreviewPost] = useState<TextPost | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSchedule(postId: string) {
    if (!schedDate || !schedTime) return;
    setSaving(true);
    try {
      const scheduledAt = new Date(`${schedDate}T${schedTime}`).toISOString();
      const res = await fetch(`/api/text-posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "scheduled", scheduledAt }),
      });
      if (res.ok) {
        setSchedulingId(null);
        setSchedDate("");
        setSchedTime("");
        router.refresh();
      }
    } finally { setSaving(false); }
  }

  async function handleUnschedule(postId: string) {
    await fetch(`/api/text-posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft", scheduledAt: null }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="space-y-3">
        {posts.map((p) => {
          const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
          const isScheduling = schedulingId === p.id;

          return (
            <div key={p.id} className="bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-4 transition">
              <div className="flex items-start gap-3">
                {/* Image thumbnail */}
                {p.imageData && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageData} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-[13px] leading-relaxed line-clamp-2">{p.content}</p>
                  {p.status === "scheduled" && p.scheduledAt && (
                    <p className="text-amber-400/80 text-[11px] mt-1">
                      ⏰ {new Date(p.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" at "}
                      {new Date(p.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Preview button */}
                    <button
                      onClick={() => setPreviewPost(p)}
                      className="text-[11px] text-white/30 hover:text-white/70 transition px-2 py-1 rounded-lg hover:bg-white/[0.05]"
                    >
                      Preview
                    </button>
                    {/* Schedule / Unschedule */}
                    {p.status === "scheduled" ? (
                      <button
                        onClick={() => handleUnschedule(p.id)}
                        className="text-[11px] text-red-400/70 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-red-500/[0.05]"
                      >
                        Unschedule
                      </button>
                    ) : (
                      <button
                        onClick={() => setSchedulingId(isScheduling ? null : p.id)}
                        className="text-[11px] text-amber-400/80 hover:text-amber-300 transition px-2 py-1 rounded-lg hover:bg-amber-500/[0.07] border border-amber-500/20"
                      >
                        ⏰ Schedule
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Inline scheduler — expands below the card */}
              {isScheduling && (
                <div className="mt-3 pt-3 border-t border-white/[0.07] flex items-end gap-3 flex-wrap">
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-1.5">Date</label>
                    <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500/50 [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-1.5">Time</label>
                    <input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)}
                      className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500/50 [color-scheme:dark]" />
                  </div>
                  <button
                    onClick={() => handleSchedule(p.id)}
                    disabled={!schedDate || !schedTime || saving}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-[13px] font-semibold transition disabled:opacity-40"
                  >
                    {saving ? "Saving…" : "Confirm"}
                  </button>
                  <button onClick={() => setSchedulingId(null)} className="text-white/30 hover:text-white/60 text-[13px] transition">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {previewPost && (
        <PostPreviewModal post={previewPost} linkedinName={linkedinName} onClose={() => setPreviewPost(null)} />
      )}
    </>
  );
}
