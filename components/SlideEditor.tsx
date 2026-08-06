"use client";

import { useRef, useState } from "react";
import type { SlideDesign, FontFamily } from "@/lib/types";

type Tab = "text" | "typography" | "background" | "image";

interface Props {
  headline: string;
  body: string;
  design: SlideDesign;
  slideLabel: string;
  onUpdateText: (field: "headline" | "body", value: string) => void;
  onUpdateDesign: (d: SlideDesign) => void;
  onClose: () => void;
}

const GRADIENT_PRESETS = [
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
  "linear-gradient(135deg,#1e1e2e,#2d2d44)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#10b981,#3b82f6)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#14b8a6,#06b6d4)",
  "linear-gradient(135deg,#f97316,#fb923c)",
];

const SOLID_PRESETS = [
  "#0f0f13","#1a1a2e","#16213e","#0f3460",
  "#e63946","#2d6a4f","#f4a261","#264653",
  "#8338ec","#06d6a0","#fb5607","#3a86ff",
  "#000000","#1c1c1e","#ffffff","#f1f5f9",
];

const FONT_OPTIONS: { value: FontFamily; label: string; sample: string }[] = [
  { value: "Inter", label: "Inter", sample: "Modern & Clean" },
  { value: "Georgia", label: "Georgia", sample: "Classic Serif" },
  { value: "Oswald", label: "Oswald", sample: "Bold & Condensed" },
  { value: "Playfair Display", label: "Playfair Display", sample: "Elegant Serif" },
  { value: "Roboto Mono", label: "Roboto Mono", sample: "Code & Tech" },
  { value: "Space Grotesk", label: "Space Grotesk", sample: "Creative Modern" },
];

const HEADLINE_SIZES: { value: string; label: string }[] = [
  { value: "lg", label: "S" },
  { value: "xl", label: "M" },
  { value: "2xl", label: "L" },
  { value: "3xl", label: "XL" },
];

const BODY_SIZES: { value: string; label: string }[] = [
  { value: "xs", label: "S" },
  { value: "sm", label: "M" },
  { value: "base", label: "L" },
];

export default function SlideEditor({
  headline, body, design, slideLabel, onUpdateText, onUpdateDesign, onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>("text");
  const fileRef = useRef<HTMLInputElement>(null);

  function patch<K extends keyof SlideDesign>(key: K, val: SlideDesign[K]) {
    onUpdateDesign({ ...design, [key]: val });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      onUpdateDesign({ ...design, bgType: "image", bgImage: url });
    };
    reader.readAsDataURL(file);
  }

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "text", icon: "✏️", label: "Text" },
    { id: "typography", icon: "Aa", label: "Style" },
    { id: "background", icon: "🎨", label: "BG" },
    { id: "image", icon: "🖼️", label: "Image" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#16161e] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest font-medium">Editing</p>
          <p className="text-sm font-bold text-white mt-0.5">{slideLabel}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition flex items-center justify-center text-xs font-bold"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.08]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition flex flex-col items-center gap-0.5 ${
              tab === t.id
                ? "text-white border-b-2 border-blue-500 bg-blue-500/5"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            <span className={`leading-none ${t.id === "typography" ? "text-[11px] font-black" : "text-base"}`}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none p-5 space-y-5">

        {/* ── TEXT TAB ── */}
        {tab === "text" && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Headline</label>
                <span className="text-[10px] text-white/20">{headline.length}/80</span>
              </div>
              <textarea
                value={headline}
                onChange={(e) => onUpdateText("headline", e.target.value)}
                rows={3}
                maxLength={80}
                placeholder="Punchy, bold headline..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-white/20 transition leading-snug"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Body</label>
                <span className="text-[10px] text-white/20">{body.length}/200</span>
              </div>
              <textarea
                value={body}
                onChange={(e) => onUpdateText("body", e.target.value)}
                rows={5}
                maxLength={200}
                placeholder="Supporting detail, story or stat..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-white/20 transition leading-relaxed"
              />
            </div>
            <p className="text-[11px] text-white/20 text-center">
              You can also click directly on the slide card to edit
            </p>
          </>
        )}

        {/* ── TYPOGRAPHY TAB ── */}
        {tab === "typography" && (
          <>
            {/* Font family */}
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3">Font Family</p>
              <div className="space-y-1.5">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => patch("fontFamily", f.value)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                      design.fontFamily === f.value
                        ? "border-blue-500/50 bg-blue-500/10 text-white"
                        : "border-white/[0.08] bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                    style={{ fontFamily: f.value }}
                  >
                    <span className="text-sm font-semibold">{f.label}</span>
                    <span className="text-[11px] text-white/30" style={{ fontFamily: "Inter" }}>{f.sample}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Headline size */}
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5">Headline Size</p>
              <div className="flex gap-2">
                {HEADLINE_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => patch("headlineSize", s.value as SlideDesign["headlineSize"])}
                    className={`flex-1 h-9 rounded-lg text-sm font-bold transition-all ${
                      design.headlineSize === s.value
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-white/[0.05] text-white/40 hover:bg-white/[0.09] border border-white/[0.07]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body size */}
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5">Body Size</p>
              <div className="flex gap-2">
                {BODY_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => patch("bodySize", s.value as SlideDesign["bodySize"])}
                    className={`flex-1 h-9 rounded-lg text-sm font-bold transition-all ${
                      design.bodySize === s.value
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-white/[0.05] text-white/40 hover:bg-white/[0.09] border border-white/[0.07]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text alignment */}
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5">Text Alignment</p>
              <div className="flex gap-2">
                {(["left", "center"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => patch("textAlign", a)}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      design.textAlign === a
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-white/[0.05] text-white/40 hover:bg-white/[0.09] border border-white/[0.07]"
                    }`}
                  >
                    {a === "left" ? "⬅ Left" : "⬛ Center"}
                  </button>
                ))}
              </div>
            </div>

            {/* Text position */}
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5">Text Position</p>
              <div className="flex gap-2">
                {(["top", "middle", "bottom"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => patch("textPosition", p)}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold capitalize transition-all ${
                      design.textPosition === p
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-white/[0.05] text-white/40 hover:bg-white/[0.09] border border-white/[0.07]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Style toggles */}
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5">Headline Style</p>
              <div className="flex gap-2">
                <button
                  onClick={() => patch("headlineBold", !design.headlineBold)}
                  className={`flex-1 h-9 rounded-lg text-sm font-black transition-all ${
                    design.headlineBold
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "bg-white/[0.05] text-white/40 hover:bg-white/[0.09] border border-white/[0.07]"
                  }`}
                >
                  B
                </button>
                <button
                  onClick={() => patch("headlineItalic", !design.headlineItalic)}
                  className={`flex-1 h-9 rounded-lg text-sm italic font-semibold transition-all ${
                    design.headlineItalic
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "bg-white/[0.05] text-white/40 hover:bg-white/[0.09] border border-white/[0.07]"
                  }`}
                >
                  I
                </button>
                <button
                  onClick={() => patch("showDecos", !design.showDecos)}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${
                    design.showDecos
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "bg-white/[0.05] text-white/40 hover:bg-white/[0.09] border border-white/[0.07]"
                  }`}
                >
                  ⭕ Decos
                </button>
              </div>
            </div>

            {/* Text Color */}
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5">Text Color</p>
              <div className="flex items-center gap-3">
                <div className="flex gap-2 flex-wrap flex-1">
                  {["#ffffff", "#f1f5f9", "#fef9c3", "#fecaca", "#bfdbfe", "#bbf7d0", "#e9d5ff", "#fed7aa"].map((c) => (
                    <button
                      key={c}
                      title={c}
                      onClick={() => patch("textColor", c)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                        (design.textColor || "#ffffff") === c ? "border-white scale-110 shadow-md" : "border-transparent"
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                  <input
                    type="color"
                    value={design.textColor || "#ffffff"}
                    onChange={(e) => patch("textColor", e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-[11px] text-white/40 font-mono">{design.textColor || "#ffffff"}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── BACKGROUND TAB ── */}
        {tab === "background" && (
          <>
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
              {(["gradient", "solid"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => patch("bgType", t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition ${
                    design.bgType === t
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {design.bgType === "gradient" && (
              <div>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3">Presets</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g}
                      onClick={() => onUpdateDesign({ ...design, bgType: "gradient", bgGradient: g })}
                      className={`aspect-square rounded-xl transition-all hover:scale-105 ${
                        design.bgGradient === g
                          ? "ring-2 ring-white ring-offset-1 ring-offset-[#16161e] scale-105"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      style={{ background: g }}
                    />
                  ))}
                </div>
              </div>
            )}

            {design.bgType === "solid" && (
              <>
                <div>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3">Presets</p>
                  <div className="grid grid-cols-8 gap-2">
                    {SOLID_PRESETS.map((c) => (
                      <button
                        key={c}
                        onClick={() => onUpdateDesign({ ...design, bgType: "solid", bgColor: c })}
                        className={`aspect-square rounded-lg transition-all hover:scale-110 border border-white/10 ${
                          design.bgColor === c ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3">Custom</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={design.bgColor}
                      onChange={(e) => onUpdateDesign({ ...design, bgType: "solid", bgColor: e.target.value })}
                      className="w-12 h-10 rounded-xl border border-white/10 cursor-pointer bg-transparent p-0.5"
                    />
                    <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5">
                      <p className="text-white/50 text-[10px] uppercase tracking-widest mb-0.5">HEX</p>
                      <p className="text-white font-mono text-sm">{design.bgColor}</p>
                    </div>
                    <div className="w-12 h-10 rounded-xl border border-white/10 flex-shrink-0" style={{ background: design.bgColor }} />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── IMAGE TAB ── */}
        {tab === "image" && (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            {!design.bgImage ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-12 rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 text-white/30 hover:text-white/60 transition flex flex-col items-center gap-3 group"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">🖼️</span>
                <div className="text-center">
                  <p className="text-sm font-semibold">Click to upload image</p>
                  <p className="text-xs text-white/20 mt-1">PNG, JPG, WEBP</p>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden aspect-[4/3] border border-white/10 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={design.bgImage} alt="bg preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black transition-opacity" style={{ opacity: design.bgOverlay }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 bg-white/20 backdrop-blur text-white text-xs font-semibold rounded-lg hover:bg-white/30 transition">
                      Change
                    </button>
                  </div>
                  <button
                    onClick={() => onUpdateDesign({ ...design, bgImage: "", bgType: "gradient" })}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white text-xs hover:bg-red-600/80 transition flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Dark Overlay</p>
                    <span className="text-xs font-mono text-white/40">{Math.round(design.bgOverlay * 100)}%</span>
                  </div>
                  <input
                    type="range" min={0} max={0.9} step={0.05} value={design.bgOverlay}
                    onChange={(e) => patch("bgOverlay", parseFloat(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 rounded-full"
                  />
                </div>

                <button
                  onClick={() => onUpdateDesign({ ...design, bgType: "image" })}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition"
                >
                  ✓ Apply Image Background
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
