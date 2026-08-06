import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ScheduledList, { type ScheduledPostItem } from "./ScheduledList";
import TextPostsScheduler from "./TextPostsScheduler";
import AutoSchedulePanel from "./AutoSchedulePanel";

export default async function ScheduledPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();

  const [rawCarousel, rawTextPosts, account, autoConfig] = await Promise.all([
    prisma.scheduledPost.findMany({
      where: { userId: user.id },
      include: { carousel: { select: { id: true, title: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.textPost.findMany({
      where: { userId: user.id, status: { in: ["scheduled", "failed"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, content: true, status: true, scheduledAt: true, updatedAt: true, imageData: true },
    }),
    prisma.linkedInAccount.findUnique({
      where: { userId: user.id },
      select: { displayName: true },
    }),
    prisma.autoScheduleConfig.findUnique({ where: { userId: user.id } }),
  ]);

  const carouselPosts: ScheduledPostItem[] = rawCarousel.map((p) => ({
    id: p.id,
    carouselId: p.carouselId,
    scheduledAt: p.scheduledAt.toISOString(),
    status: p.status,
    autoComment: p.autoComment,
    linkedinPostId: p.linkedinPostId,
    errorMsg: p.errorMsg,
    carousel: { id: p.carousel.id, title: p.carousel.title },
  }));

  const textPosts = rawTextPosts.map((p) => ({
    id: p.id,
    content: p.content,
    status: p.status,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
    imageData: p.imageData ?? null,
  }));

  const linkedinConnected = !!user.linkedinAccount;

  const upcomingCount =
    carouselPosts.filter((p) => p.status === "scheduled").length +
    textPosts.filter((p) => p.status === "scheduled").length;
  const postedCount = carouselPosts.filter((p) => p.status === "posted").length;
  const failedCount =
    carouselPosts.filter((p) => p.status === "failed").length +
    textPosts.filter((p) => p.status === "failed").length;

  const autoScheduleInitialConfig = autoConfig
    ? { enabled: autoConfig.enabled, postsPerDay: autoConfig.postsPerDay }
    : { enabled: false, postsPerDay: 1 };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">

      {/* Header with Auto Schedule */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-widest font-medium mb-1">Scheduled</p>
          <h1 className="text-3xl font-black tracking-tight">Scheduled Posts</h1>
          <p className="text-white/40 text-sm mt-1">Upcoming LinkedIn publications</p>
        </div>
        <div className="pt-1">
          <AutoSchedulePanel initialConfig={autoScheduleInitialConfig} />
        </div>
      </div>

      {/* LinkedIn warning */}
      {!linkedinConnected && (
        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#0A66C2]/20 border border-[#0A66C2]/30 flex items-center justify-center font-black text-[#5ba3e8] text-sm flex-shrink-0">
            in
          </div>
          <div className="flex-1">
            <p className="text-amber-300 font-semibold text-sm">LinkedIn account not connected</p>
            <p className="text-amber-200/55 text-xs mt-0.5">
              <Link href="/dashboard/settings" className="text-amber-300 underline underline-offset-2">
                Connect in Settings →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {(carouselPosts.length > 0 || textPosts.length > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Upcoming", value: upcomingCount, color: "text-blue-400" },
            { label: "Posted", value: postedCount, color: "text-green-400" },
            {
              label: "Failed",
              value: failedCount,
              color: failedCount > 0 ? "text-red-400" : "text-white/25",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 text-center"
            >
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-white/40 text-[11px] mt-0.5 uppercase tracking-widest font-medium">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Text Posts — scheduled + failed only */}
      {textPosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Text Posts</h2>
            <Link
              href="/dashboard/posts/new"
              className="text-[12px] text-white/30 hover:text-white/60 transition"
            >
              + New post
            </Link>
          </div>
          <TextPostsScheduler posts={textPosts} linkedinName={account?.displayName ?? ""} />
        </section>
      )}

      {/* Carousel scheduled posts */}
      {carouselPosts.length > 0 ? (
        <section>
          <h2 className="text-base font-bold text-white mb-4">Carousel Posts</h2>
          <ScheduledList posts={carouselPosts} />
        </section>
      ) : (
        <section className="text-center py-12 text-white/40">
          <p className="text-sm">No carousel posts scheduled</p>
        </section>
      )}
    </div>
  );
}
