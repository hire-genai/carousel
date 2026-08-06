import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Carousel Drafts — SkygenAI" };
export const dynamic = "force-dynamic";

const DEFAULT_GRADIENTS = [
  "linear-gradient(135deg,#2563EB,#4F46E5)",
  "linear-gradient(135deg,#7C3AED,#9333EA)",
  "linear-gradient(135deg,#059669,#0D9488)",
  "linear-gradient(135deg,#EA580C,#DC2626)",
  "linear-gradient(135deg,#DB2777,#E11D48)",
  "linear-gradient(135deg,#0891B2,#2563EB)",
  "linear-gradient(135deg,#D97706,#EA580C)",
  "linear-gradient(135deg,#65A30D,#059669)",
];

function getThumbGradient(slidesJson: string, index: number): string {
  try {
    const slides = JSON.parse(slidesJson);
    const first = slides[0];
    if (first?.bg && typeof first.bg === "string") return first.bg;
    const design = first?.design;
    if (design?.bgGradient) return design.bgGradient;
    if (design?.bgType === "solid" && design.bgColor)
      return `linear-gradient(135deg,${design.bgColor},${design.bgColor})`;
  } catch { /* */ }
  return DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
}

function getSlideCount(slidesJson: string): number {
  try {
    const arr = JSON.parse(slidesJson);
    return Array.isArray(arr) ? arr.length : 0;
  } catch { return 0; }
}

function getFirstHeadline(slidesJson: string): string {
  try {
    const slides = JSON.parse(slidesJson);
    const first = slides[0];
    if (!first) return "";
    if (Array.isArray(first.elements)) {
      const el = first.elements.find((e: { bold?: boolean; fontSize?: number; locked?: boolean; text?: string }) =>
        e.bold && (e.fontSize ?? 0) >= 36 && !e.locked && e.text
      );
      return el?.text?.slice(0, 80) || "";
    }
    return (first.headline as string | undefined)?.slice(0, 80) || "";
  } catch { return ""; }
}

export default async function CarouselDraftsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const carousels = await prisma.carousel.findMany({
    where: { userId: session.userId, status: "draft" },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest font-medium mb-1">Carousel Generator</p>
          <h1 className="text-2xl font-bold text-white">Drafts</h1>
        </div>
        <Link href="/dashboard/carousels/new" className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-violet-500 transition shadow-lg flex-shrink-0">
          + New Carousel
        </Link>
      </div>

      {carousels.length === 0 ? (
        <div className="text-center py-20 text-white/25">
          <p className="text-4xl mb-3">🎨</p>
          <p className="font-semibold">No carousel drafts yet</p>
          <p className="text-sm mt-1">Create a carousel and save it as draft to see it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {carousels.map((c, i) => (
            <Link key={c.id} href={`/dashboard/carousels/new?id=${c.id}`}
              className="group bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden hover:bg-white/[0.05] hover:border-white/[0.14] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 flex flex-col">
              <div
                className="w-full aspect-[4/5] relative overflow-hidden flex flex-col justify-between p-4"
                style={{ background: getThumbGradient(c.slides, i) }}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/[0.06] pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-black/[0.15] pointer-events-none" />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="px-2 py-1 rounded-lg bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">DRAFT</div>
                  <div className="px-2 py-1 rounded-lg bg-black/30 backdrop-blur text-white text-[10px] font-bold">{getSlideCount(c.slides)} slides</div>
                </div>
                {getFirstHeadline(c.slides) && (
                  <p className="relative z-10 text-white font-bold text-sm leading-snug line-clamp-4 drop-shadow-md">
                    {getFirstHeadline(c.slides)}
                  </p>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-white font-bold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-white transition-colors">
                  {c.title}
                </p>
                <div className="mt-auto">
                  <p className="text-white/30 text-[11px]">
                    {new Date(c.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
