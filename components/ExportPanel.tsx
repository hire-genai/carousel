"use client";

import { useState } from "react";
import type { SlideDesign } from "@/lib/types";

interface FullSlide {
  headline: string;
  body: string;
  design: SlideDesign;
}

interface Props {
  title: string;
  slides: FullSlide[];
  onClose: () => void;
}

const FONT_MAP: Record<string, string> = {
  "Inter": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "Georgia": "Georgia, 'Times New Roman', serif",
  "Oswald": "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
  "Playfair Display": "Georgia, 'Palatino Linotype', Palatino, serif",
  "Roboto Mono": "'Courier New', Courier, monospace",
  "Space Grotesk": "system-ui, -apple-system, sans-serif",
};

const HEADLINE_PX: Record<string, number> = {
  "lg": 44,
  "xl": 52,
  "2xl": 62,
  "3xl": 74,
};

const BODY_PX: Record<string, number> = {
  "xs": 22,
  "sm": 26,
  "base": 30,
};

function parseGradient(css: string): { type: "linear"; from: string; to: string } | null {
  const m = css.match(/#[0-9a-fA-F]{3,8}/g);
  if (m && m.length >= 2) return { type: "linear", from: m[0], to: m[1] };
  return null;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, maxWidth: number, lineHeight: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
  void lineHeight; // suppress unused
}

function drawSlide(slide: FullSlide, index: number, total: number, carouselTitle: string): HTMLCanvasElement {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const d = slide.design;

  // Background
  if (d.bgType === "image" && d.bgImage) {
    const img = new Image();
    img.src = d.bgImage;
    ctx.drawImage(img, 0, 0, W, H);
    ctx.fillStyle = `rgba(0,0,0,${d.bgOverlay ?? 0.45})`;
    ctx.fillRect(0, 0, W, H);
  } else if (d.bgType === "solid") {
    ctx.fillStyle = d.bgColor || "#1a1a2e";
    ctx.fillRect(0, 0, W, H);
  } else {
    const grad = parseGradient(d.bgGradient || "linear-gradient(135deg,#2563EB,#4F46E5)");
    if (grad) {
      const grd = ctx.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, grad.from);
      grd.addColorStop(1, grad.to);
      ctx.fillStyle = grd;
    } else {
      ctx.fillStyle = "#1a1a2e";
    }
    ctx.fillRect(0, 0, W, H);
  }

  // Decorative circles
  if (d.showDecos !== false) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(W + 80, -80, 280, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-80, H + 60, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const PAD = 80;
  const fontFace = FONT_MAP[d.fontFamily || "Inter"];
  const align = d.textAlign || "left";
  ctx.textAlign = align === "center" ? "center" : "left";
  const textX = align === "center" ? W / 2 : PAD;
  const maxW = W - PAD * 2;

  // Slide label (HOOK / SLIDE N / CTA)
  const slideLabel = index === 0 ? "HOOK" : index === total - 1 ? "CTA" : `SLIDE ${index + 1}`;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  const lblW = 140;
  const lblX = align === "center" ? (W - lblW) / 2 : PAD;
  roundRect(ctx, lblX, PAD, lblW, 44, 12);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `bold 22px ${fontFace}`;
  ctx.textAlign = "center";
  ctx.fillText(slideLabel, lblX + lblW / 2, PAD + 28);
  ctx.restore();

  // Slide counter top-right
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = `400 22px ${fontFace}`;
  ctx.textAlign = "right";
  ctx.fillText(`${index + 1}/${total}`, W - PAD, PAD + 28);
  ctx.restore();

  // Content position
  const pos = d.textPosition || "middle";
  let contentY: number;
  if (pos === "top") contentY = PAD + 80;
  else if (pos === "bottom") contentY = H * 0.55;
  else contentY = H * 0.32;

  // Carousel title (small, above headline)
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = `600 22px ${fontFace}`;
  ctx.textAlign = align === "center" ? "center" : "left";
  ctx.fillText(carouselTitle.toUpperCase(), textX, contentY);
  ctx.restore();
  contentY += 50;

  // Headline
  const hSize = HEADLINE_PX[d.headlineSize || "xl"];
  const hWeight = d.headlineBold !== false ? "800" : "600";
  const hStyle = d.headlineItalic ? "italic " : "";
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = `${hStyle}${hWeight} ${hSize}px ${fontFace}`;
  ctx.textAlign = align === "center" ? "center" : "left";
  const hLines = wrapText(ctx, slide.headline, textX, maxW, hSize * 1.3);
  for (const line of hLines) {
    ctx.fillText(line, textX, contentY);
    contentY += hSize * 1.3;
  }
  ctx.restore();
  contentY += 32;

  // Body
  const bSize = BODY_PX[d.bodySize || "sm"];
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `400 ${bSize}px ${fontFace}`;
  ctx.textAlign = align === "center" ? "center" : "left";
  const bLines = wrapText(ctx, slide.body, textX, maxW, bSize * 1.6);
  for (const line of bLines) {
    ctx.fillText(line, textX, contentY);
    contentY += bSize * 1.6;
  }
  ctx.restore();

  // Progress bars
  const barY = H - PAD - 8;
  const barW = (maxW - (total - 1) * 8) / total;
  for (let i = 0; i < total; i++) {
    ctx.fillStyle = i === index ? "rgba(255,255,255,0.9)" : i < index ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)";
    roundRect(ctx, PAD + i * (barW + 8), barY, barW, 5, 3);
    ctx.fill();
  }

  // Brand watermark
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.font = `600 22px ${fontFace}`;
  ctx.textAlign = "left";
  ctx.fillText("SkygenAI", PAD, H - PAD + 5);
  ctx.restore();

  return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPNGs(slides: FullSlide[], title: string): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (let i = 0; i < slides.length; i++) {
    const canvas = drawSlide(slides[i], i, slides.length, title);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
    zip.file(`slide-${i + 1}.png`, blob);
  }
  const content = await zip.generateAsync({ type: "blob" });
  downloadBlob(content, `${title.replace(/\s+/g, "-").toLowerCase()}-slides.zip`);
}

async function exportPDF(slides: FullSlide[], title: string): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [1080, 1350] });
  for (let i = 0; i < slides.length; i++) {
    if (i > 0) pdf.addPage([1080, 1350]);
    const canvas = drawSlide(slides[i], i, slides.length, title);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(dataUrl, "JPEG", 0, 0, 1080, 1350);
  }
  pdf.save(`${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

async function exportSinglePNG(slide: FullSlide, index: number, total: number, title: string) {
  const canvas = drawSlide(slide, index, total, title);
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
  downloadBlob(blob, `slide-${index + 1}.png`);
}

export default function ExportPanel({ title, slides, onClose }: Props) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function run(type: string, fn: () => Promise<void>) {
    setExporting(type);
    setDone(null);
    try {
      await fn();
      setDone(type);
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setExporting(null);
    }
  }

  const ACTIONS = [
    {
      id: "png-zip",
      icon: "🖼️",
      label: "PNG (All Slides)",
      sub: `${slides.length} slides as ZIP`,
      fn: () => exportPNGs(slides, title),
    },
    {
      id: "pdf",
      icon: "📄",
      label: "PDF Document",
      sub: "Single multi-page PDF",
      fn: () => exportPDF(slides, title),
    },
    {
      id: "png-1",
      icon: "📸",
      label: "PNG (Slide 1 only)",
      sub: "Hook slide as single PNG",
      fn: () => exportSinglePNG(slides[0], 0, slides.length, title),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#16161e] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Export Carousel</h2>
            <p className="text-white/40 text-sm mt-0.5">{slides.length} slides · {title.slice(0, 40)}{title.length > 40 ? "…" : ""}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* Export options */}
        <div className="space-y-3">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => run(a.id, a.fn)}
              disabled={!!exporting}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                done === a.id
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20"
              } disabled:opacity-50`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center text-2xl flex-shrink-0">
                {exporting === a.id ? (
                  <svg className="animate-spin w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : done === a.id ? "✓" : a.icon}
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${done === a.id ? "text-green-400" : "text-white"}`}>
                  {exporting === a.id ? "Exporting..." : done === a.id ? "Downloaded!" : a.label}
                </p>
                <p className="text-white/35 text-xs mt-0.5">{a.sub}</p>
              </div>
              {!exporting && !done && (
                <span className="text-white/25 text-sm">↓</span>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-white/20 text-xs mt-5">
          Slides render at 1080×1350px (LinkedIn 4:5 format)
        </p>
      </div>
    </div>
  );
}
