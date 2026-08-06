"use client";

import { useState } from "react";
import Link from "next/link";
import PostPreviewModal from "@/app/dashboard/PostPreviewModal";

interface Post {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  imageData: string | null;
}

export default function PublishedClient({ posts, linkedinName }: { posts: Post[]; linkedinName: string }) {
  const [selected, setSelected] = useState<Post | null>(null);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest font-medium mb-1">Post Generator</p>
          <h1 className="text-2xl font-bold text-white">Published <span className="text-white/25 text-lg font-normal">({posts.length})</span></h1>
        </div>
        <Link href="/dashboard/posts/new" className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-violet-500 transition shadow-lg">
          + New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-white/25">
          <p className="text-4xl mb-3">🚀</p>
          <p className="font-semibold">No published posts yet</p>
          <p className="text-sm mt-1">Posts you publish to LinkedIn will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="group bg-white/[0.03] border border-white/[0.07] hover:border-white/15 rounded-2xl overflow-hidden transition text-left flex flex-col"
            >
              {/* Image thumbnail if present */}
              {p.imageData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageData} alt="" className="w-full h-32 object-cover" />
              )}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                    Published
                  </span>
                  <span className="text-white/20 text-[11px]">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                  </span>
                </div>
                <p className="text-white/65 text-[13px] leading-relaxed line-clamp-3">{p.content}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <PostPreviewModal post={selected} linkedinName={linkedinName} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
