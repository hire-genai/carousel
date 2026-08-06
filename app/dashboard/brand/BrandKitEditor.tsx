"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import type { BrandKitData, FontFamily } from "@/lib/types";

const FONT_OPTIONS: FontFamily[] = [
  "Inter",
  "Georgia",
  "Oswald",
  "Playfair Display",
  "Roboto Mono",
  "Space Grotesk",
];

// Georgia is a system font; Inter is loaded by the app. Only load the rest from Google Fonts.
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Oswald:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap";

interface Props {
  initialData: BrandKitData;
}

export default function BrandKitEditor({ initialData }: Props) {
  const [data, setData] = useState<BrandKitData>(initialData);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inject Google Fonts once on mount
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // ── Logo ──────────────────────────────────────────────────────────────────

  function handleLogoFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setData((d) => ({ ...d, logoData: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setData((d) => ({ ...d, logoData: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Colors ────────────────────────────────────────────────────────────────

  function updateColor(index: number, value: string) {
    const next = [...data.colors];
    next[index] = value;
    setData((d) => ({ ...d, colors: next }));
  }

  function addColor() {
    if (data.colors.length >= 5) return;
    setData((d) => ({ ...d, colors: [...d.colors, "#6366f1"] }));
  }

  function removeColor(index: number) {
    setData((d) => ({ ...d, colors: d.colors.filter((_, i) => i !== index) }));
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch {
      alert("Failed to save brand kit. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const previewBg =
    data.colors.length >= 2
      ? `linear-gradient(135deg, ${data.colors[0]}, ${data.colors[1]})`
      : data.colors.length === 1
      ? `linear-gradient(135deg, ${data.colors[0]}, ${data.colors[0]}88)`
      : "linear-gradient(135deg, #1e1b4b, #312e81)";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── LOGO ── */}
      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-bold text-base mb-0.5">Logo</h2>
        <p className="text-white/40 text-xs mb-5">
          PNG, SVG, or JPG recommended — max 2 MB. Stored as base64 and applied to every slide.
        </p>

        {data.logoData ? (
          <div className="flex items-center gap-5">
            <div className="w-28 h-28 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.logoData}
                alt="Logo preview"
                className="max-w-full max-h-full object-contain p-2"
              />
            </div>
            <div className="space-y-3">
              <p className="text-white/60 text-sm">Logo uploaded successfully</p>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/70 hover:bg-white/10 hover:text-white text-sm font-medium transition"
                >
                  Replace
                </button>
                <button
                  onClick={removeLogo}
                  className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-sm font-medium transition"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-white/20 hover:bg-white/[0.02] transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition">
              <svg
                className="w-6 h-6 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm font-medium">Click to upload logo</p>
              <p className="text-white/30 text-xs mt-0.5">PNG, JPG, SVG — max 2 MB</p>
            </div>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoFile}
          className="hidden"
        />
      </section>

      {/* ── BRAND COLORS ── */}
      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-0.5">
          <h2 className="text-white font-bold text-base">Brand Colors</h2>
          <span className="text-white/30 text-xs tabular-nums">{data.colors.length} / 5</span>
        </div>
        <p className="text-white/40 text-xs mb-6">
          Up to 5 colors. Click a swatch to open the color picker; hover to reveal the remove button.
        </p>

        <div className="flex flex-wrap gap-4 items-end">
          {data.colors.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="relative group">
                {/* Colored swatch — the color input overlays it */}
                <div
                  className="w-14 h-14 rounded-xl border-2 border-white/10 shadow-inner cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: color }}
                />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-xl"
                  title="Pick color"
                />
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeColor(i)}
                  className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-neutral-800 border border-white/20 text-white/60 hover:text-white hover:bg-red-500/90 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove color"
                >
                  ×
                </button>
              </div>
              <span className="text-white/40 text-[10px] font-mono uppercase tracking-wide">
                {color}
              </span>
            </div>
          ))}

          {data.colors.length < 5 && (
            <button
              type="button"
              onClick={addColor}
              title="Add color"
              className="w-14 h-14 rounded-xl border-2 border-dashed border-white/15 flex items-center justify-center text-white/30 hover:border-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all text-2xl font-light leading-none"
            >
              +
            </button>
          )}
        </div>
      </section>

      {/* ── TYPOGRAPHY ── */}
      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-bold text-base mb-0.5">Typography</h2>
        <p className="text-white/40 text-xs mb-6">
          Select fonts for headings and body copy. Preview updates instantly below each selector.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Heading font */}
          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">
              Heading Font
            </label>
            <div className="relative">
              <select
                value={data.headingFont}
                onChange={(e) =>
                  setData((d) => ({ ...d, headingFont: e.target.value as FontFamily }))
                }
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-white/20 cursor-pointer appearance-none pr-10 [color-scheme:dark]"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f} className="bg-[#1a1a22]">
                    {f}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div
              className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] min-h-[80px] flex flex-col justify-center"
              style={{ fontFamily: data.headingFont }}
            >
              <p className="text-white text-xl font-bold leading-snug">
                The quick brown fox
              </p>
              <p
                className="text-white/30 text-[10px] mt-1.5 uppercase tracking-widest"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {data.headingFont}
              </p>
            </div>
          </div>

          {/* Body font */}
          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">
              Body Font
            </label>
            <div className="relative">
              <select
                value={data.bodyFont}
                onChange={(e) =>
                  setData((d) => ({ ...d, bodyFont: e.target.value as FontFamily }))
                }
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-white/20 cursor-pointer appearance-none pr-10 [color-scheme:dark]"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f} className="bg-[#1a1a22]">
                    {f}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div
              className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] min-h-[80px] flex flex-col justify-center"
              style={{ fontFamily: data.bodyFont }}
            >
              <p className="text-white/80 text-sm leading-relaxed">
                Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly.
              </p>
              <p
                className="text-white/30 text-[10px] mt-1.5 uppercase tracking-widest"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {data.bodyFont}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACCENT COLOR ── */}
      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-bold text-base mb-0.5">Accent Color</h2>
        <p className="text-white/40 text-xs mb-5">
          Used for headlines, highlights, CTA labels, and decorative elements on slides.
        </p>

        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className="w-14 h-14 rounded-xl border-2 border-white/10 shadow-lg cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: data.accentColor }}
            />
            <input
              type="color"
              value={data.accentColor}
              onChange={(e) => setData((d) => ({ ...d, accentColor: e.target.value }))}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-xl"
              title="Pick accent color"
            />
          </div>
          <div>
            <p className="text-white font-mono text-sm tracking-wide">
              {data.accentColor.toUpperCase()}
            </p>
            <p className="text-white/40 text-xs mt-0.5">Click swatch to change</p>
          </div>
          {/* Contrast preview strip */}
          <div className="ml-auto hidden sm:flex items-center gap-2 shrink-0">
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ backgroundColor: data.accentColor, color: "#fff" }}
            >
              White text
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-bold border-2"
              style={{ borderColor: data.accentColor, color: data.accentColor }}
            >
              Outlined
            </div>
          </div>
        </div>
      </section>

      {/* ── SLIDE PREVIEW ── */}
      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-bold text-base mb-0.5">Slide Preview</h2>
        <p className="text-white/40 text-xs mb-5">
          Live preview of your brand kit applied to a carousel slide.
        </p>

        <div className="max-w-sm mx-auto">
          {/* Slide card */}
          <div
            className="w-full rounded-2xl overflow-hidden relative flex flex-col justify-between"
            style={{ background: previewBg, minHeight: "240px", padding: "24px" }}
          >
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/25 pointer-events-none" />

            {/* Top row: logo + accent dot */}
            <div className="relative z-10 flex items-center justify-between mb-5">
              {data.logoData ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={data.logoData}
                  alt="Logo"
                  className="h-8 object-contain object-left max-w-[120px]"
                />
              ) : (
                <div className="h-7 px-3 rounded-lg bg-white/10 flex items-center">
                  <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                    Your Logo
                  </span>
                </div>
              )}
              <div
                className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20"
                style={{ backgroundColor: data.accentColor }}
              />
            </div>

            {/* Slide content */}
            <div className="relative z-10 flex-1">
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: data.accentColor, fontFamily: data.headingFont }}
              >
                01 / Introduction
              </p>
              <h3
                className="text-xl font-bold leading-snug mb-2"
                style={{ fontFamily: data.headingFont, color: "#ffffff" }}
              >
                Your Headline Goes Here
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: data.bodyFont, color: "rgba(255,255,255,0.72)" }}
              >
                This is how body copy looks with your selected fonts and colors. Clear, readable, and on-brand.
              </p>
            </div>

            {/* Bottom accent bar */}
            <div
              className="relative z-10 mt-5 h-0.5 rounded-full opacity-80"
              style={{ backgroundColor: data.accentColor }}
            />
          </div>

          {/* Font labels */}
          <div className="flex justify-between mt-3 px-0.5">
            <span className="text-white/25 text-[10px] font-mono">H: {data.headingFont}</span>
            <span className="text-white/25 text-[10px] font-mono">B: {data.bodyFont}</span>
          </div>
        </div>
      </section>

      {/* ── SAVE ── */}
      <div className="flex items-center justify-between pt-1 pb-4">
        <div>
          {saved && (
            <p className="text-green-400 text-sm font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Brand kit saved
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving…
            </span>
          ) : (
            "Save Brand Kit"
          )}
        </button>
      </div>
    </div>
  );
}
