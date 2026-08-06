"use client";

import { useState } from "react";
import Link from "next/link";
import PostPreviewModal from "./PostPreviewModal";

interface TextPost {
  id: string;
  content: string;
  status: string;
  scheduledAt?: string | null;
  updatedAt: string;
  imageData?: string | null;
}

interface Props {
  posts: TextPost[];
  linkedinName: string;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  published: { bg: "bg-green-500/15", text: "text-green-400", label: "Published" },
  scheduled: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Pending" },
  draft: { bg: "bg-white/10", text: "text-white/40", label: "Pending" },
  failed: { bg: "bg-red-500/15", text: "text-red-400", label: "Failed" },
};

export default function PostsSection({ posts, linkedinName }: Props) {
  const [selectedPost, setSelectedPost] = useState<TextPost | null>(null);

  return (
    <>
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Posts</h2>
          <Link href="/dashboard/posts/drafts" className="text-[12px] text-white/30 hover:text-white/60 transition">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => {
            const badgeInfo = STATUS_BADGE[p.status] ?? STATUS_BADGE.draft;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPost(p)}
                className="group bg-white/[0.03] border border-white/[0.07] hover:border-white/15 rounded-2xl p-5 flex flex-col gap-3 transition text-left"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${badgeInfo.bg} ${badgeInfo.text}`}>
                    {badgeInfo.label}
                  </span>
                  <span className="text-white/20 text-[11px]">
                    {new Date(p.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="text-white/65 text-[13px] leading-relaxed line-clamp-3">{p.content}</p>
                {p.scheduledAt && p.status === "scheduled" && (
                  <p className="text-amber-400/70 text-[11px]">
                    ⏰ {new Date(p.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Modal */}
      {selectedPost && (
        <PostPreviewModal
          post={selectedPost}
          linkedinName={linkedinName}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}
