"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ScheduledPostItem {
  id: string;
  carouselId: string;
  scheduledAt: string; // ISO string
  status: string;
  autoComment: string | null;
  linkedinPostId: string | null;
  errorMsg: string | null;
  carousel: { id: string; title: string };
}

interface Props {
  posts: ScheduledPostItem[];
}

function getDateLabel(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getTimeLabel(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  scheduled: {
    label: "Scheduled",
    classes: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    dot: "bg-blue-500",
  },
  posted: {
    label: "Posted",
    classes: "bg-green-500/15 text-green-400 border border-green-500/20",
    dot: "bg-green-500",
  },
  failed: {
    label: "Failed",
    classes: "bg-red-500/15 text-red-400 border border-red-500/20",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-white/[0.06] text-white/35 border border-white/10",
    dot: "bg-white/25",
  },
};

export default function ScheduledList({ posts }: Props) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this scheduled post? This cannot be undone.")) return;
    setCancelling(id);
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      router.refresh();
    } catch {
      alert("Failed to cancel the post. Please try again.");
    } finally {
      setCancelling(null);
    }
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-white/40">
        <p className="text-sm">No carousel posts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post, index) => {
        const config = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.scheduled;
        const isLast = index === posts.length - 1;

        return (
          <div key={post.id} className={`bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/[0.12] transition-colors ${post.status === "cancelled" ? "opacity-60" : ""}`}>
            <div className="flex flex-col gap-4">
              {/* Header with date and status */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white font-bold text-base line-clamp-2">
                    {post.carousel.title}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="text-white/40">
                      {getDateLabel(post.scheduledAt)}
                    </span>
                    <span className="text-white/25">•</span>
                    <span className="text-white/40">
                      {getTimeLabel(post.scheduledAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap ${config.classes}`}
                  >
                    {config.label}
                  </span>
                  {post.status === "scheduled" && (
                    <button
                      onClick={() => handleCancel(post.id)}
                      disabled={cancelling === post.id}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 hover:text-red-300 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {cancelling === post.id ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                </div>
              </div>

              {/* Auto comment */}
              {post.autoComment && (
                <div className="flex items-start gap-2 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                  <span className="text-white/30 text-sm flex-shrink-0 mt-0.5">💬</span>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {post.autoComment}
                  </p>
                </div>
              )}

              {/* Error message */}
              {post.errorMsg && (
                <div className="flex items-start gap-2 bg-red-500/[0.06] border border-red-500/20 rounded-xl p-3">
                  <span className="text-red-400 text-sm flex-shrink-0 mt-0.5">⚠</span>
                  <p className="text-red-400/80 text-sm">{post.errorMsg}</p>
                </div>
              )}

              {/* LinkedIn post ID */}
              {post.linkedinPostId && (
                <p className="text-white/25 text-[11px] font-mono">
                  Post ID: {post.linkedinPostId}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
