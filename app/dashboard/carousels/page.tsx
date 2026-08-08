import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import CarouselsListClient from "./CarouselsListClient";

export const metadata = { title: "My Carousels — SkygenAI" };
export const dynamic = "force-dynamic";

const NON_DRAFT_STATUSES = ["complete", "scheduled", "publishing", "published", "failed"];

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

type CanvasEl = {
  id: string; x: number; y: number; w: number; h: number;
  text: string; fontSize: number; bold: boolean; italic: boolean;
  underline: boolean; strikethrough: boolean; color: string;
  fontFamily: string; textAlign: string; lineHeight?: number;
  letterSpacing?: number; textTransform?: string;
  shape?: string; fillColor?: string; borderColor?: string;
  borderWidth?: number; borderRadius?: number; locked?: boolean; rotate?: number;
};

function getSlidePreviews(slidesJson: string, fallbackGradient: string): Array<{ bg: string; elements: CanvasEl[] }> {
  try {
    const slides = JSON.parse(slidesJson);
    if (!Array.isArray(slides) || slides.length === 0) {
      return [{ bg: fallbackGradient, elements: [] }];
    }
    return slides.map((s: Record<string, unknown>) => {
      let bg = fallbackGradient;
      if (typeof s?.bg === "string") bg = s.bg as string;
      else {
        const design = s?.design as Record<string, string> | undefined;
        if (design?.bgGradient) bg = design.bgGradient;
        else if (design?.bgType === "solid" && design?.bgColor) bg = design.bgColor;
      }
      const elements = Array.isArray(s?.elements) ? (s.elements as CanvasEl[]) : [];
      return { bg, elements: elements ?? [] };
    });
  } catch {
    return [{ bg: fallbackGradient, elements: [] }];
  }
}

export default async function MyCarouselsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const carousels = await prisma.carousel.findMany({
    where: { userId: session.userId, status: { in: NON_DRAFT_STATUSES } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slides: true, status: true, updatedAt: true, caption: true },
  });

  const carouselsData = carousels.map((c, i) => {
    const slidePreviews = getSlidePreviews(c.slides, DEFAULT_GRADIENTS[i % DEFAULT_GRADIENTS.length]);
    return { ...c, slidePreviews, slideCount: slidePreviews.length };
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest font-medium mb-1">My Carousels</p>
          <h1 className="text-2xl font-bold text-white">My Carousels</h1>
          <p className="text-white/40 text-sm mt-1">Complete, scheduled, and published carousels</p>
        </div>
        <Link
          href="/dashboard/carousels/new"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-violet-500 transition shadow-lg"
        >
          + Create New
        </Link>
      </div>

      {carousels.length === 0 ? (
        <div className="text-center py-20 text-white/25">
          <p className="text-4xl mb-3">🎨</p>
          <p className="font-semibold">No carousels here yet</p>
          <p className="text-sm mt-1">Save a carousel as Complete to see it here</p>
          <Link
            href="/dashboard/carousels/new"
            className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-sm font-semibold transition"
          >
            Create Your First Carousel
          </Link>
        </div>
      ) : (
        <CarouselsListClient carousels={carouselsData} />
      )}
    </div>
  );
}
