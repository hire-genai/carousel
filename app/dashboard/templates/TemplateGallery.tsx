"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";
import type { Template } from "@/lib/types";

type GalleryTab = "templates" | "drafts" | "saved" | "trash";
type Category = "all" | "professional" | "bold" | "minimal" | "colorful" | "dark";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "professional", label: "Professional" },
  { key: "bold", label: "Bold" },
  { key: "minimal", label: "Minimal" },
  { key: "colorful", label: "Colorful" },
  { key: "dark", label: "Dark" },
];

export default function TemplateGallery() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<GalleryTab>("templates");
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered =
    activeCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f13] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-white mb-1">Templates</h1>
        <p className="text-sm text-white/40">Choose a template to start creating your carousel</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 pb-4 border-b border-white/[0.06] shrink-0">
        {(["templates", "drafts", "saved", "trash"] as GalleryTab[]).map((tab) => {
          const labels: Record<GalleryTab, string> = {
            templates: `Templates (${TEMPLATES.length})`,
            drafts: "Drafts",
            saved: "Saved",
            trash: "Trash",
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "templates" ? (
          <>
            {/* Category filter */}
            <div className="flex items-center gap-2 px-6 py-4 overflow-x-auto shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    activeCategory === cat.key
                      ? "bg-white text-black"
                      : "bg-white/[0.06] text-white/50 hover:bg-white/[0.10] hover:text-white/80"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 px-6 pb-8">
              {filtered.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  onUse={() => router.push(`/dashboard/carousels/new?template=${tpl.id}`)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                <path d="M20 11.08V8l-6-6H6a2 2 0 00-2 2v16a2 2 0 002 2h6" />
                <path d="M14 3v5h5" />
                <circle cx="18" cy="18" r="3" />
                <path d="M18 14v1" />
              </svg>
            </div>
            <p className="text-white/30 text-sm">No {activeTab} yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ template, onUse }: { template: Template; onUse: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onUse}
    >
      <div
        className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-lg shadow-black/40 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/60 group-hover:border-white/20"
        style={{ aspectRatio: "0.75/1" }}
      >
        <TemplatePreview template={template} />

        {/* Bottom banner — Use Template */}
        <div
          className={`absolute inset-x-0 bottom-0 pt-16 pb-5 flex justify-center bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none transition-opacity duration-300 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="pointer-events-auto px-5 py-2 rounded-full bg-white text-black text-[12px] font-bold shadow-xl tracking-wide">
            Use Template
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="mt-3 px-1">
        <p className="text-white/90 text-[13px] font-semibold truncate">{template.name}</p>
        <p className="text-white/40 text-[11px] mt-0.5 truncate">{template.description}</p>
      </div>
    </div>
  );
}

// ── Preview: renders a real designed slide based on layoutStyle ─────────────
function TemplatePreview({ template }: { template: Template }) {
  const { gradients, accentColor, sampleHeadline, sampleBody, tag, design, layoutStyle, bulletPoints } = template;
  const fontFamily = design.fontFamily ?? "Inter";
  const italic = design.headlineItalic ?? false;
  const gradient = gradients[0];

  const baseStyle: React.CSSProperties = {
    background: gradient,
    fontFamily: `${fontFamily}, sans-serif`,
  };

  // ── Layout: profile-card — numbered slide with avatar + handle ───────────
  if (layoutStyle === "profile-card") {
    const handle = tag ?? "@creator";
    const initial = handle.replace("@", "")[0]?.toUpperCase() ?? "C";
    const footer = bulletPoints?.[0] ?? "Keep building.";
    return (
      <div className="w-full h-full flex flex-col" style={{ background: gradient, fontFamily: `${fontFamily}, sans-serif` }}>
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[7px] font-black"
              style={{ background: accentColor, color: "#000" }}
            >
              {initial}
            </div>
            <div>
              <p className="text-white text-[7.5px] font-semibold leading-none">{handle}</p>
              <p className="text-[6px] leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{handle.toLowerCase()}</p>
            </div>
          </div>
          <span
            className="font-black leading-none"
            style={{ fontSize: "clamp(20px, 4.5vw, 32px)", color: "rgba(255,255,255,0.08)" }}
          >
            01
          </span>
        </div>
        {/* Headline + body */}
        <div className="flex-1 flex flex-col justify-center px-4 gap-2">
          <p
            className="text-white leading-[1.2]"
            style={{ fontSize: "clamp(13px, 2.7vw, 18px)", fontWeight: 800 }}
          >
            {sampleHeadline}
          </p>
          <p
            className="leading-snug"
            style={{ fontSize: "clamp(7px, 1.4vw, 10px)", color: "rgba(255,255,255,0.5)" }}
          >
            {sampleBody}
          </p>
        </div>
        {/* Footer tagline */}
        <div className="px-4 pb-4">
          <span className="text-[7.5px] font-semibold" style={{ color: accentColor }}>
            {`// ${footer}`}
          </span>
        </div>
      </div>
    );
  }

  // ── Layout: arrow-list — bright bg + big headline + → bullets ────────────
  if (layoutStyle === "arrow-list") {
    const handle = tag ?? "@creator";
    const bullets = bulletPoints ?? [sampleBody];
    return (
      <div
        className="w-full h-full p-4 flex flex-col relative overflow-hidden"
        style={{ background: gradient, fontFamily: `${fontFamily}, sans-serif` }}
      >
        {/* Decorative corner circle */}
        <div
          className="absolute -top-7 -right-7 w-20 h-20 rounded-full border-[3px] pointer-events-none"
          style={{ borderColor: "rgba(255,255,255,0.22)" }}
        />
        {/* Handle */}
        <span className="text-[7.5px] font-bold tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.75)" }}>
          {handle}
        </span>
        {/* Big uppercase headline */}
        <div className="flex-1 flex flex-col justify-center">
          <p
            className="text-white leading-[1.05]"
            style={{
              fontSize: "clamp(14px, 3.2vw, 22px)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.015em",
            }}
          >
            {sampleHeadline}
          </p>
        </div>
        {/* Arrow bullet list */}
        <div className="flex flex-col gap-1 mb-2.5">
          {bullets.slice(0, 3).map((b, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[9px] font-black leading-[1.5]" style={{ color: "rgba(255,255,255,0.9)" }}>→</span>
              <span className="text-[7.5px] leading-snug" style={{ color: "rgba(255,255,255,0.80)" }}>{b}</span>
            </div>
          ))}
        </div>
        {/* Bottom accent strip + chevrons */}
        <div className="flex items-center justify-between">
          <div className="h-0.5 w-8 rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />
          <span className="text-[8px] font-black tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{">>>>"}</span>
        </div>
      </div>
    );
  }

  // ── Layout: bold-center — massive uppercase headline ──────────────────────
  if (layoutStyle === "bold-center") {
    return (
      <div className="w-full h-full p-5 flex flex-col relative" style={baseStyle}>
        {tag && (
          <div className="text-center">
            <span
              className="inline-block text-[8px] font-bold tracking-[0.2em] uppercase px-2 py-1 rounded"
              style={{ color: accentColor, border: `1px solid ${accentColor}55` }}
            >
              {tag}
            </span>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2.5">
          <p
            className="text-white leading-[1.05]"
            style={{
              fontSize: "clamp(15px, 3.8vw, 24px)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.01em",
            }}
          >
            {sampleHeadline}
          </p>
          <p
            className="leading-snug px-2"
            style={{
              fontSize: "clamp(8px, 1.6vw, 11px)",
              color: "rgba(255,255,255,0.65)",
              fontWeight: 500,
            }}
          >
            {sampleBody}
          </p>
        </div>
        <BottomBar accent={accentColor} />
      </div>
    );
  }

  // ── Layout: quote-center — italic serif quote ─────────────────────────────
  if (layoutStyle === "quote-center") {
    return (
      <div className="w-full h-full p-5 flex flex-col relative" style={baseStyle}>
        <div className="text-center">
          <span style={{ color: accentColor, fontSize: 32, fontWeight: 700, lineHeight: 1, fontFamily: "Georgia, serif" }}>
            &ldquo;
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 -mt-3">
          <p
            className="text-white leading-[1.15] px-1"
            style={{
              fontSize: "clamp(13px, 3vw, 19px)",
              fontWeight: 700,
              fontStyle: "italic",
              fontFamily: "Georgia, serif",
            }}
          >
            {sampleHeadline}
          </p>
          <p
            className="leading-snug"
            style={{
              fontSize: "clamp(8px, 1.5vw, 10px)",
              color: "rgba(255,255,255,0.6)",
              fontStyle: "italic",
            }}
          >
            {sampleBody}
          </p>
        </div>
        <BottomBar accent={accentColor} />
      </div>
    );
  }

  // ── Layout: number-hero — large number/rank feel ──────────────────────────
  if (layoutStyle === "number-hero") {
    const num = sampleHeadline.match(/^\d+/)?.[0] ?? "01";
    const rest = sampleHeadline.replace(/^\d+\s*/, "").trim() || sampleHeadline;
    return (
      <div className="w-full h-full p-5 flex flex-col relative" style={baseStyle}>
        {tag && (
          <span
            className="self-start text-[8px] font-bold tracking-[0.18em] uppercase px-2 py-1 rounded"
            style={{ color: accentColor, background: `${accentColor}18` }}
          >
            {tag}
          </span>
        )}
        <div className="flex-1 flex flex-col justify-center gap-2">
          <p
            className="leading-none"
            style={{
              fontSize: "clamp(38px, 9vw, 62px)",
              fontWeight: 900,
              color: accentColor,
              fontFamily: `${fontFamily}, sans-serif`,
              letterSpacing: "-0.03em",
            }}
          >
            {num}
          </p>
          <p
            className="text-white leading-[1.15]"
            style={{
              fontSize: "clamp(11px, 2.2vw, 15px)",
              fontWeight: 800,
            }}
          >
            {rest}
          </p>
          <p
            className="leading-snug mt-1"
            style={{
              fontSize: "clamp(8px, 1.5vw, 10px)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {sampleBody}
          </p>
        </div>
        <BottomBar accent={accentColor} />
      </div>
    );
  }

  // ── Layout: accent-word — headline with body highlighted in accent ────────
  if (layoutStyle === "accent-word") {
    return (
      <div className="w-full h-full p-5 flex flex-col relative" style={baseStyle}>
        {tag && (
          <span
            className="self-start text-[8px] font-bold tracking-[0.18em] uppercase px-2 py-1 rounded"
            style={{ color: accentColor, background: `${accentColor}18` }}
          >
            {tag}
          </span>
        )}
        <div className="flex-1 flex flex-col justify-center gap-2">
          <p
            className="text-white leading-[1.15]"
            style={{ fontSize: "clamp(13px, 2.6vw, 18px)", fontWeight: 800, fontStyle: italic ? "italic" : "normal" }}
          >
            {sampleHeadline}
          </p>
          <p
            className="leading-snug"
            style={{
              fontSize: "clamp(9px, 1.9vw, 13px)",
              color: accentColor,
              fontWeight: 700,
            }}
          >
            {sampleBody}
          </p>
        </div>
        <BottomBar accent={accentColor} />
      </div>
    );
  }

  // ── Layout: minimal-left ──────────────────────────────────────────────────
  if (layoutStyle === "minimal-left") {
    return (
      <div className="w-full h-full p-5 flex flex-col relative" style={baseStyle}>
        {tag && (
          <span
            className="self-start text-[8px] font-bold tracking-[0.18em] uppercase mb-1"
            style={{ color: accentColor }}
          >
            {tag}
          </span>
        )}
        <div className="flex-1 flex flex-col justify-center gap-2.5">
          <div className="w-6 h-0.5 rounded-full mb-1" style={{ background: accentColor }} />
          <p
            className="text-white leading-[1.2]"
            style={{
              fontSize: "clamp(13px, 2.8vw, 20px)",
              fontWeight: 700,
              fontStyle: italic ? "italic" : "normal",
            }}
          >
            {sampleHeadline}
          </p>
          <p
            className="leading-snug"
            style={{
              fontSize: "clamp(8px, 1.6vw, 11px)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {sampleBody}
          </p>
        </div>
        <BottomBar accent={accentColor} />
      </div>
    );
  }

  // ── Layout: tag-headline (default) ────────────────────────────────────────
  return (
    <div className="w-full h-full p-5 flex flex-col relative" style={baseStyle}>
      {tag && (
        <span
          className="self-start text-[8px] font-bold tracking-[0.2em] uppercase px-2 py-1 rounded"
          style={{ color: accentColor, background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
        >
          {tag}
        </span>
      )}
      <div className="flex-1 flex flex-col justify-center gap-2">
        <p
          className="text-white leading-[1.15]"
          style={{
            fontSize: "clamp(13px, 2.8vw, 20px)",
            fontWeight: 800,
            fontStyle: italic ? "italic" : "normal",
          }}
        >
          {sampleHeadline}
        </p>
        <p
          className="leading-snug"
          style={{
            fontSize: "clamp(8px, 1.6vw, 11px)",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          {sampleBody}
        </p>
      </div>
      <BottomBar accent={accentColor} />
    </div>
  );
}

function BottomBar({ accent }: { accent: string }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div className="flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full" style={{ background: accent }} />
        <div className="w-1 h-1 rounded-full bg-white/25" />
        <div className="w-1 h-1 rounded-full bg-white/25" />
      </div>
      <span className="text-[7px] font-bold tracking-[0.2em] text-white/25 uppercase">SkygenAI</span>
    </div>
  );
}
