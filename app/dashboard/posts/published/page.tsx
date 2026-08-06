import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PostsListClient from "@/app/dashboard/posts/PostsListClient";

export const metadata = { title: "Published Posts — SkygenAI" };
export const dynamic = "force-dynamic";

export default async function PublishedPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const posts = await prisma.textPost.findMany({
    where: { userId: session.userId, status: "published" },
    orderBy: { publishedAt: "desc" },
    select: { id: true, content: true, status: true, scheduledAt: true, publishedAt: true, updatedAt: true, imageData: true, linkedinPostId: true },
  });

  const serialized = posts.map((p) => ({
    id: p.id,
    content: p.content,
    status: p.status,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
    imageData: p.imageData ?? null,
    linkedinPostId: p.linkedinPostId ?? null,
  }));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest font-medium mb-1">My Posts</p>
          <h1 className="text-2xl font-bold text-white">Published</h1>
          <p className="text-white/40 text-sm mt-1">{posts.length} post{posts.length !== 1 ? "s" : ""} published to LinkedIn</p>
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
          <p className="text-4xl mb-3">🚀</p>
          <p className="font-semibold">No published posts yet</p>
          <p className="text-sm mt-1">Posts you publish to LinkedIn will appear here</p>
        </div>
      ) : (
        <PostsListClient posts={serialized} />
      )}
    </div>
  );
}
