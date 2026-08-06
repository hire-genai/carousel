import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PostsListClient from "./PostsListClient";

export const metadata = { title: "My Posts — SkygenAI" };
export const dynamic = "force-dynamic";

const NON_DRAFT_STATUSES = ["complete", "scheduled", "publishing", "published", "failed"];

export default async function MyPostsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const posts = await prisma.textPost.findMany({
    where: { userId: session.userId, status: { in: NON_DRAFT_STATUSES } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, content: true, status: true, scheduledAt: true, publishedAt: true, updatedAt: true, imageData: true, linkedinPostId: true },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest font-medium mb-1">My Posts</p>
          <h1 className="text-2xl font-bold text-white">My Posts</h1>
          <p className="text-white/40 text-sm mt-1">Complete, scheduled, and published posts</p>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-violet-500 transition shadow-lg"
        >
          + New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-white/25">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-semibold">No posts here yet</p>
          <p className="text-sm mt-1">Save a post as Complete to see it here</p>
          <Link
            href="/dashboard/posts/new"
            className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-sm font-semibold transition"
          >
            Create Your First Post
          </Link>
        </div>
      ) : (
        <PostsListClient posts={posts} />
      )}
    </div>
  );
}
