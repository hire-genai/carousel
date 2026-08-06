import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";


export default async function DashboardHome() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [carouselCount, textPostCount, linkedinAccount] = await Promise.all([
    prisma.carousel.count({
      where: { userId: user.id, status: "draft" },
    }),
    prisma.textPost.count({
      where: { userId: user.id, status: "draft" },
    }),
    prisma.linkedInAccount.findUnique({
      where: { userId: user.id },
      select: { displayName: true },
    }),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-widest font-medium mb-1">Dashboard</p>
          <h1 className="text-3xl font-black tracking-tight">My Content</h1>
          <p className="text-white/40 text-sm mt-1">All your carousels and posts in one place</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/posts/new"
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white font-semibold text-sm transition flex items-center gap-2"
          >
            ✏ New Post
          </Link>
          <Link
            href="/dashboard/templates"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
          >
            ✨ New Carousel
          </Link>
        </div>
      </div>

      {/* LinkedIn CTA */}
      {!linkedinAccount && (
        <div className="p-5 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-violet-500/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0A66C2] flex items-center justify-center font-black text-white text-xl shadow-lg flex-shrink-0">in</div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Connect your LinkedIn account</p>
            <p className="text-white/45 text-xs mt-0.5">Enable one-click publishing and scheduled posts.</p>
          </div>
          <Link href="/dashboard/settings" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition flex-shrink-0">
            Connect →
          </Link>
        </div>
      )}

      {/* ── Quick Links ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link href="/dashboard/carousels/drafts"
          className="p-6 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-violet-500/5 hover:border-blue-500/40 hover:from-blue-500/10 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">🎨</div>
            <span className="text-blue-400 text-sm font-semibold">{carouselCount} drafts</span>
          </div>
          <h3 className="text-white font-bold mb-1">Carousel Drafts</h3>
          <p className="text-white/50 text-sm">View and edit your saved carousel slides</p>
        </Link>

        <Link href="/dashboard/posts/drafts"
          className="p-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-pink-500/5 hover:border-violet-500/40 hover:from-violet-500/10 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">✏️</div>
            <span className="text-violet-400 text-sm font-semibold">{textPostCount} drafts</span>
          </div>
          <h3 className="text-white font-bold mb-1">Post Drafts</h3>
          <p className="text-white/50 text-sm">View and edit your saved text posts</p>
        </Link>
      </section>
    </div>
  );
}
