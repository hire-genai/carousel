"use client";

import { useEffect, useRef, useState } from "react";
import type { CarouselData, Slide, SlideDesign, FontFamily, Template } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";
import SlideEditor from "./SlideEditor";
import ExportPanel from "./ExportPanel";
import LinkedInPostModal from "./LinkedInPostModal";
import ScheduleModal from "./ScheduleModal";

interface Props {
  carousel: CarouselData;
  carouselId?: string;
  linkedinConnected?: boolean;
}

const DEFAULT_GRADIENTS = [
  "linear-gradient(135deg,#2563EB,#4F46E5)",
  "linear-gradient(135deg,#7C3AED,#9333EA)",
  "linear-gradient(135deg,#059669,#0D9488)",
  "linear-gradient(135deg,#EA580C,#DC2626)",
  "linear-gradient(135deg,#DB2777,#E11D48)",
  "linear-gradient(135deg,#0891B2,#2563EB)",
  "linear-gradient(135deg,#D97706,#EA580C)",
  "linear-gradient(135deg,#65A30D,#059669)",
  "linear-gradient(135deg,#C026D3,#DB2777)",
  "linear-gradient(135deg,#4F46E5,#7C3AED)",
];

function defaultDesign(i: number, total = 8): SlideDesign {
  // Vary layout per slide position for visual variety
  const isHook = i === 0;
  const isCta = i === total - 1;
  return {
    bgType: "gradient",
    bgGradient: DEFAULT_GRADIENTS[i % DEFAULT_GRADIENTS.length],
    bgColor: "#1a1a2e",
    bgImage: "",
    bgOverlay: 0.45,
    fontFamily: "Inter",
    headlineSize: isHook ? "3xl" : isCta ? "2xl" : "xl",
    bodySize: "sm",
    textAlign: isHook || isCta ? "center" : "left",
    textPosition: isHook ? "middle" : isCta ? "bottom" : i % 2 === 0 ? "top" : "middle",
    headlineBold: true,
    headlineItalic: false,
    showDecos: true,
    textColor: "#ffffff",
  };
}

type FullSlide = Slide & { design: SlideDesign };

function bgStyle(design: SlideDesign): React.CSSProperties {
  if (design.bgType === "image" && design.bgImage) {
    return { backgroundImage: `url(${design.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  if (design.bgType === "solid") return { background: design.bgColor };
  return { background: design.bgGradient };
}

const FONT_STACK: Record<FontFamily, string> = {
  "Inter": "Inter, system-ui, -apple-system, sans-serif",
  "Georgia": "Georgia, 'Times New Roman', serif",
  "Oswald": "Oswald, Impact, 'Arial Narrow Bold', sans-serif",
  "Playfair Display": "'Playfair Display', Georgia, serif",
  "Roboto Mono": "'Roboto Mono', 'Courier New', monospace",
  "Space Grotesk": "'Space Grotesk', system-ui, sans-serif",
};

const HSIZE: Record<string, string> = { lg: "text-xl", xl: "text-2xl", "2xl": "text-3xl", "3xl": "text-4xl" };
const BSIZE: Record<string, string> = { xs: "text-xs", sm: "text-sm", base: "text-base" };

function InlineSlidePreview({ template: tmpl }: { template: Template }) {
  const { layoutStyle, sampleHeadline, sampleBody, accentColor, tag } = tmpl;
  switch (layoutStyle) {
    case "bold-center":
      return (
        <div className="absolute inset-0 flex flex-col p-2 pb-3">
          {tag && <span className="text-[5px] font-black uppercase tracking-widest mb-1 self-start px-1 py-0.5 rounded" style={{ background: accentColor + "33", color: accentColor }}>{tag}</span>}
          <div className="flex-1 flex flex-col justify-center gap-1">
            <h3 className="text-[7.5px] font-black leading-tight text-white uppercase">{sampleHeadline}</h3>
            <div className="w-4 h-[1px] rounded" style={{ background: accentColor }} />
            <p className="text-[5.5px] text-white/50">{sampleBody}</p>
          </div>
        </div>
      );
    case "tag-headline":
      return (
        <div className="absolute inset-0 flex flex-col p-2 pb-3 gap-1">
          {tag && <span className="text-[5px] font-black uppercase tracking-widest self-start px-1 py-0.5 rounded" style={{ background: accentColor, color: "#000" }}>{tag}</span>}
          <h3 className="text-[7px] font-bold text-white leading-tight flex-1">{sampleHeadline}</h3>
          <p className="text-[5px] text-white/40">{sampleBody.slice(0, 40)}</p>
        </div>
      );
    case "minimal-left":
      return (
        <div className="absolute inset-0 flex flex-col p-2 pb-3">
          {tag && <p className="text-[4.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: accentColor }}>{tag}</p>}
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="w-3 h-[1px]" style={{ background: accentColor }} />
            <h3 className="text-[8px] font-bold text-white leading-tight">{sampleHeadline}</h3>
            <p className="text-[5.5px] text-white/45">{sampleBody}</p>
          </div>
        </div>
      );
    case "number-hero":
      return (
        <div className="absolute inset-0 flex flex-col p-2 pb-3">
          <p className="text-[18px] font-black leading-none opacity-15" style={{ color: accentColor }}>01</p>
          <div className="flex-1 flex flex-col justify-end gap-0.5">
            <h3 className="text-[6.5px] font-bold text-white leading-tight">{sampleHeadline}</h3>
            <p className="text-[5px] text-white/45">{sampleBody.slice(0, 40)}</p>
          </div>
        </div>
      );
    case "accent-word":
      return (
        <div className="absolute inset-0 flex flex-col p-2 pb-3">
          {tag && <span className="text-[4.5px] font-black uppercase tracking-widest self-start px-1 py-0.5 rounded mb-1" style={{ background: accentColor + "22", color: accentColor }}>{tag}</span>}
          <div className="flex-1 flex flex-col justify-center gap-1">
            <h3 className="text-[7px] font-black text-white leading-tight">
              {sampleHeadline.split(" ").map((w, i) => i === 2 || i === 3
                ? <span key={i} style={{ color: accentColor }}>{w} </span>
                : <span key={i}>{w} </span>
              )}
            </h3>
            <span className="text-[5.5px] font-bold px-1.5 py-0.5 rounded self-start" style={{ background: accentColor, color: "#000" }}>{sampleBody.split(".")[0]}</span>
          </div>
        </div>
      );
    case "quote-center":
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center gap-1">
          <div className="text-[14px] text-white/20 font-serif leading-none">&ldquo;</div>
          <h3 className="text-[6px] font-bold text-white leading-relaxed italic">{sampleHeadline.replace(/"/g, "")}</h3>
          <div className="w-5 h-[1px] rounded" style={{ background: accentColor }} />
          <p className="text-[5px] font-semibold" style={{ color: accentColor }}>{sampleBody}</p>
        </div>
      );
    default:
      return null;
  }
}

export default function CarouselResult({ carousel: initial, carouselId, linkedinConnected: linkedinConnectedProp = false }: Props) {
  const [slides, setSlides] = useState<FullSlide[]>(() =>
    initial.slides.map((s, i) => ({ ...s, design: (s.design as SlideDesign | undefined) ?? defaultDesign(i, initial.slides.length) }))
  );
  const [title] = useState(initial.title);
  const [activeIdx, setActiveIdx] = useState(0);
  const [editingText, setEditingText] = useState<"headline" | "body" | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteTone, setRewriteTone] = useState<"professional" | "casual" | "bold" | "storytelling">("professional");
  const [showTonePicker, setShowTonePicker] = useState(false);
  const lastSavedRef = useRef<string>("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Fetch live LinkedIn status — prop can be stale if user connected during this session
  const [linkedinConnected, setLinkedinConnected] = useState(linkedinConnectedProp);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.user?.linkedinConnected !== undefined) setLinkedinConnected(d.user.linkedinConnected); })
      .catch(() => {});
  }, []);

  // Undo / redo
  const historyRef = useRef<FullSlide[][]>([]);
  const [future, setFuture] = useState<FullSlide[][]>([]);
  const canUndo = historyRef.current.length > 0;
  const canRedo = future.length > 0;

  function commit(prev: FullSlide[]) {
    historyRef.current = [...historyRef.current.slice(-19), JSON.parse(JSON.stringify(prev))];
    setFuture([]);
  }

  function undo() {
    if (!historyRef.current.length) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setFuture((f) => [JSON.parse(JSON.stringify(slides)), ...f.slice(0, 19)]);
    setSlides(prev);
  }

  function redo() {
    if (!future.length) return;
    commit(slides);
    setSlides(future[0]);
    setFuture((f) => f.slice(1));
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); }
      if (e.key === "Escape") setShowTonePicker(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Close tone picker on outside click
  useEffect(() => {
    if (!showTonePicker) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Element;
      if (!target.closest("[data-tone-picker]")) setShowTonePicker(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showTonePicker]);

  const total = slides.length;
  const slide = slides[activeIdx];
  const slideLabel = activeIdx === 0 ? "HOOK" : activeIdx === total - 1 ? "CTA" : `SLIDE ${activeIdx + 1}`;

  function goTo(idx: number) {
    setEditingText(null);
    setActiveIdx(Math.max(0, Math.min(total - 1, idx)));
  }

  function updateText(field: "headline" | "body", value: string) {
    setSlides((prev) => prev.map((s, i) => (i === activeIdx ? { ...s, [field]: value } : s)));
  }

  function commitText() {
    commit(slides);
  }

  function updateDesign(design: SlideDesign) {
    commit(slides);
    setSlides((prev) => prev.map((s, i) => (i === activeIdx ? { ...s, design } : s)));
  }

  function applyTemplate(templateId: string) {
    const tmpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;
    commit(slides);
    setSlides((prev) =>
      prev.map((s, i) => ({
        ...s,
        design: {
          ...(s.design ?? defaultDesign(i)),
          ...tmpl.design,
          bgType: "gradient" as const,
          bgGradient: tmpl.gradients[i % tmpl.gradients.length],
        } as SlideDesign,
      }))
    );
    setShowTemplates(false);
  }

  async function applyBrandKit() {
    try {
      const res = await fetch("/api/brand");
      const data = await res.json();
      if (!data.brandKit) return;
      const bk = data.brandKit;
      commit(slides);
      setSlides((prev) =>
        prev.map((s, i) => {
          const colors: string[] = bk.colors ?? [];
          const newDesign: SlideDesign = {
            ...(s.design ?? defaultDesign(i)),
            fontFamily: (bk.headingFont ?? "Inter") as FontFamily,
          };
          if (colors.length >= 2) {
            newDesign.bgType = "gradient";
            newDesign.bgGradient = `linear-gradient(135deg,${colors[i % colors.length]},${colors[(i + 1) % colors.length]})`;
          } else if (colors.length === 1) {
            newDesign.bgType = "solid";
            newDesign.bgColor = colors[0];
          }
          return { ...s, design: newDesign };
        })
      );
    } catch {
      // silent
    }
  }

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!carouselId) return;
    const interval = setInterval(() => {
      const current = JSON.stringify(slides);
      if (current !== lastSavedRef.current && !saving) {
        handleSaveInternal(slides);
      }
    }, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides, saving, carouselId]);

  async function handleSaveInternal(slidesToSave: FullSlide[]) {
    if (!carouselId || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/carousels/${carouselId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slides: slidesToSave.map(({ headline, body, bullets, design }) => ({ headline, body, bullets, design })),
        }),
      });
      if (res.ok) {
        lastSavedRef.current = JSON.stringify(slidesToSave);
        setSavedAt(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      } else {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error ?? `Save failed (${res.status})`);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function aiRewriteSlide() {
    if (rewriting) return;
    setRewriting(true);
    setShowTonePicker(false);
    try {
      const res = await fetch("/api/rewrite-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: slide.headline,
          body: slide.body,
          tone: rewriteTone,
          carouselTitle: title,
        }),
      });
      const data = await res.json();
      if (data.headline || data.body) {
        commit(slides);
        setSlides((prev) =>
          prev.map((s, i) =>
            i === activeIdx
              ? { ...s, headline: data.headline ?? s.headline, body: data.body ?? s.body }
              : s
          )
        );
      }
    } catch { /* silent */ }
    finally { setRewriting(false); }
  }

  async function handleSave() {
    setSavedAt(null);
    await handleSaveInternal(slides);
  }

  async function copyJSON() {
    const payload = { title, slides: slides.map(({ headline, body, bullets }) => ({ headline, body, bullets })) };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Derived slide style helpers
  const hSizeClass = HSIZE[slide.design.headlineSize ?? "xl"] ?? "text-2xl";
  const bSizeClass = BSIZE[slide.design.bodySize ?? "sm"] ?? "text-sm";
  const fontStack = FONT_STACK[slide.design.fontFamily ?? "Inter"] ?? "Inter, system-ui, sans-serif";
  const alignClass = slide.design.textAlign === "center" ? "text-center items-center" : "text-left items-start";
  const posClass =
    slide.design.textPosition === "top" ? "justify-start pt-2" :
    slide.design.textPosition === "bottom" ? "justify-end pb-2" : "justify-center";

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-[0.18em] font-medium mb-1">Generated Carousel</p>
            <h2 className="text-xl font-bold text-white leading-tight">{title}</h2>
            <p className="text-sm text-white/35 mt-1">
              {total} slides &middot; <span className="text-white/20">Ctrl+Z undo · Ctrl+Y redo</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Undo / redo */}
            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.09] disabled:opacity-25 transition text-sm flex items-center justify-center"
              >↩</button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.09] disabled:opacity-25 transition text-sm flex items-center justify-center"
              >↪</button>
            </div>

            {/* AI Rewrite button */}
            <div className="relative" data-tone-picker>
              <button
                onClick={() => setShowTonePicker((v) => !v)}
                disabled={rewriting}
                className="px-3 py-2 text-sm rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-white transition font-semibold disabled:opacity-50"
                title="AI rewrite current slide"
              >
                {rewriting ? "✨ Rewriting..." : "✨ AI Rewrite"}
              </button>
              {showTonePicker && (
                <div className="absolute right-0 top-full mt-1.5 bg-[#16161e] border border-white/10 rounded-xl p-1.5 z-50 w-44 shadow-2xl">
                  <p className="text-[9px] text-white/30 uppercase tracking-widest px-2 pb-1">Tone</p>
                  {(["professional", "casual", "bold", "storytelling"] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => { setRewriteTone(tone); aiRewriteSlide(); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition capitalize ${
                        rewriteTone === tone ? "bg-violet-600/30 text-violet-200" : "text-white/60 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      {tone === "professional" ? "🎯 " : tone === "casual" ? "💬 " : tone === "bold" ? "⚡ " : "📖 "}
                      {tone}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowExport(true)}
              className="px-3 py-2 text-sm rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition font-semibold"
            >
              📤 Export
            </button>

            <button
              onClick={() => setShowLinkedIn(true)}
              className="px-3 py-2 text-sm rounded-xl border border-[#0A66C2]/40 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#60a9e8] hover:text-white transition font-semibold"
            >
              in Post
            </button>

            {carouselId && (
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  title="Save all slides"
                  className={`px-4 py-2 text-sm rounded-xl border font-semibold transition ${
                    saveError
                      ? "border-red-500/30 bg-red-500/10 text-red-400"
                      : savedAt
                      ? "border-green-500/30 bg-green-500/10 text-green-400"
                      : "border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                  } disabled:opacity-50`}
                >
                  {saving ? "Saving..." : saveError ? "✗ Error" : savedAt ? `✓ Saved All` : "💾 Save All"}
                </button>
                {saveError && <p className="text-red-400 text-[10px]">{saveError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ── Thumbnail strip ── */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {slides.map((s, i) => {
            const lbl = i === 0 ? "HOOK" : i === total - 1 ? "CTA" : `${i + 1}`;
            return (
              <div key={i} className="flex-shrink-0 relative group/thumb">
                <button
                  onClick={() => goTo(i)}
                  className={`w-[68px] aspect-[4/5] rounded-xl overflow-hidden transition-all duration-200 block ${
                    i === activeIdx
                      ? "ring-2 ring-white scale-[1.08] shadow-xl"
                      : "opacity-40 hover:opacity-80 hover:scale-[1.03]"
                  }`}
                >
                  <div className="w-full h-full p-2 flex flex-col justify-between relative" style={bgStyle(s.design)}>
                    {s.design.bgType === "image" && (
                      <div className="absolute inset-0 bg-black" style={{ opacity: s.design.bgOverlay }} />
                    )}
                    <span className="relative z-10 text-[8px] font-bold text-white/80 uppercase tracking-wide">{lbl}</span>
                    <p className="relative z-10 text-white text-[8px] font-semibold leading-tight line-clamp-3 text-left">{s.headline}</p>
                  </div>
                </button>
                {carouselId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSaveInternal(slides); goTo(i); }}
                    title="Save this slide"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 border border-white/20 text-white/60 hover:text-white hover:bg-white/10 text-[9px] px-1.5 py-0.5 rounded-md transition opacity-0 group-hover/thumb:opacity-100 whitespace-nowrap z-20"
                  >
                    💾 Save
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Main two-column ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 items-start">

          {/* LEFT — Slide card */}
          <div className="relative group/card">
            <button
              onClick={() => { setEditorOpen(true); setEditingText(null); }}
              className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur text-white text-xs font-semibold opacity-0 group-hover/card:opacity-100 transition-all hover:bg-blue-600 flex items-center gap-1.5 shadow-xl"
            >
              <span className="text-sm">✏</span> Edit Design
            </button>

            <div
              className="aspect-[4/5] rounded-2xl p-7 flex flex-col justify-between shadow-2xl shadow-black/50 relative overflow-hidden"
              style={bgStyle(slide.design)}
            >
              {slide.design.bgType === "image" && (
                <div className="absolute inset-0 bg-black" style={{ opacity: slide.design.bgOverlay }} />
              )}
              {slide.design.showDecos !== false && (
                <>
                  <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/[0.05] pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-black/[0.12] pointer-events-none" />
                </>
              )}

              {/* Top row */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest bg-white/20 text-white px-2.5 py-1 rounded-lg">
                  {slideLabel}
                </span>
                <span className="text-white/40 text-xs font-mono">{activeIdx + 1}/{total}</span>
              </div>

              {/* Content with position + alignment */}
              <div className={`relative z-10 flex-1 flex flex-col ${posClass} gap-4 py-5`} style={{ fontFamily: fontStack }}>
                <p className={`text-white/35 text-[11px] font-semibold uppercase tracking-widest ${alignClass.split(" ")[0]}`}>{title}</p>

                {/* Headline */}
                {editingText === "headline" ? (
                  <textarea
                    autoFocus
                    value={slide.headline}
                    onChange={(e) => updateText("headline", e.target.value)}
                    onBlur={() => { commitText(); setEditingText(null); }}
                    rows={3}
                    className="bg-black/25 border border-white/30 font-bold leading-tight w-full resize-none rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                    style={{ fontSize: "1.4rem", color: slide.design.textColor || "#ffffff" }}
                  />
                ) : (
                  <h3
                    onClick={() => setEditingText("headline")}
                    className={`${hSizeClass} leading-tight cursor-text rounded-xl px-3 py-2 -mx-3 hover:bg-white/10 transition-colors relative group/h ${alignClass.split(" ")[0]} ${slide.design.headlineBold !== false ? "font-black" : "font-bold"}`}
                    style={{ fontStyle: slide.design.headlineItalic ? "italic" : "normal", textAlign: slide.design.textAlign === "center" ? "center" : "left", color: slide.design.textColor || "#ffffff" }}
                  >
                    {slide.headline}
                    <span className="absolute top-2 right-2 text-[9px] text-white/25 opacity-0 group-hover/h:opacity-100 transition-opacity">✏</span>
                  </h3>
                )}

                {/* Body / Bullets */}
                {slide.bullets && slide.bullets.length > 0 ? (
                  <ul
                    onClick={() => setEditingText("body")}
                    className={`${bSizeClass} leading-relaxed cursor-text rounded-xl px-3 py-2 -mx-3 hover:bg-white/10 transition-colors relative group/b space-y-1.5`}
                    style={{ color: slide.design.textColor ? slide.design.textColor + "cc" : "rgba(255,255,255,0.8)" }}
                  >
                    {slide.bullets.map((pt, bi) => (
                      <li key={bi} className="flex items-start gap-2">
                        <span className="mt-[3px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: slide.design.textColor || "#ffffff", opacity: 0.7 }} />
                        <span>{pt}</span>
                      </li>
                    ))}
                    <span className="absolute top-2 right-2 text-[9px] text-white/25 opacity-0 group-hover/b:opacity-100 transition-opacity">✏</span>
                  </ul>
                ) : editingText === "body" ? (
                  <textarea
                    autoFocus
                    value={slide.body}
                    onChange={(e) => updateText("body", e.target.value)}
                    onBlur={() => { commitText(); setEditingText(null); }}
                    rows={4}
                    className="bg-black/25 border border-white/30 leading-relaxed w-full resize-none rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                    style={{ color: slide.design.textColor ? slide.design.textColor + "bb" : "rgba(255,255,255,0.75)" }}
                  />
                ) : (
                  <p
                    onClick={() => setEditingText("body")}
                    className={`${bSizeClass} leading-relaxed cursor-text rounded-xl px-3 py-2 -mx-3 hover:bg-white/10 transition-colors relative group/b`}
                    style={{ textAlign: slide.design.textAlign === "center" ? "center" : "left", color: slide.design.textColor ? slide.design.textColor + "bb" : "rgba(255,255,255,0.75)" }}
                  >
                    {slide.body}
                    <span className="absolute top-2 right-2 text-[9px] text-white/25 opacity-0 group-hover/b:opacity-100 transition-opacity">✏</span>
                  </p>
                )}
              </div>

              {/* Bottom */}
              <div className="relative z-10 space-y-2.5">
                <div className="flex gap-[3px]">
                  {Array.from({ length: total }).map((_, i) => (
                    <div
                      key={i}
                      onClick={() => goTo(i)}
                      className={`h-[3px] flex-1 rounded-full cursor-pointer transition-all ${
                        i === activeIdx ? "bg-white" : i < activeIdx ? "bg-white/40" : "bg-white/15"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-white/25 text-[10px] font-semibold tracking-wide">SkygenAI</p>
              </div>
            </div>
          </div>

          {/* RIGHT — Editor or Details panel */}
          {editorOpen ? (
            <SlideEditor
              headline={slide.headline}
              body={slide.body}
              design={slide.design}
              slideLabel={slideLabel}
              onUpdateText={(field, val) => updateText(field, val)}
              onUpdateDesign={(d) => updateDesign(d)}
              onClose={() => setEditorOpen(false)}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {/* Details card */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-5">
                <div>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-2">Headline</p>
                  <p className="text-white font-bold text-base leading-snug">{slide.headline}</p>
                </div>
                <div className="h-px bg-white/[0.07]" />
                <div>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-2">
                    {slide.bullets && slide.bullets.length > 0 ? "Key Points" : "Body"}
                  </p>
                  {slide.bullets && slide.bullets.length > 0 ? (
                    <ul className="space-y-2">
                      {slide.bullets.map((pt, bi) => (
                        <li key={bi} className="flex items-start gap-2 text-white/60 text-sm">
                          <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white/60 text-sm leading-relaxed">{slide.body}</p>
                  )}
                </div>
              </div>

              {/* Nav */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => goTo(activeIdx - 1)}
                  disabled={activeIdx === 0}
                  className="py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 transition text-sm font-semibold"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => goTo(activeIdx + 1)}
                  disabled={activeIdx === total - 1}
                  className="py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 transition text-sm font-semibold"
                >
                  Next →
                </button>
              </div>

              {/* Dot nav */}
              <div className="flex gap-1.5 justify-center py-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-200 ${
                      i === activeIdx ? "w-6 bg-white" : "w-2 bg-white/20 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEditorOpen(true)}
                  className="py-3 rounded-xl border border-dashed border-white/15 hover:border-blue-500/40 hover:bg-blue-500/5 text-white/30 hover:text-white/70 transition text-sm font-medium flex items-center justify-center gap-2 group"
                >
                  <span className="group-hover:scale-110 transition-transform">🎨</span> Design
                </button>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className={`py-3 rounded-xl border transition text-sm font-medium flex items-center justify-center gap-2 group ${
                    showTemplates
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                      : "border-dashed border-white/15 hover:border-blue-500/40 hover:bg-blue-500/5 text-white/30 hover:text-white/70"
                  }`}
                >
                  <span className="group-hover:scale-110 transition-transform">📋</span> Templates
                </button>
                <button
                  onClick={applyBrandKit}
                  className="py-3 rounded-xl border border-dashed border-white/15 hover:border-violet-500/40 hover:bg-violet-500/5 text-white/30 hover:text-white/70 transition text-sm font-medium flex items-center justify-center gap-2 group"
                >
                  <span className="group-hover:scale-110 transition-transform">🎯</span> Brand Kit
                </button>
                <button
                  onClick={() => setShowSchedule(true)}
                  className="py-3 rounded-xl border border-dashed border-white/15 hover:border-orange-500/40 hover:bg-orange-500/5 text-white/30 hover:text-white/70 transition text-sm font-medium flex items-center justify-center gap-2 group"
                >
                  <span className="group-hover:scale-110 transition-transform">⏰</span> Schedule
                </button>
              </div>

              <button
                onClick={copyJSON}
                className="py-2 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white/25 hover:text-white/50 hover:bg-white/[0.05] transition text-xs font-medium"
              >
                {copied ? "✓ Copied JSON" : "Copy JSON"}
              </button>
            </div>
          )}
        </div>

        {/* ── Template picker (inline) ── */}
        {showTemplates && (
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-white">Choose a Template</p>
              <button onClick={() => setShowTemplates(false)} className="text-white/30 hover:text-white text-xs transition">✕ Close</button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => applyTemplate(tmpl.id)}
                  className="group flex flex-col gap-1.5 text-left"
                  title={tmpl.name}
                >
                  <div className="w-full aspect-[4/5] rounded-xl overflow-hidden border-2 border-transparent group-hover:border-white/50 transition-all shadow-lg group-hover:scale-[1.05] relative">
                    <div className="w-full h-full relative" style={{ background: tmpl.gradients[0] }}>
                      {/* Mini layout preview */}
                      <InlineSlidePreview template={tmpl} />
                    </div>
                  </div>
                  <p className="text-[9px] text-white/40 group-hover:text-white/70 transition font-medium truncate leading-tight">{tmpl.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── All slides grid ── */}
        <details className="group">
          <summary className="text-sm text-white/25 hover:text-white/55 cursor-pointer transition font-medium select-none py-1">
            <span className="group-open:hidden">▶ View all {total} slides</span>
            <span className="hidden group-open:inline">▼ Hide</span>
          </summary>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {slides.map((s, i) => {
              const lbl = i === 0 ? "HOOK" : i === total - 1 ? "CTA" : `Slide ${i + 1}`;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    i === activeIdx
                      ? "border-white/25 bg-white/[0.07]"
                      : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: s.design.bgType === "solid" ? s.design.bgColor : s.design.bgGradient }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{lbl}</span>
                  </div>
                  <p className="text-white font-semibold text-sm mb-1.5 line-clamp-2 leading-snug">{s.headline}</p>
                  {s.bullets && s.bullets.length > 0 ? (
                    <ul className="space-y-0.5">
                      {s.bullets.slice(0, 2).map((pt, bi) => (
                        <li key={bi} className="flex items-start gap-1.5 text-white/40 text-xs">
                          <span className="mt-[4px] w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                          <span className="line-clamp-1">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{s.body}</p>
                  )}
                </button>
              );
            })}
          </div>
        </details>
      </div>

      {/* ── Modals ── */}
      {showExport && (
        <ExportPanel
          title={title}
          slides={slides}
          onClose={() => setShowExport(false)}
        />
      )}

      {showLinkedIn && (
        <LinkedInPostModal
          carouselId={carouselId ?? ""}
          title={title}
          slides={slides}
          linkedinConnected={linkedinConnected}
          onClose={() => setShowLinkedIn(false)}
        />
      )}

      {showSchedule && (
        carouselId ? (
          <ScheduleModal
            carouselId={carouselId}
            title={title}
            linkedinConnected={linkedinConnected}
            onClose={() => setShowSchedule(false)}
          />
        ) : (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#16161e] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="text-4xl mb-4">💾</div>
              <h3 className="text-lg font-bold text-white mb-2">Save first to schedule</h3>
              <p className="text-white/40 text-sm mb-6">The carousel needs to be saved before you can schedule it. Click Save above.</p>
              <button onClick={() => setShowSchedule(false)} className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition">Got it</button>
            </div>
          </div>
        )
      )}
    </>
  );
}
