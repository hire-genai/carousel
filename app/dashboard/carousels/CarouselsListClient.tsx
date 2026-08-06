"use client";

import { useState } from "react";
import Link from "next/link";
import SchedulePickerModal from "@/components/SchedulePickerModal";

type CanvasEl = {
  id: string; x: number; y: number; w: number; h: number;
  text: string; fontSize: number; bold: boolean; italic: boolean;
  underline: boolean; strikethrough: boolean; color: string;
  fontFamily: string; textAlign: string; lineHeight?: number;
  letterSpacing?: number; textTransform?: string;
  shape?: string; fillColor?: string; borderColor?: string;
  borderWidth?: number; borderRadius?: number; locked?: boolean; rotate?: number;
};

interface SlidePreview {
  bg: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any[];
}

interface Carousel {
  id: string;
  title: string;
  slides: string;
  status: string;
  updatedAt: Date;
  slideCount: number;
  slidePreviews: SlidePreview[];
  caption: string | null;
}

interface Props {
  carousels: Carousel[];
}

const STATUS_STYLES: Record<string, string> = {
  complete: "bg-blue-500/15 text-blue-400",
  scheduled: "bg-amber-500/15 text-amber-400",
  publishing: "bg-violet-500/15 text-violet-400",
  published: "bg-green-500/15 text-green-400",
  failed: "bg-red-500/15 text-red-400",
};

const CANVAS_W = 540;
const CANVAS_H = 675;

function MiniSlide({ slide, width = 360 }: { slide: SlidePreview; width?: number }) {
  const scale = width / CANVAS_W;
  const elements = slide.elements ?? [];

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
      <div
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          background: slide.bg,
        }}
      >
        {elements.map((el) => {
          const shape = el.shape;
          const isShape = shape && shape !== "text";

          const base: React.CSSProperties = {
            position: "absolute",
            left: el.x,
            top: el.y,
            width: el.w,
            boxSizing: "border-box",
            transform: el.rotate ? `rotate(${el.rotate}deg)` : undefined,
            overflow: "hidden",
          };

          if (isShape) {
            base.height = el.h;
            if (shape === "ring") {
              Object.assign(base, {
                background: "transparent",
                borderRadius: "50%",
                border: `${el.borderWidth ?? 4}px solid ${el.borderColor ?? "rgba(255,255,255,0.25)"}`,
              });
            } else if (shape === "bar") {
              Object.assign(base, {
                background: el.fillColor === "transparent" ? "rgba(255,255,255,0.35)" : el.fillColor,
                borderRadius: `${el.borderRadius ?? 999}px`,
              });
            } else if (shape === "circle") {
              Object.assign(base, { background: el.fillColor, borderRadius: "50%" });
            } else if (shape === "chip") {
              Object.assign(base, {
                background: el.fillColor === "transparent" ? "transparent" : (el.fillColor ?? "transparent"),
                borderRadius: `${el.borderRadius ?? 6}px`,
                padding: "4px 8px",
                border: el.borderColor ? `${el.borderWidth ?? 1}px solid ${el.borderColor}` : undefined,
              });
            } else {
              Object.assign(base, {
                background: el.fillColor === "transparent" ? "transparent" : (el.fillColor ?? "transparent"),
                borderRadius: "4px",
              });
            }

            if (shape === "ring" || shape === "bar") {
              return <div key={el.id} style={base} />;
            }
          } else {
            base.minHeight = el.h;
          }

          // Text styles
          const textStyle: React.CSSProperties = {
            ...base,
            color: el.color,
            fontFamily: `${el.fontFamily ?? "Inter"}, sans-serif`,
            fontSize: el.fontSize,
            fontWeight: el.bold ? "bold" : "normal",
            fontStyle: el.italic ? "italic" : "normal",
            textAlign: el.textAlign as React.CSSProperties["textAlign"],
            lineHeight: el.lineHeight ?? 1.35,
            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : "normal",
            textTransform: (el.textTransform ?? "none") as React.CSSProperties["textTransform"],
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            padding: "4px 6px",
            display: "flex",
            flexDirection: "column",
            justifyContent: (shape === "circle" || shape === "chip") ? "center" : "flex-start",
            alignItems: el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
            textDecoration: [el.underline && "underline", el.strikethrough && "line-through"].filter(Boolean).join(" ") || undefined,
          };

          if (isShape) {
            textStyle.height = el.h;
          }

          return (
            <div key={el.id} style={textStyle}>
              {el.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CarouselsListClient({ carousels }: Props) {
  const [scheduleOpen, setScheduleOpen] = useState<string | null>(null);
  const [activeSlides, setActiveSlides] = useState<Record<string, number>>({});
  const [publishedModal, setPublishedModal] = useState<Carousel | null>(null);

  function getIdx(carouselId: string, total: number): number {
    return ((activeSlides[carouselId] ?? 0) + total) % total;
  }

  function prev(e: React.MouseEvent, carouselId: string, total: number) {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlides((s) => ({ ...s, [carouselId]: (((s[carouselId] ?? 0) - 1) + total) % total }));
  }

  function next(e: React.MouseEvent, carouselId: string, total: number) {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlides((s) => ({ ...s, [carouselId]: ((s[carouselId] ?? 0) + 1) % total }));
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {carousels.map((c) => {
          const total = c.slidePreviews.length;
          const idx = getIdx(c.id, total);
          const current = c.slidePreviews[idx];

          const isPublished = c.status === "published";

          return (
            <div
              key={c.id}
              className="group bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden hover:bg-white/[0.05] hover:border-white/[0.14] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 flex flex-col"
            >
              {/* ── Thumbnail ── */}
              <div className="relative w-full aspect-[4/5] overflow-hidden">
                {/* Clickable area → published = preview modal, others = editor */}
                {isPublished
                  ? <button onClick={() => setPublishedModal(c)} className="absolute inset-0 z-0 cursor-pointer" />
                  : <Link href={`/dashboard/carousels/new?id=${c.id}`} className="absolute inset-0 z-0" />
                }

                {/* Mini slide renderer */}
                <div className="absolute inset-0 z-0 pointer-events-none w-full h-full">
                  <MiniSlide slide={current} />
                </div>

                {/* Top row: status + slide count */}
                <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between">
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[c.status] ?? "bg-white/20 text-white"}`}>
                    {c.status}
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-black/30 backdrop-blur text-white text-[10px] font-bold">
                    {idx + 1} / {total}
                  </div>
                </div>

                {/* Dot indicators */}
                {total > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-1">
                    {c.slidePreviews.map((_, i) => (
                      <div
                        key={i}
                        className={`h-[3px] rounded-full transition-all duration-200 ${i === idx ? "w-4 bg-white" : "w-2 bg-white/30"}`}
                      />
                    ))}
                  </div>
                )}

                {/* Left / Right arrows */}
                {total > 1 && (
                  <>
                    <button
                      onClick={(e) => prev(e, c.id, total)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white/80 hover:bg-black/60 hover:text-white transition opacity-0 group-hover:opacity-100"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <button
                      onClick={(e) => next(e, c.id, total)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white/80 hover:bg-black/60 hover:text-white transition opacity-0 group-hover:opacity-100"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </>
                )}
              </div>

              {/* ── Card footer ── */}
              <div className="p-4 flex-1 flex flex-col">
                {isPublished ? (
                  <button
                    onClick={() => setPublishedModal(c)}
                    className="text-white font-bold text-sm leading-snug line-clamp-2 mb-2 text-left hover:text-green-300 transition-colors"
                  >
                    {c.title}
                  </button>
                ) : (
                  <Link
                    href={`/dashboard/carousels/new?id=${c.id}`}
                    className="text-white font-bold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-white transition-colors hover:text-blue-300"
                  >
                    {c.title}
                  </Link>
                )}
                <div className="mt-auto flex items-center justify-between">
                  <p className="text-white/30 text-[11px]">
                    {new Date(c.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <div className="flex items-center gap-2">
                    {c.status === "complete" && (
                      <button
                        onClick={() => setScheduleOpen(c.id)}
                        className="text-[10px] text-amber-400/70 hover:text-amber-300 font-semibold transition px-2 py-1 rounded-lg hover:bg-amber-500/[0.1] border border-amber-500/20"
                        title="Schedule this carousel"
                      >
                        ⏰
                      </button>
                    )}
                    {!isPublished && (
                      <Link href={`/dashboard/carousels/new?id=${c.id}`} className="text-white/25 group-hover:text-white/50 text-xs transition">✏</Link>
                    )}
                    {isPublished && (
                      <button onClick={() => setPublishedModal(c)} className="text-[10px] text-green-400/70 hover:text-green-300 font-semibold transition px-2 py-1 rounded-lg hover:bg-green-500/[0.1] border border-green-500/20">
                        🔗 View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Published carousel preview modal ── */}
      {publishedModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPublishedModal(null)}
        >
          <div
            className="bg-[#16161e] border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center text-white text-sm font-bold">in</div>
                <div>
                  <p className="text-white font-semibold text-sm">LinkedIn Carousel</p>
                  <p className="text-white/35 text-[11px]">Published successfully</p>
                </div>
              </div>
              <button onClick={() => setPublishedModal(null)} className="text-white/30 hover:text-white/70 transition text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06]">✕</button>
            </div>

            {/* Slide thumbnails row */}
            <div className="px-6 pt-5">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">Slides ({publishedModal.slidePreviews.length})</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {publishedModal.slidePreviews.map((slide, i) => (
                  <div key={i} className="flex-shrink-0 rounded-xl overflow-hidden border border-white/[0.1]" style={{ width: 120, height: 150 }}>
                    <MiniSlide slide={slide} width={120} />
                  </div>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div className="px-6 py-4 max-h-48 overflow-y-auto">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">LinkedIn Caption</p>
              {publishedModal.caption ? (
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{publishedModal.caption}</p>
              ) : (
                <p className="text-white/25 text-sm italic">No caption saved</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 pt-3 border-t border-white/[0.07] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-green-400 text-[11px] font-semibold">Successfully posted to LinkedIn</span>
            </div>
          </div>
        </div>
      )}

      {scheduleOpen && (
        <SchedulePickerModal
          onClose={() => setScheduleOpen(null)}
          preselectedId={scheduleOpen}
          preselectedTitle={carousels.find((c) => c.id === scheduleOpen)?.title ?? ""}
        />
      )}
    </>
  );
}
