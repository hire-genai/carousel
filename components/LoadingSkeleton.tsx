"use client";

// Usage:
//   <LoadingSkeleton type="carousel-grid" />
//   <LoadingSkeleton type="carousel-card" />
//   <LoadingSkeleton type="text-block" rows={3} />

interface Props {
  type: "carousel-grid" | "carousel-card" | "text-block";
  rows?: number;
}

// ─── Carousel card skeleton ───────────────────────────────────────────────────

function CarouselCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#16161e] border border-white/[0.06] overflow-hidden">
      {/* Slide preview */}
      <div className="aspect-[4/3] bg-white/[0.06] animate-pulse" />

      {/* Footer */}
      <div className="p-4 flex flex-col gap-2.5">
        {/* Title line */}
        <div className="h-3.5 bg-white/[0.06] animate-pulse rounded-lg w-3/4" />
        {/* Meta row */}
        <div className="flex items-center gap-2 mt-0.5">
          <div className="h-2.5 bg-white/[0.06] animate-pulse rounded-lg w-14" />
          <div className="h-2.5 bg-white/[0.06] animate-pulse rounded-lg w-20" />
        </div>
        {/* Action row */}
        <div className="flex items-center gap-2 pt-1">
          <div className="h-7 bg-white/[0.06] animate-pulse rounded-lg flex-1" />
          <div className="h-7 w-7 bg-white/[0.06] animate-pulse rounded-lg shrink-0" />
        </div>
      </div>
    </div>
  );
}

// ─── Text block skeleton ──────────────────────────────────────────────────────

const LINE_WIDTHS = [
  "w-full",
  "w-5/6",
  "w-4/6",
  "w-full",
  "w-3/4",
  "w-5/6",
  "w-full",
  "w-2/3",
];

function TextBlockSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`h-3 bg-white/[0.06] animate-pulse rounded-lg ${
            LINE_WIDTHS[i % LINE_WIDTHS.length]
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LoadingSkeleton({ type, rows = 3 }: Props) {
  if (type === "carousel-card") {
    return <CarouselCardSkeleton />;
  }

  if (type === "carousel-grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CarouselCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // type === "text-block"
  return <TextBlockSkeleton rows={rows} />;
}
