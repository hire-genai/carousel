"use client";

interface Post {
  id: string;
  content: string;
  status: string;
  scheduledAt?: string | null;
  imageData?: string | null;
}

interface Props {
  post: Post;
  linkedinName: string;
  onClose: () => void;
}

function renderPreview(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 underline" target="_blank">$1</a>')
    .replace(/\n/g, "<br/>");
}

export default function PostPreviewModal({ post, linkedinName, onClose }: Props) {
  const initials = linkedinName
    ? linkedinName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0f0f13] border border-white/[0.1] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#0A66C2] text-base">in</span>
            <span className="text-white font-semibold text-sm">Post Preview</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition text-lg flex items-center justify-center">✕</button>
        </div>

        {/* LinkedIn card */}
        <div className="p-5 overflow-y-auto max-h-[70vh]">
          <div className="bg-[#1B1B27] rounded-2xl border border-white/[0.08] overflow-hidden shadow-xl">

            {/* Author row */}
            <div className="p-5 pb-3 flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-black text-white text-sm flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{linkedinName || "Your Name"}</p>
                <p className="text-white/35 text-[11px] mt-0.5">
                  {post.status === "published" ? "Posted" : "Now"} · 🌐
                </p>
              </div>
              <button className="text-[#60a9e8] text-[11px] font-semibold border border-[#0A66C2]/40 px-2.5 py-1 rounded-full hover:bg-[#0A66C2]/10 transition flex-shrink-0">
                + Follow
              </button>
            </div>

            {/* Post content */}
            <div className="px-5 pb-3">
              <div
                className="text-white/85 text-[14px] leading-relaxed break-words"
                dangerouslySetInnerHTML={{ __html: renderPreview(post.content) }}
              />
            </div>

            {/* Image — shown only if uploaded */}
            {post.imageData && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.imageData} alt="post image" className="w-full max-h-64 object-cover" />
            )}

            {/* Status pill */}
            <div className="px-5 py-3">
              {post.status === "published" && (
                <span className="inline-flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 text-green-400 text-[11px] font-semibold px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Published to LinkedIn
                </span>
              )}
              {post.status === "scheduled" && post.scheduledAt && (
                <span className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[11px] font-semibold px-3 py-1.5 rounded-full">
                  ⏰ Scheduled · {new Date(post.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at {new Date(post.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {post.status === "draft" && (
                <span className="inline-flex items-center gap-1.5 bg-white/[0.07] border border-white/[0.1] text-white/40 text-[11px] font-semibold px-3 py-1.5 rounded-full">
                  ⏳ Draft
                </span>
              )}
              {post.status === "failed" && (
                <span className="inline-flex items-center gap-1.5 bg-red-500/15 border border-red-500/25 text-red-400 text-[11px] font-semibold px-3 py-1.5 rounded-full">
                  ✕ Failed to publish
                </span>
              )}
            </div>

            {/* Engagement bar */}
            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center gap-4 text-white/20 text-[11px]">
              {["👍 Like", "💬 Comment", "🔁 Repost", "📤 Send"].map((a) => <span key={a}>{a}</span>)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/[0.07] flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-sm font-semibold transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
