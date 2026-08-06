import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Drafts — SkygenAI" };

export default async function DraftsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const posts = await prisma.textPost.findMany({
    where: { userId: session.userId, status: "draft" },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest font-medium mb-1">Post Generator</p>
          <h1 className="text-2xl font-bold text-white">Drafts</h1>
        </div>
        <Link href="/dashboard/posts/new" className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-violet-500 transition shadow-lg">
          + New Post
        </Link>
      </div>
      {posts.length === 0 ? (
        <div className="text-center py-20 text-white/25">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-semibold">No drafts yet</p>
          <p className="text-sm mt-1">Save a post as draft to see it here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/dashboard/posts/new?id=${p.id}`}
              className="block bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex items-start justify-between gap-4 hover:border-violet-500/30 hover:bg-white/[0.06] transition group">
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-[14px] leading-relaxed line-clamp-2 group-hover:text-white/85 transition">{p.content}</p>
                <p className="text-white/25 text-[11px] mt-2">Updated {new Date(p.updatedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-semibold">Draft</span>
                <span className="text-white/20 group-hover:text-white/50 text-sm transition">✏</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
