"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CarouselData, SlideDesign, Template } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";
import { fitText, countLines, TYPO_PRESETS } from "@/lib/typography";
import type { TypoConfig } from "@/lib/typography";
import FreeBanner from "./FreeBanner";

// ── Canvas coordinate system (internal px) ──────────────────────────────────
const CW = 540;
const CH = 675;

type TAlign = "left" | "center" | "right";
type InputMode = "topic" | "product" | "url";
type Tone = "professional" | "casual" | "bold" | "storytelling";

// ── Data models ──────────────────────────────────────────────────────────────
type CanvasShape = "text" | "circle" | "ring" | "bar" | "chip";

interface CanvasEl {
  id: string;
  type: "text";
  x: number; y: number;
  w: number; h: number;
  rotate: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean;
  color: string;
  fillColor: string;
  textAlign: TAlign;
  typoConfig?: TypoConfig;
  // Decoration support — faithful gallery reproduction
  shape?: CanvasShape;            // default "text"
  locked?: boolean;               // decoration elements can't be selected/dragged
  borderColor?: string;           // used by ring / chip
  borderWidth?: number;
  borderRadius?: number;          // 0 = square, 999 = pill
  letterSpacing?: number;         // small caps / tag styling
  textTransform?: "none" | "uppercase";
  lineHeight?: number;            // per-element override for headline vs body
}

interface CanvasSlide {
  id: string;
  bg: string;
  bgImage?: string;
  elements: CanvasEl[];
}

interface Props {
  linkedinConnected: boolean;
  linkedinName: string;
  templateId?: string;
  initialSlidesJson?: string;
  initialSavedId?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function mkEl(overrides: Partial<CanvasEl> = {}): CanvasEl {
  return {
    id: uid(), type: "text",
    x: 40, y: 240, w: 460, h: 80, rotate: 0,
    text: "Text", fontSize: 28, fontFamily: "Inter",
    bold: false, italic: false, underline: false, strikethrough: false,
    color: "#ffffff", fillColor: "transparent", textAlign: "left",
    ...overrides,
  };
}

const GRADIENTS = [
  "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
  "linear-gradient(135deg,#1e0a3c 0%,#2d1b69 100%)",
  "linear-gradient(135deg,#0a1628 0%,#1a3a5c 100%)",
  "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)",
  "linear-gradient(135deg,#1a0533 0%,#3d1166 100%)",
  "linear-gradient(135deg,#0d1117 0%,#1a1a2e 100%)",
  "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)",
];

const FONT_FAMILIES = ["Inter","Arial","Georgia","Playfair Display","Montserrat","Roboto","Poppins","Raleway","Trebuchet MS","Verdana"];
const SLIDE_COUNTS = [1, 2, 3, 4, 5];
const AUDIENCES = [
  "Founders & Entrepreneurs",
  "Product Managers",
  "Software Engineers",
  "Marketers & Growth",
  "Designers & Creatives",
  "Sales Professionals",
  "Students & Learners",
  "General Professionals",
];

function makeEmptySlide(idx = 0, bg?: string): CanvasSlide {
  return {
    id: uid(),
    bg: bg ?? GRADIENTS[idx % GRADIENTS.length],
    elements: [
      mkEl({ y: 160, h: 100, text: "Add Heading",             fontSize: 44, bold: true,  typoConfig: TYPO_PRESETS.free_heading }),
      mkEl({ y: 280, h: 70,  text: "Add Subheading",          fontSize: 24, color: "rgba(255,255,255,0.7)",  typoConfig: TYPO_PRESETS.free_subheading }),
      mkEl({ y: 370, h: 160, text: "Add text content here...",fontSize: 16, color: "rgba(255,255,255,0.5)",  typoConfig: TYPO_PRESETS.free_body }),
    ],
  };
}

const AI_ACCENTS = ["#60a5fa", "#a78bfa", "#34d399", "#f472b6", "#fbbf24", "#22d3ee", "#f87171"];

// Layout constants (540×675 canvas)
const AI_CONTENT_Y = 142; // first text element starts here (after bar at y:130+4=134, +8 gap)
const AI_BOTTOM_Y  = 626; // last text element must end by here (10px above dots at y:640-10=630, -4 margin)
const AI_GAP       = 20;  // vertical gap between headline and body
const AI_EL_W      = 460; // element width

// Measure the actual rendered height of a headline string at 65px.
// Uses canvas text measurement — only call on the client (always true for handleGenerate).
function measureHeadlineH(text: string, fontFamily: string): number {
  const preset  = TYPO_PRESETS.headline_bold; // minFontSize:20 maxLines:4 lineHeight:1.10 padding:8
  const innerW  = AI_EL_W - preset.padding * 2; // 444px
  // Pass availHeight=9999 → fitText only shrinks based on maxLines, not height
  const fitted  = fitText(text, fontFamily, true, false, 65, AI_EL_W, 9999, preset);
  const lines   = countLines(text, fontFamily, true, false, fitted.fontSize, innerW);
  // Height = rendered lines + top+bottom padding buffer matching fitText's own calculation
  return Math.ceil(lines * fitted.fontSize * fitted.lineHeight) + preset.padding * 2;
}

function makeAISlide(headline: string, body: string, idx: number, total: number): CanvasSlide {
  const accent = AI_ACCENTS[idx % AI_ACCENTS.length];
  const font   = "Inter";
  const label  = idx === 0 ? "INTRO" : idx === total - 1 ? "TAKE ACTION" : `STEP ${String(idx).padStart(2, "0")}`;

  // Dynamic layout: measure headline, derive body position from actual height
  const headlineH = typeof window !== "undefined" ? measureHeadlineH(headline, font) : 150;
  const headlineY = AI_CONTENT_Y;
  const bodyY     = headlineY + headlineH + AI_GAP;
  const bodyH     = Math.max(80, AI_BOTTOM_Y - bodyY);

  const elements: CanvasEl[] = [];

  // Tag chip (top-left)
  elements.push(mkEl({
    x: 40, y: 50, w: 200, h: 30,
    shape: "chip", fillColor: `${accent}22`,
    borderColor: `${accent}55`, borderWidth: 1, borderRadius: 4,
    text: label, fontSize: 12, bold: true, fontFamily: font,
    color: accent, textAlign: "center",
    letterSpacing: 3, textTransform: "uppercase", locked: true,
  }));

  // Big slide number (top-right decoration)
  elements.push(mkEl({
    x: 400, y: 34, w: 120, h: 90, text: String(idx + 1).padStart(2, "0"),
    fontSize: 78, bold: true, fontFamily: font,
    color: "rgba(255,255,255,0.08)", textAlign: "right",
    lineHeight: 1, locked: true,
  }));

  // Accent bar
  elements.push(mkEl({
    x: 40, y: 130, w: 44, h: 4,
    shape: "bar", fillColor: accent, text: "", locked: true,
  }));

  // Headline — height is exactly measured, no reserved dead space
  elements.push(mkEl({
    x: 40, y: headlineY, w: AI_EL_W, h: headlineH,
    text: headline, fontSize: 65, bold: true, fontFamily: font,
    color: "#ffffff", textAlign: "left",
    lineHeight: 1.1,
    typoConfig: TYPO_PRESETS.headline_bold,
  }));

  // Body — starts immediately after headline, fills remaining space to bottom
  elements.push(mkEl({
    x: 40, y: bodyY, w: AI_EL_W, h: bodyH,
    text: body, fontSize: 42, fontFamily: font,
    color: "rgba(255,255,255,0.75)", textAlign: "left",
    lineHeight: 1.35,
    typoConfig: TYPO_PRESETS.body,
  }));

  // Bottom accent dots (pinned)
  elements.push(mkEl({ x: 40, y: 640, w: 10, h: 10, shape: "circle", fillColor: accent, locked: true, text: "" }));
  elements.push(mkEl({ x: 60, y: 640, w: 10, h: 10, shape: "circle", fillColor: "rgba(255,255,255,0.25)", locked: true, text: "" }));
  elements.push(mkEl({ x: 80, y: 640, w: 10, h: 10, shape: "circle", fillColor: "rgba(255,255,255,0.25)", locked: true, text: "" }));

  return { id: uid(), bg: GRADIENTS[idx % GRADIENTS.length], elements };
}

// Seed a slide from a Template's design — faithful reproduction of gallery preview.
// Coordinate system: 540 × 675 canvas. Padding baseline = 40px.
// Each layoutStyle recreates the visual composition from TemplateGallery.TemplatePreview
// so that the editor renders IDENTICALLY to the gallery card the user clicked.
function makeTemplateSlide(tpl: Template, idx: number, headline?: string, body?: string): CanvasSlide {
  const bg     = tpl.gradients[idx % tpl.gradients.length];
  const font   = tpl.design.fontFamily ?? "Inter";
  const accent = tpl.accentColor;
  const layout = tpl.layoutStyle;
  const rawHead  = headline ?? tpl.sampleHeadline;
  const bodyText = body ?? tpl.sampleBody;

  const elements: CanvasEl[] = [];
  const CENTER_X = 270; // canvas mid

  // ═══ Bottom accent dots (no watermark) ═══
  const bottomBar = () => {
    elements.push(mkEl({ x: 40, y: 640, w: 10, h: 10, shape: "circle", fillColor: accent, locked: true, text: "" }));
    elements.push(mkEl({ x: 60, y: 640, w: 10, h: 10, shape: "circle", fillColor: "rgba(255,255,255,0.25)", locked: true, text: "" }));
    elements.push(mkEl({ x: 80, y: 640, w: 10, h: 10, shape: "circle", fillColor: "rgba(255,255,255,0.25)", locked: true, text: "" }));
  };

  // ─── profile-card ────────────────────────────────────────────────────────
  if (layout === "profile-card") {
    const handle  = tpl.tag ?? "@creator";
    const initial = handle.replace("@", "")[0]?.toUpperCase() ?? "C";

    // Avatar circle (decoration)
    elements.push(mkEl({
      x: 40, y: 50, w: 40, h: 40,
      shape: "circle", fillColor: accent,
      text: initial, fontSize: 20, bold: true, fontFamily: font,
      color: "#000000", textAlign: "center",
      locked: true,
    }));
    // Handle — EDITABLE (no wide letter-spacing; reads as natural @handle)
    elements.push(mkEl({
      x: 92, y: 58, w: 280, h: 26, text: handle,
      fontSize: 17, bold: true, fontFamily: font,
      color: "#ffffff", textAlign: "left",
      lineHeight: 1.2,
    }));
    // Big slide number (decoration, top-right)
    elements.push(mkEl({
      x: 400, y: 34, w: 120, h: 90, text: String(idx + 1).padStart(2, "0"),
      fontSize: 78, bold: true, fontFamily: font,
      color: "rgba(255,255,255,0.08)", textAlign: "right",
      lineHeight: 1, locked: true,
    }));
    // Editable headline — moved up, tighter gap to handle
    elements.push(mkEl({
      x: 40, y: 140, w: 460, h: 220, text: rawHead,
      fontSize: 46, bold: true, fontFamily: font,
      color: "#ffffff", textAlign: "left",
      lineHeight: 1.15,
      typoConfig: TYPO_PRESETS.headline_profile,
    }));
    // Editable body — sits directly under headline
    elements.push(mkEl({
      x: 40, y: 380, w: 460, h: 230, text: bodyText,
      fontSize: 19, fontFamily: font,
      color: "rgba(255,255,255,0.55)", textAlign: "left",
      lineHeight: 1.5,
      typoConfig: TYPO_PRESETS.body,
    }));
    bottomBar();
    return { id: uid(), bg, elements };
  }

  // ─── arrow-list ──────────────────────────────────────────────────────────
  if (layout === "arrow-list") {
    const handle  = tpl.tag ?? "@creator";
    const bullets = tpl.bulletPoints ?? [bodyText];

    // Decorative corner ring (top-right, partially off-canvas)
    elements.push(mkEl({
      x: 430, y: -60, w: 180, h: 180,
      shape: "ring", borderColor: "rgba(255,255,255,0.22)", borderWidth: 8,
      text: "", locked: true,
    }));
    // Handle tag
    elements.push(mkEl({
      x: 40, y: 50, w: 400, h: 22, text: handle.toUpperCase(),
      fontSize: 15, bold: true, fontFamily: font,
      color: "rgba(255,255,255,0.75)", textAlign: "left",
      letterSpacing: 2, locked: true,
    }));
    // Big uppercase headline
    elements.push(mkEl({
      x: 40, y: 130, w: 460, h: 240, text: rawHead.toUpperCase(),
      fontSize: 56, bold: true, fontFamily: font,
      color: "#ffffff", textAlign: "left",
      lineHeight: 1.05,
      typoConfig: TYPO_PRESETS.headline_bold,
    }));
    // Arrow bullets
    bullets.slice(0, 3).forEach((b, i) => {
      elements.push(mkEl({
        x: 40, y: 430 + i * 42, w: 24, h: 32,
        text: "→", fontSize: 22, bold: true, fontFamily: font,
        color: "rgba(255,255,255,0.9)", textAlign: "left", locked: true,
      }));
      elements.push(mkEl({
        x: 72, y: 432 + i * 42, w: 430, h: 32,
        text: b, fontSize: 18, fontFamily: font,
        color: "rgba(255,255,255,0.85)", textAlign: "left",
        typoConfig: TYPO_PRESETS.body,
      }));
    });
    // Bottom strip
    elements.push(mkEl({
      x: 40, y: 638, w: 60, h: 4,
      shape: "bar", fillColor: "rgba(255,255,255,0.35)", text: "", locked: true,
    }));
    elements.push(mkEl({
      x: 400, y: 626, w: 110, h: 20,
      text: ">>>>", fontSize: 18, bold: true, fontFamily: font,
      color: "rgba(255,255,255,0.35)", textAlign: "right",
      letterSpacing: 3, locked: true,
    }));
    return { id: uid(), bg, elements };
  }

  // ─── bold-center ─────────────────────────────────────────────────────────
  if (layout === "bold-center") {
    if (tpl.tag) {
      // Tag chip (bordered)
      elements.push(mkEl({
        x: CENTER_X - 80, y: 60, w: 160, h: 32,
        shape: "chip", borderColor: `${accent}55`, borderWidth: 1, borderRadius: 4,
        text: tpl.tag, fontSize: 13, bold: true, fontFamily: font,
        color: accent, textAlign: "center",
        letterSpacing: 3, textTransform: "uppercase", locked: true,
      }));
    }
    // Massive headline
    elements.push(mkEl({
      x: 40, y: 200, w: 460, h: 280, text: rawHead.toUpperCase(),
      fontSize: 62, bold: true, fontFamily: font,
      color: "#ffffff", textAlign: "center",
      lineHeight: 1.05, letterSpacing: 0.5,
      textTransform: "uppercase",
      typoConfig: TYPO_PRESETS.headline_bold,
    }));
    // Body
    elements.push(mkEl({
      x: 60, y: 500, w: 420, h: 100, text: bodyText,
      fontSize: 18, fontFamily: font,
      color: "rgba(255,255,255,0.65)", textAlign: "center",
      lineHeight: 1.4,
      typoConfig: TYPO_PRESETS.body,
    }));
    bottomBar();
    return { id: uid(), bg, elements };
  }

  // ─── quote-center ────────────────────────────────────────────────────────
  if (layout === "quote-center") {
    // Opening quote mark
    elements.push(mkEl({
      x: CENTER_X - 40, y: 40, w: 80, h: 80, text: "“",
      fontSize: 96, bold: true, fontFamily: "Georgia",
      color: accent, textAlign: "center",
      lineHeight: 1, locked: true,
    }));
    // Italic serif headline
    elements.push(mkEl({
      x: 50, y: 170, w: 440, h: 280, text: rawHead,
      fontSize: 44, bold: true, italic: true, fontFamily: "Georgia",
      color: "#ffffff", textAlign: "center",
      lineHeight: 1.2,
      typoConfig: TYPO_PRESETS.headline_quote,
    }));
    // Body attribution
    elements.push(mkEl({
      x: 60, y: 470, w: 420, h: 140, text: bodyText,
      fontSize: 18, italic: true, fontFamily: "Georgia",
      color: "rgba(255,255,255,0.6)", textAlign: "center",
      lineHeight: 1.45,
      typoConfig: TYPO_PRESETS.body,
    }));
    bottomBar();
    return { id: uid(), bg, elements };
  }

  // ─── number-hero ─────────────────────────────────────────────────────────
  if (layout === "number-hero") {
    const num  = rawHead.match(/^\d+/)?.[0] ?? "01";
    const rest = rawHead.replace(/^\d+\s*/, "").trim() || rawHead;
    if (tpl.tag) {
      elements.push(mkEl({
        x: 40, y: 60, w: 200, h: 30,
        shape: "chip", fillColor: `${accent}22`, borderRadius: 4,
        text: tpl.tag, fontSize: 12, bold: true, fontFamily: font,
        color: accent, textAlign: "center",
        letterSpacing: 3, textTransform: "uppercase", locked: true,
      }));
    }
    // Huge number
    elements.push(mkEl({
      x: 40, y: 120, w: 460, h: 180, text: num,
      fontSize: 156, bold: true, fontFamily: font,
      color: accent, textAlign: "left",
      lineHeight: 1, letterSpacing: -6,
      locked: true,
    }));
    // Rest of headline
    elements.push(mkEl({
      x: 40, y: 320, w: 460, h: 140, text: rest,
      fontSize: 36, bold: true, fontFamily: font,
      color: "#ffffff", textAlign: "left",
      lineHeight: 1.15,
      typoConfig: TYPO_PRESETS.headline_number,
    }));
    // Body
    elements.push(mkEl({
      x: 40, y: 480, w: 460, h: 140, text: bodyText,
      fontSize: 18, fontFamily: font,
      color: "rgba(255,255,255,0.6)", textAlign: "left",
      lineHeight: 1.5,
      typoConfig: TYPO_PRESETS.body,
    }));
    bottomBar();
    return { id: uid(), bg, elements };
  }

  // ─── accent-word ─────────────────────────────────────────────────────────
  if (layout === "accent-word") {
    if (tpl.tag) {
      elements.push(mkEl({
        x: 40, y: 60, w: 200, h: 30,
        shape: "chip", fillColor: `${accent}22`, borderRadius: 4,
        text: tpl.tag, fontSize: 12, bold: true, fontFamily: font,
        color: accent, textAlign: "center",
        letterSpacing: 3, textTransform: "uppercase", locked: true,
      }));
    }
    elements.push(mkEl({
      x: 40, y: 180, w: 460, h: 200, text: rawHead,
      fontSize: 44, bold: true, fontFamily: font,
      color: "#ffffff", textAlign: "left",
      lineHeight: 1.15,
      italic: Boolean(tpl.design.headlineItalic),
      typoConfig: TYPO_PRESETS.headline_default,
    }));
    elements.push(mkEl({
      x: 40, y: 400, w: 460, h: 200, text: bodyText,
      fontSize: 26, bold: true, fontFamily: font,
      color: accent, textAlign: "left",
      lineHeight: 1.3,
      typoConfig: TYPO_PRESETS.body,
    }));
    bottomBar();
    return { id: uid(), bg, elements };
  }

  // ─── minimal-left ────────────────────────────────────────────────────────
  if (layout === "minimal-left") {
    if (tpl.tag) {
      elements.push(mkEl({
        x: 40, y: 70, w: 460, h: 22, text: tpl.tag,
        fontSize: 13, bold: true, fontFamily: font,
        color: accent, textAlign: "left",
        letterSpacing: 3, textTransform: "uppercase", locked: true,
      }));
    }
    // Small accent bar
    elements.push(mkEl({
      x: 40, y: 180, w: 44, h: 4,
      shape: "bar", fillColor: accent, text: "", locked: true,
    }));
    // Headline
    elements.push(mkEl({
      x: 40, y: 210, w: 460, h: 220, text: rawHead,
      fontSize: 46, bold: true, fontFamily: font,
      color: "#ffffff", textAlign: "left",
      lineHeight: 1.2,
      italic: Boolean(tpl.design.headlineItalic),
      typoConfig: TYPO_PRESETS.headline_default,
    }));
    // Body
    elements.push(mkEl({
      x: 40, y: 460, w: 460, h: 140, text: bodyText,
      fontSize: 20, fontFamily: font,
      color: "rgba(255,255,255,0.6)", textAlign: "left",
      lineHeight: 1.45,
      typoConfig: TYPO_PRESETS.body,
    }));
    bottomBar();
    return { id: uid(), bg, elements };
  }

  // ─── tag-headline (default) ──────────────────────────────────────────────
  if (tpl.tag) {
    elements.push(mkEl({
      x: 40, y: 60, w: 220, h: 32,
      shape: "chip", fillColor: `${accent}22`,
      borderColor: `${accent}30`, borderWidth: 1, borderRadius: 4,
      text: tpl.tag, fontSize: 13, bold: true, fontFamily: font,
      color: accent, textAlign: "center",
      letterSpacing: 3, textTransform: "uppercase", locked: true,
    }));
  }
  elements.push(mkEl({
    x: 40, y: 180, w: 460, h: 240, text: rawHead,
    fontSize: 46, bold: true, fontFamily: font,
    color: "#ffffff", textAlign: "left",
    lineHeight: 1.2,
    italic: Boolean(tpl.design.headlineItalic),
    typoConfig: TYPO_PRESETS.headline_default,
  }));
  elements.push(mkEl({
    x: 40, y: 460, w: 460, h: 140, text: bodyText,
    fontSize: 20, fontFamily: font,
    color: "rgba(255,255,255,0.6)", textAlign: "left",
    lineHeight: 1.45,
    typoConfig: TYPO_PRESETS.body,
  }));
  bottomBar();
  return { id: uid(), bg, elements };
}

// ── Main component ───────────────────────────────────────────────────────────
export default function CarouselGeneratorClient({ linkedinConnected, linkedinName, templateId, initialSlidesJson, initialSavedId }: Props) {
  const router = useRouter();
  const legacyTpl = templateId ? TEMPLATES.find((t) => t.id === templateId) : null;

  // Slides state — seed from existing carousel, template, or empty
  const [slides, setSlides] = useState<CanvasSlide[]>(() => {
    if (initialSlidesJson) {
      try {
        const parsed = JSON.parse(initialSlidesJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.every((s: any) => s && typeof s === 'object' && Array.isArray(s.elements));
          if (valid) return parsed as CanvasSlide[];
        }
      } catch { /* fall through */ }
    }
    if (legacyTpl) return [makeTemplateSlide(legacyTpl, 0)];
    return [makeEmptySlide(0)];
  });
  const [activeSlide, setActiveSlide] = useState(0);

  // ── Undo / Redo history ──────────────────────────────────────────────────
  const historyRef      = useRef<CanvasSlide[][]>([]);
  const futureRef       = useRef<CanvasSlide[][]>([]);
  const skipHistoryRef  = useRef(false);
  const prevSlidesRef   = useRef<CanvasSlide[]>(slides);
  const [, forceRerender] = useState(0);
  const bumpHistory = useCallback(() => forceRerender((v) => v + 1), []);

  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      prevSlidesRef.current = slides;
      return;
    }
    // Push previous state to history, cap at 50
    historyRef.current = [...historyRef.current.slice(-49), prevSlidesRef.current];
    futureRef.current  = [];
    prevSlidesRef.current = slides;
    bumpHistory();
  }, [slides, bumpHistory]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    futureRef.current = [prevSlidesRef.current, ...futureRef.current.slice(0, 49)];
    historyRef.current = historyRef.current.slice(0, -1);
    skipHistoryRef.current = true;
    setSlides(prev);
    setSelectedId(null); setEditingId(null);
    bumpHistory();
  }, [bumpHistory]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    historyRef.current = [...historyRef.current.slice(-49), prevSlidesRef.current];
    futureRef.current  = futureRef.current.slice(1);
    skipHistoryRef.current = true;
    setSlides(next);
    setSelectedId(null); setEditingId(null);
    bumpHistory();
  }, [bumpHistory]);

  // Keyboard shortcuts — Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z (or Ctrl+Y)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return; // don't hijack while typing
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  // Canvas editor state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [slidePopupIdx, setSlidePopupIdx] = useState<number | null>(null);
  const [showCompleteSlideSelect, setShowCompleteSlideSelect] = useState(false);
  const [saveCompleteIndices, setSaveCompleteIndices] = useState<Set<number>>(new Set());

  // Scale for canvas-to-screen
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const scaleRef = useRef(0.6);

  useEffect(() => {
    const update = () => {
      if (!canvasWrapRef.current) return;
      const w = canvasWrapRef.current.clientWidth - 24;
      const s = Math.min(1, w / CW);
      setScale(s);
      scaleRef.current = s;
    };
    update();
    const obs = new ResizeObserver(update);
    if (canvasWrapRef.current) obs.observe(canvasWrapRef.current);
    return () => obs.disconnect();
  }, []);

  // Drag state
  const dragRef = useRef<{ elId: string; startMX: number; startMY: number; startElX: number; startElY: number } | null>(null);
  const activeSlideRef = useRef(activeSlide);
  useEffect(() => { activeSlideRef.current = activeSlide; }, [activeSlide]);

  // Resize state (width handle)
  const resizeRef = useRef<{ elId: string; startMX: number; startW: number } | null>(null);

  const updateEl = useCallback((elId: string, patch: Partial<CanvasEl>) => {
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlideRef.current ? s : {
          ...s,
          elements: s.elements.map((el) => el.id === elId ? { ...el, ...patch } : el),
        }
      )
    );
  }, []);

  const deleteEl = useCallback((elId: string) => {
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlideRef.current ? s : { ...s, elements: s.elements.filter((e) => e.id !== elId) }
      )
    );
    setSelectedId(null);
    setEditingId(null);
  }, []);

  const deleteSlide = useCallback((idx: number) => {
    setSlides((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
    setActiveSlide((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
    setSelectedId(null);
    setEditingId(null);
    setSlidePopupIdx(null);
  }, []);

  const duplicateEl = useCallback((elId: string) => {
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== activeSlideRef.current) return s;
        const src = s.elements.find((e) => e.id === elId);
        if (!src) return s;
        const copy = { ...src, id: uid(), x: src.x + 20, y: src.y + 20 };
        return { ...s, elements: [...s.elements, copy] };
      })
    );
  }, []);

  const addEl = useCallback((el: CanvasEl) => {
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlideRef.current ? s : { ...s, elements: [...s.elements, el] }
      )
    );
    setSelectedId(el.id);
  }, []);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const startDrag = useCallback((e: React.MouseEvent, elId: string, elX: number, elY: number) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { elId, startMX: e.clientX, startMY: e.clientY, startElX: elX, startElY: elY };

    const onMove = (me: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const s = scaleRef.current;
      const dx = (me.clientX - d.startMX) / s;
      const dy = (me.clientY - d.startMY) / s;
      updateEl(d.elId, {
        x: Math.max(0, d.startElX + dx),
        y: Math.max(0, d.startElY + dy),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [updateEl]);

  const startResize = useCallback((e: React.MouseEvent, elId: string, elW: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { elId, startMX: e.clientX, startW: elW };

    const onMove = (me: MouseEvent) => {
      const r = resizeRef.current;
      if (!r) return;
      const dx = (me.clientX - r.startMX) / scaleRef.current;
      updateEl(r.elId, { w: Math.max(80, r.startW + dx) });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [updateEl]);

  // ── AI generation ─────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<InputMode>("topic");
  const [input, setInput] = useState("");
  const [numSlides, setNumSlides] = useState(SLIDE_COUNTS[0]);
  const [savedProductUrl, setSavedProductUrl] = useState("");

  // Fetch saved product URL when drawer opens
  useEffect(() => {
    if (!drawerOpen) return;
    fetch("/api/user/product-url")
      .then((r) => r.json())
      .then((d) => {
        if (d.productWebsiteUrl) {
          setSavedProductUrl(d.productWebsiteUrl);
          setInput((prev) => (mode === "product" && !prev ? d.productWebsiteUrl : prev));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);
  const [tone, setTone] = useState<Tone>("professional");
  const [audience, setAudience] = useState<string>(AUDIENCES[0]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [savingDraft, setSavingDraft] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(initialSavedId ?? null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadIndices, setDownloadIndices] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishIndices, setPublishIndices] = useState<Set<number>>(new Set());
  const [caption, setCaption] = useState("");
  const [captionLoading, setCaptionLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleImgFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setSlides((prev) => prev.map((s, i) => i !== activeSlideRef.current ? s : { ...s, bgImage: dataUrl }));
    };
    reader.readAsDataURL(file);
  }, []);

  const setBg = useCallback((bg: string) => {
    setSlides((prev) => prev.map((s, i) => i !== activeSlideRef.current ? s : { ...s, bg, bgImage: undefined }));
  }, []);

  async function handleGenerate() {
    if (!input.trim()) { inputRef.current?.focus(); return; }
    setLoading(true); setError(""); setStatusMsg("Analyzing content...");
    try {
      let source = input.trim();
      let generateMode: string = "text";
      if (mode === "url") {
        setStatusMsg("Fetching content...");
        const r = await fetch("/api/fetch-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: source, mode }) });
        const d = await r.json();
        if (!r.ok || d.error) throw new Error(d.error || "Failed to fetch content.");
        source = d.content;
      } else if (mode === "product") {
        generateMode = "product";
        setStatusMsg("Scanning your website...");
      }
      setStatusMsg("Generating slides with AI...");
      const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: generateMode, content: source, numSlides, tone, audience }) });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.error || "Generation failed.");

      const aiCarousel: CarouselData = d.carousel;
      // Pick a template that matches content mode and tone
      function pickTemplateForContent() {
        if (legacyTpl) return legacyTpl;
        let candidates = TEMPLATES;
        if (mode === "product") {
          candidates = TEMPLATES.filter((t) => t.category === "minimal" || t.category === "professional");
        } else if (tone === "bold") {
          candidates = TEMPLATES.filter((t) => t.category === "bold" || t.category === "colorful");
        } else if (tone === "storytelling") {
          candidates = TEMPLATES.filter((t) => t.category === "professional" || t.category === "minimal");
        } else if (tone === "casual") {
          candidates = TEMPLATES.filter((t) => t.category === "colorful" || t.category === "dark");
        }
        if (!candidates.length) candidates = TEMPLATES;
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
      const pickedTpl = pickTemplateForContent();
      const newSlides: CanvasSlide[] = aiCarousel.slides.map(
        (s: { headline: string; body: string; bullets?: string[]; design?: SlideDesign }, i: number) => {
          const bodyText = Array.isArray(s.bullets) && s.bullets.length > 0
            ? s.bullets.map((b) => `• ${b}`).join("\n")
            : (s.body || "");
          return makeTemplateSlide(pickedTpl, i, s.headline, bodyText);
        }
      );
      setSlides(newSlides);
      setActiveSlide(0);
      setSelectedId(null);
      setDrawerOpen(false);
      setStatusMsg("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const slide = slides[activeSlide] ?? slides[0];
  const selectedEl = slide?.elements?.find((e) => e.id === selectedId) ?? null;

  const placeholders: Record<InputMode, string> = {
    topic: "e.g. 5 habits that transformed my productivity as a founder...",
    product: "https://yourproduct.com",
    url: "https://your-article-or-blog.com/...",
  };

  async function renderSlideToPng(slide: CanvasSlide): Promise<string> {
    const { default: html2canvas } = await import("html2canvas");
    const CW2 = CW, CH2 = CH;
    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed", left: "-9999px", top: "0",
      width: `${CW2}px`, height: `${CH2}px`,
      overflow: "hidden", borderRadius: "12px",
      background: slide.bgImage ? "#000" : slide.bg,
    });
    if (slide.bgImage) {
      const img = document.createElement("img");
      Object.assign(img.style, { position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover" });
      img.src = slide.bgImage;
      container.appendChild(img);
    }
    for (const el of slide.elements) {
      const d = buildElDom(el);
      container.appendChild(d);
    }
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { useCORS: true, scale: 2, width: CW2, height: CH2, backgroundColor: null });
      return canvas.toDataURL("image/png");
    } finally {
      document.body.removeChild(container);
    }
  }

  function buildElDom(el: CanvasEl): HTMLElement {
    const shape = el.shape ?? "text";
    const d = document.createElement("div");
    Object.assign(d.style, {
      position: "absolute",
      left: `${el.x}px`, top: `${el.y}px`,
      width: `${el.w}px`,
      boxSizing: "border-box",
    });
    if (["circle","ring","bar","chip"].includes(shape)) d.style.height = `${el.h}px`;
    else d.style.minHeight = `${el.h}px`;

    if (shape === "ring") {
      Object.assign(d.style, { background: "transparent", borderRadius: "50%", border: `${el.borderWidth ?? 4}px solid ${el.borderColor ?? "rgba(255,255,255,0.25)"}` });
    } else if (shape === "bar") {
      Object.assign(d.style, { background: el.fillColor === "transparent" ? "rgba(255,255,255,0.35)" : el.fillColor, borderRadius: `${el.borderRadius ?? 999}px` });
    } else if (shape === "circle") {
      Object.assign(d.style, { background: el.fillColor, borderRadius: "50%" });
    } else if (shape === "chip") {
      Object.assign(d.style, { background: el.fillColor === "transparent" ? "transparent" : el.fillColor, borderRadius: `${el.borderRadius ?? 6}px`, padding: "4px 8px", ...(el.borderColor ? { border: `${el.borderWidth ?? 1}px solid ${el.borderColor}` } : {}) });
    } else {
      Object.assign(d.style, { background: el.fillColor === "transparent" ? "transparent" : el.fillColor, borderRadius: "4px" });
    }
    if (shape === "ring" || shape === "bar") return d;
    Object.assign(d.style, {
      color: el.color, fontFamily: el.fontFamily + ",sans-serif",
      fontSize: `${el.fontSize}px`, fontWeight: el.bold ? "bold" : "normal",
      fontStyle: el.italic ? "italic" : "normal", textAlign: el.textAlign,
      lineHeight: `${el.lineHeight ?? 1.35}`, letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : "normal",
      textTransform: el.textTransform ?? "none", whiteSpace: "pre-wrap",
      wordBreak: "break-word", padding: "4px 6px",
      display: "flex", flexDirection: "column",
      justifyContent: (shape === "circle" || shape === "chip") ? "center" : "flex-start",
      alignItems: el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
      overflow: "hidden",
    });
    if (el.underline || el.strikethrough) d.style.textDecoration = [el.underline && "underline", el.strikethrough && "line-through"].filter(Boolean).join(" ");
    d.textContent = el.text;
    return d;
  }

  async function handleSaveDraft(status: "draft" | "complete" = "draft", selectedIndices?: Set<number>) {
    setSavingDraft(true);
    setShowSaveDialog(false);
    setShowCompleteSlideSelect(false);
    try {
      const slidesPayload = status === "complete" && selectedIndices && selectedIndices.size > 0
        ? slides.filter((_, i) => selectedIndices.has(i))
        : slides;
      const title = slides[0]?.elements?.find((e) => e.bold && e.fontSize >= 36 && !e.locked)?.text?.slice(0, 60) || "Untitled Carousel";
      const url = savedId ? `/api/carousels/${savedId}` : "/api/carousels";
      const method = savedId ? "PATCH" : "POST";

      let renderedImages: string[] | undefined;

      if (status === "complete") {
        // Render all selected slides to PNG — same pipeline as Publish Now
        renderedImages = [];
        for (const slide of slidesPayload) {
          try { renderedImages.push(await renderSlideToPng(slide)); } catch { /* skip on error */ }
        }
      }

      // caption state is pre-filled by generateCaption() when dialog opened (and editable by user)
      const captionToSave = status === "complete" ? (caption || undefined) : undefined;

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slides: slidesPayload, status, renderedImages, caption: captionToSave }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Save failed");
      if (!savedId && d.id) setSavedId(d.id);
      showToast(status === "complete" ? "Saved as complete!" : "Draft saved!");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSchedulePostLater() {
    if (downloadIndices.size === 0 || !savedId) {
      showToast("Please save carousel first", "err");
      return;
    }
    // Close modal and open SchedulePickerModal
    setDownloadOpen(false);
    // We'll use a workaround: save the selected indices to state, then trigger schedule modal
    // For now, redirect to scheduled page with pre-selection
    window.location.href = `/dashboard/scheduled?carouselId=${savedId}`;
  }

  async function generateCaption() {
    setCaptionLoading(true);
    try {
      const headlines = slides.map((s) => s.elements?.find((e) => e.bold && e.fontSize >= 36)?.text || "").filter(Boolean);
      const title = headlines[0] || "LinkedIn Carousel";
      const r = await fetch("/api/generate-caption", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, headlines }) });
      const d = await r.json();
      if (r.ok && d.caption) setCaption(d.caption);
    } catch { /* */ }
    setCaptionLoading(false);
  }

  async function handlePublish() {
    if (publishIndices.size === 0 || !caption.trim()) return;
    setPublishing(true);
    try {
      const selected = Array.from(publishIndices).sort();
      const images: string[] = [];
      for (const idx of selected) {
        images.push(await renderSlideToPng(slides[idx]));
      }
      const r = await fetch("/api/linkedin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images, caption }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Publish failed");
      setPublishOpen(false);
      showToast("Posted to LinkedIn!");
      if (savedId) {
        await fetch(`/api/carousels/${savedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "published" }),
        }).catch(() => {});
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Publish failed", "err");
    } finally {
      setPublishing(false);
    }
  }

  function openPostLater() {
    setDownloadIndices(new Set(slides.map((_, i) => i)));
    setDownloadOpen(true);
  }

  function openPublish() {
    setPublishIndices(new Set(slides.map((_, i) => i)));
    setCaption("");
    setPublishOpen(true);
    generateCaption();
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f13] overflow-hidden">
      <FreeBanner linkedinConnected={linkedinConnected} />

      <div className="flex-1 overflow-y-auto">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Carousel Generator</h2>
            <p className="mt-0.5 text-sm text-white/40">Create and schedule carousels using AI, YouTube or links.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white/60 hover:bg-white/[0.08] hover:text-white transition">
              <span className="text-xs text-white/30">Size:</span>
              <div className="rounded-[2px] border-[1.5px] border-white/40" style={{ width: "11px", height: "14px" }} />
              <span className="font-medium text-white/70">Portrait</span>
              <svg className="h-3 w-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
              Smart Carousel
            </button>
          </div>
        </div>

        {/* ── Action bar ── */}
        <div className="flex rounded-lg border border-white/10 overflow-hidden mx-6 mb-4">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="flex items-center gap-1.5 px-4 h-11 text-[13px] font-semibold text-white/55 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border-r border-white/10 transition disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-white/[0.03] disabled:hover:text-white/55"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 010 8h-1"/></svg>
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="flex items-center gap-1.5 px-4 h-11 text-[13px] font-semibold text-white/55 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border-r border-white/10 transition disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-white/[0.03] disabled:hover:text-white/55"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 14l4-4-4-4"/><path d="M19 10H8a4 4 0 000 8h1"/></svg>
            Redo
          </button>
          <button onClick={() => setShowSaveDialog(true)} disabled={savingDraft}
            className="flex items-center gap-1.5 px-4 h-11 text-[13px] font-semibold text-white/55 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border-r border-white/10 transition disabled:opacity-50">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />{savingDraft ? "Saving..." : savedId ? "Saved ✓" : "Save"}
          </button>
          <button onClick={openPostLater}
            className="flex items-center gap-1.5 px-4 h-11 text-[13px] font-semibold text-white/55 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border-r border-white/10 transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg>
            Post Later
          </button>
          <button onClick={openPublish}
            className="flex items-center gap-1.5 px-4 h-11 text-[13px] font-semibold text-white/55 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            Publish
          </button>
        </div>

        {/* ── Two-panel builder ── */}
        <div className="flex flex-col md:flex-row gap-5 px-6 pb-6">

          {/* ── Left panel ── */}
          <div className="flex-1 flex flex-col rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden" style={{ minHeight: "580px" }}>

            {selectedEl ? (
              /* ── Properties panel ── */
              <>
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
                  <span className="text-sm font-semibold text-white">Text Properties</span>
                  <button onClick={() => setSelectedId(null)} className="text-white/30 hover:text-white/70 transition text-xs">← Back</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

                  {/* Formatting toolbar */}
                  <div>
                    <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Formatting</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {[
                        { label: "B", title: "Bold",          active: selectedEl.bold,          onClick: () => updateEl(selectedEl.id, { bold: !selectedEl.bold }),          style: { fontWeight: "bold" } },
                        { label: "I", title: "Italic",        active: selectedEl.italic,        onClick: () => updateEl(selectedEl.id, { italic: !selectedEl.italic }),        style: { fontStyle: "italic" } },
                        { label: "U", title: "Underline",     active: selectedEl.underline,     onClick: () => updateEl(selectedEl.id, { underline: !selectedEl.underline }),     style: { textDecoration: "underline" } },
                        { label: "S", title: "Strikethrough", active: selectedEl.strikethrough, onClick: () => updateEl(selectedEl.id, { strikethrough: !selectedEl.strikethrough }), style: { textDecoration: "line-through" } },
                      ].map((b) => (
                        <button key={b.label} title={b.title} onClick={b.onClick}
                          className={`w-9 h-9 rounded-lg text-sm transition ${b.active ? "bg-blue-600 text-white" : "bg-white/[0.05] text-white/50 hover:bg-white/[0.1] hover:text-white border border-white/[0.08]"}`}
                          style={b.style}>{b.label}</button>
                      ))}
                      <div className="w-px h-6 bg-white/10 mx-1" />
                      {(["left","center","right"] as TAlign[]).map((a) => (
                        <button key={a} title={`Align ${a}`} onClick={() => updateEl(selectedEl.id, { textAlign: a })}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${selectedEl.textAlign === a ? "bg-blue-600 text-white" : "bg-white/[0.05] text-white/50 hover:bg-white/[0.1] hover:text-white border border-white/[0.08]"}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {a === "left"   && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></>}
                            {a === "center" && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>}
                            {a === "right"  && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></>}
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text content */}
                  <div>
                    <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Text Content</p>
                    <textarea
                      value={selectedEl.text}
                      onChange={(e) => updateEl(selectedEl.id, { text: e.target.value })}
                      rows={4}
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  {/* Font family + size */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Font</p>
                      <select value={selectedEl.fontFamily} onChange={(e) => updateEl(selectedEl.id, { fontFamily: e.target.value })}
                        className="w-full bg-[#1a1a2e] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500/50"
                        style={{ colorScheme: "dark" }}>
                        {FONT_FAMILIES.map((f) => (
                          <option key={f} value={f} style={{ background: "#1a1a2e", color: "#fff", fontFamily: f }}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Size (px)</p>
                      <input type="number" min={8} max={200} value={selectedEl.fontSize}
                        onChange={(e) => updateEl(selectedEl.id, { fontSize: Number(e.target.value) })}
                        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500/50 [color-scheme:dark]" />
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Text Color</p>
                      <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2">
                        <input type="color"
                          value={(() => {
                            const c = selectedEl.color;
                            if (c.startsWith("#")) return c.slice(0, 7);
                            const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                            if (!m) return "#ffffff";
                            return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
                          })()}
                          onChange={(e) => updateEl(selectedEl.id, { color: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                        <span className="text-white/50 text-[12px] font-mono truncate">{selectedEl.color}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Fill Color</p>
                      <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2">
                        <input type="color"
                          value={selectedEl.fillColor === "transparent" ? "#000000" : selectedEl.fillColor}
                          onChange={(e) => updateEl(selectedEl.id, { fillColor: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                        <button onClick={() => updateEl(selectedEl.id, { fillColor: "transparent" })}
                          className="text-[11px] text-white/30 hover:text-white/60 transition ml-auto">None</button>
                      </div>
                    </div>
                  </div>

                  {/* Position / size */}
                  <div>
                    <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Position & Size</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "X", value: Math.round(selectedEl.x), onChange: (v: number) => updateEl(selectedEl.id, { x: v }) },
                        { label: "Y", value: Math.round(selectedEl.y), onChange: (v: number) => updateEl(selectedEl.id, { y: v }) },
                        { label: "W", value: Math.round(selectedEl.w), onChange: (v: number) => updateEl(selectedEl.id, { w: Math.max(40, v) }) },
                        { label: "H", value: Math.round(selectedEl.h), onChange: (v: number) => updateEl(selectedEl.id, { h: Math.max(20, v) }) },
                        { label: "°",  value: Math.round(selectedEl.rotate), onChange: (v: number) => updateEl(selectedEl.id, { rotate: v }) },
                      ].map(({ label, value, onChange }) => (
                        <div key={label} className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2 py-1.5">
                          <span className="text-[10px] text-white/25 w-4 shrink-0">{label}</span>
                          <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
                            className="w-full bg-transparent text-white text-[12px] focus:outline-none [color-scheme:dark]" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delete */}
                  <button onClick={() => deleteEl(selectedEl.id)}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-sm hover:bg-red-500/10 transition">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    Delete Element
                  </button>
                </div>
              </>
            ) : (
              /* ── Content panel ── */
              <>
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
                  <span className="text-sm font-semibold text-white/70">Content</span>
                  <label className="flex items-center gap-2 text-xs text-white/35 cursor-pointer select-none">
                    Focus Mode
                    <span className="relative flex h-4 w-7 rounded-full bg-white/[0.1]">
                      <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white/30" />
                    </span>
                  </label>
                </div>
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white/25 uppercase tracking-wider">Add to Slide</span>
                  </div>

                  {/* ── Background picker ── */}
                  <div>
                    <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Background</p>
                    <div className="flex flex-wrap gap-2">
                      {(legacyTpl?.gradients ?? GRADIENTS).map((g, i) => (
                        <button
                          key={i}
                          title="Set background"
                          onClick={() => setBg(g)}
                          className="w-8 h-8 rounded-lg transition-all duration-150"
                          style={{
                            background: g,
                            boxSizing: "border-box",
                            border: slide?.bg === g && !slide?.bgImage ? "2.5px solid #6366f1" : "2px solid rgba(255,255,255,0.12)",
                            outline: slide?.bg === g && !slide?.bgImage ? "1px solid rgba(99,102,241,0.4)" : "none",
                          }}
                        />
                      ))}
                      {/* Solid color picker */}
                      <label className="w-8 h-8 rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 flex items-center justify-center cursor-pointer transition relative overflow-hidden" title="Pick solid color">
                        <input
                          type="color"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          onChange={(e) => setBg(e.target.value)}
                        />
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 pointer-events-none">
                          <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                        </svg>
                      </label>
                      {/* Remove bg image */}
                      {slide?.bgImage && (
                        <button
                          title="Remove background image"
                          onClick={() => setSlides((prev) => prev.map((s, i) => i !== activeSlideRef.current ? s : { ...s, bgImage: undefined }))}
                          className="w-8 h-8 rounded-lg border-2 border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition text-[10px] font-bold"
                        >✕</button>
                      )}
                    </div>
                  </div>

                  <button onClick={() => addEl(mkEl({ y: 160, h: 120, text: "Add Heading", fontSize: 44, bold: true, typoConfig: TYPO_PRESETS.free_heading }))}
                    className="w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-5 py-3.5 text-left text-2xl font-bold text-white/45 hover:bg-white/[0.07] hover:border-white/20 hover:text-white/70 transition">
                    Add Heading
                  </button>

                  <button onClick={() => addEl(mkEl({ y: 300, h: 80, text: "Add Subheading", fontSize: 24, color: "rgba(255,255,255,0.7)", typoConfig: TYPO_PRESETS.free_subheading }))}
                    className="w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-5 py-3.5 text-left text-lg font-semibold text-white/35 hover:bg-white/[0.07] hover:border-white/20 hover:text-white/60 transition">
                    Add Subheading
                  </button>

                  <button onClick={() => addEl(mkEl({ y: 400, h: 180, text: "Add text content here...", fontSize: 16, color: "rgba(255,255,255,0.5)", typoConfig: TYPO_PRESETS.free_body }))}
                    className="w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-5 py-3 text-left text-sm text-white/30 hover:bg-white/[0.07] hover:border-white/20 hover:text-white/50 transition">
                    Add Text Content
                  </button>

                  <div
                    className="relative flex items-center gap-4 rounded-lg border-2 border-dashed border-white/[0.09] bg-white/[0.02] px-5 py-4 hover:bg-white/[0.04] hover:border-white/20 transition cursor-pointer"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImgFile(file);
                    }}
                    onClick={() => imgInputRef.current?.click()}
                    onPaste={(e) => {
                      const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
                      const file = item?.getAsFile();
                      if (file) handleImgFile(file);
                    }}
                  >
                    <input
                      ref={imgInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImgFile(f); e.target.value = ""; }}
                    />
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] text-white/45">Drag and drop, Paste, <span className="text-blue-400">or browse</span> to upload</p>
                      <p className="text-[11px] text-white/20 mt-0.5">PNG, JPG, GIF up to 10MB — sets as background</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/[0.05]">
                    <button onClick={() => {
                      setSlides((prev) => prev.map((s, i) => i !== activeSlide ? s : { ...s, elements: [] }));
                      setSelectedId(null);
                    }} className="flex items-center gap-2 text-[12px] text-white/30 hover:text-white/60 transition mx-auto">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
                      Reset Slide
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Right panel — Canvas ── */}
          <div className="w-full md:w-[380px] shrink-0 flex flex-col gap-3">

            {/* Canvas area */}
            <div ref={canvasWrapRef} className="rounded-xl border border-white/10 bg-[#111118] overflow-hidden p-3">
              {/* Scaled canvas */}
              <div style={{ width: "100%", height: CH * scale, position: "relative" }}>
                <div
                  style={{ width: CW, height: CH, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0, overflow: "hidden", borderRadius: 12, background: slide?.bgImage ? "#000" : slide?.bg }}
                  onClick={() => { setSelectedId(null); setEditingId(null); }}
                >
                  {/* Background image */}
                  {slide?.bgImage && (
                    <img src={slide.bgImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", userSelect: "none", pointerEvents: "none" }} />
                  )}

                  {/* Canvas elements */}
                  {slide?.elements?.map((el) => (
                    <CanvasTextElement
                      key={el.id}
                      el={el}
                      selected={selectedId === el.id}
                      editing={editingId === el.id}
                      onSelect={() => { setSelectedId(el.id); setEditingId(null); }}
                      onStartEdit={() => { setSelectedId(el.id); setEditingId(el.id); }}
                      onStopEdit={() => setEditingId(null)}
                      onDragStart={(e) => startDrag(e, el.id, el.x, el.y)}
                      onResizeStart={(e) => startResize(e, el.id, el.w)}
                      onChange={(patch) => updateEl(el.id, patch)}
                      onDelete={() => deleteEl(el.id)}
                      onDuplicate={() => { duplicateEl(el.id); setSelectedId(el.id); }}
                    />
                  ))}

                  {/* Empty canvas hint */}
                  {(slide?.elements?.length ?? 1) === 0 && !slide?.bgImage && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
                      <p style={{ color: "rgba(255,255,255,0.12)", fontSize: 14, fontFamily: "Inter,sans-serif" }}>{`Click "Add Heading" to start`}</p>
                    </div>
                  )}

                  {/* Slide indicator dots only (no watermark) */}
                  <div style={{ position: "absolute", bottom: 16, left: 24, right: 24, display: "flex", alignItems: "center", pointerEvents: "none" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {slides.map((_, i) => (
                        <div key={i} style={{ width: i === activeSlide ? 18 : 5, height: 4, borderRadius: 9, background: i === activeSlide ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.2)", transition: "all 0.2s" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {slides.map((s, i) => (
                <div key={s.id} className="relative shrink-0">
                  {/* Click popup */}
                  {slidePopupIdx === i && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-[#1c1c2a] border border-white/[0.12] rounded-xl shadow-2xl p-2.5 w-[110px]">
                      <p className="text-white/50 text-[9px] font-bold text-center mb-2 uppercase tracking-widest">Slide {i + 1}</p>
                      <div className="w-full rounded-lg overflow-hidden border border-white/[0.08] relative" style={{ aspectRatio: `${CW}/${CH}` }}>
                        <MiniSlide slide={s} width={106} />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSlide(i); }}
                        disabled={slides.length <= 1}
                        className="mt-2 w-full py-1.5 text-[10px] font-bold text-red-400/80 hover:text-red-300 bg-red-500/[0.08] hover:bg-red-500/[0.15] rounded-lg transition disabled:opacity-25 disabled:cursor-not-allowed"
                      >Delete</button>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setActiveSlide(i);
                      setSelectedId(null);
                      setEditingId(null);
                      setSlidePopupIdx(slidePopupIdx === i ? null : i);
                    }}
                    className={`w-[56px] rounded-lg overflow-hidden border-2 transition relative ${i === activeSlide ? "border-blue-500" : "border-white/10 hover:border-white/25"}`}
                    style={{ aspectRatio: `${CW}/${CH}` }}
                  >
                    <MiniSlide slide={s} width={56} />
                    <span className="absolute bottom-1 right-1 text-[8px] font-bold text-white/60 bg-black/40 rounded px-1">
                      {i + 1}
                    </span>
                  </button>
                </div>
              ))}
              {/* Add slide */}
              <button
                onClick={() => {
                  const newSlide = legacyTpl
                    ? makeTemplateSlide(legacyTpl, slides.length, "Add Heading", "Add subtitle or body text")
                    : makeEmptySlide(slides.length);
                  setSlides((p) => [...p, newSlide]);
                  setActiveSlide(slides.length);
                  setSlidePopupIdx(null);
                }}
                className="shrink-0 w-[56px] rounded-lg border-2 border-dashed border-white/10 hover:border-white/25 flex items-center justify-center text-white/20 hover:text-white/40 transition"
                style={{ aspectRatio: `${CW}/${CH}` }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
              </button>
            </div>

            {/* Slide nav */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02]">
              <button onClick={() => { setActiveSlide((i) => Math.max(0, i - 1)); setSelectedId(null); }} disabled={activeSlide === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <p className="text-white/40 text-sm font-medium">Slide {activeSlide + 1} / {slides.length}</p>
              <button onClick={() => { setActiveSlide((i) => Math.min(slides.length - 1, i + 1)); setSelectedId(null); }} disabled={activeSlide >= slides.length - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>

            {/* Hint */}
            {!selectedEl && (
              <p className="text-[11px] text-white/20 text-center px-2">
                Click an element to select · Double-click to edit text · Drag to move
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Save Type Dialog ── */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161e] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-bold text-base mb-1">Choose Save Type</h3>
            <p className="text-white/40 text-sm mb-5">How would you like to save this carousel?</p>
            <div className="space-y-3">
              <button onClick={() => handleSaveDraft("draft")} disabled={savingDraft}
                className="w-full p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-left transition disabled:opacity-50">
                <p className="text-white font-semibold text-sm">Save as Draft</p>
                <p className="text-white/35 text-xs mt-0.5">Unfinished work — visible in Drafts only</p>
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveCompleteIndices(new Set(slides.map((_, i) => i)));
                  setShowCompleteSlideSelect(true);
                  setCaption(""); // clear old caption
                  generateCaption(); // pre-generate while user selects slides
                }}
                disabled={savingDraft}
                className="w-full p-4 rounded-xl border border-blue-500/30 bg-blue-500/[0.07] hover:bg-blue-500/[0.12] text-left transition disabled:opacity-50">
                <p className="text-blue-300 font-semibold text-sm">Save as Complete</p>
                <p className="text-blue-300/50 text-xs mt-0.5">Choose which slides to include →</p>
              </button>
            </div>
            <button onClick={() => setShowSaveDialog(false)} className="mt-4 w-full py-2 text-white/30 hover:text-white/60 text-sm transition">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Save Complete — Slide Selection + Caption ── */}
      {showCompleteSlideSelect && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161e] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-bold text-base mb-1">Select Slides to Save</h3>
            <p className="text-white/40 text-sm mb-4">Choose which slides to include in your complete carousel</p>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setSaveCompleteIndices(
                  saveCompleteIndices.size === slides.length ? new Set() : new Set(slides.map((_, i) => i))
                )}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition ${saveCompleteIndices.size === slides.length ? "bg-blue-600 border-blue-500 text-white" : "bg-white/[0.05] border-white/[0.1] text-white/50 hover:border-white/20"}`}
              >All</button>
              <span className="text-white/25 text-[11px]">{saveCompleteIndices.size} of {slides.length} selected</span>
            </div>
            <div className="flex flex-wrap gap-3 mb-5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    const next = new Set(saveCompleteIndices);
                    next.has(i) ? next.delete(i) : next.add(i);
                    setSaveCompleteIndices(next);
                  }}
                  className={`relative rounded-xl overflow-hidden border-2 transition ${saveCompleteIndices.has(i) ? "border-blue-500" : "border-white/[0.08] hover:border-white/20 opacity-50"}`}
                  style={{ width: 72, aspectRatio: `${CW}/${CH}` }}
                >
                  <MiniSlide slide={s} width={72} />
                  {saveCompleteIndices.has(i) && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 text-[8px] font-bold text-white bg-black/50 rounded px-1">{i + 1}</span>
                </button>
              ))}
            </div>

            {/* Caption section — inline below slides */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">LinkedIn Caption</label>
                {captionLoading && <span className="text-[10px] text-blue-400 animate-pulse">Generating…</span>}
                {!captionLoading && !caption && (
                  <button onClick={generateCaption} className="text-[10px] text-blue-400 hover:text-blue-300 transition">Generate</button>
                )}
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={5}
                placeholder={captionLoading ? "Generating caption…" : "LinkedIn caption will appear here…"}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-[13px] leading-relaxed resize-none focus:outline-none focus:border-blue-500/50 placeholder-white/20"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleSaveDraft("complete", saveCompleteIndices)}
                disabled={savingDraft || saveCompleteIndices.size === 0}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-sm transition disabled:opacity-40"
              >
                {savingDraft ? "Saving…" : `Save ${saveCompleteIndices.size} Slide${saveCompleteIndices.size !== 1 ? "s" : ""}`}
              </button>
              <button onClick={() => setShowCompleteSlideSelect(false)} className="px-5 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white/70 text-sm transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all ${toast.type === "ok" ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-red-500/20 border-red-500/30 text-red-300"}`}>
          {toast.type === "ok" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* ── Post Later modal ── */}
      {downloadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDownloadOpen(false)} />
          <div className="relative w-full max-w-md bg-[#16161e] border border-white/[0.08] rounded-2xl shadow-2xl z-10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Schedule for Later</h2>
              <button onClick={() => setDownloadOpen(false)} className="text-white/30 hover:text-white/70">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div>
              <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3">Select Slides</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => {
                    if (downloadIndices.size === slides.length) setDownloadIndices(new Set());
                    else setDownloadIndices(new Set(slides.map((_, i) => i)));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition ${downloadIndices.size === slides.length ? "bg-blue-600 border-blue-500 text-white" : "bg-white/[0.05] border-white/[0.1] text-white/50 hover:border-white/20"}`}
                >All</button>
                {slides.map((_, i) => (
                  <button key={i}
                    onClick={() => {
                      const next = new Set(downloadIndices);
                      next.has(i) ? next.delete(i) : next.add(i);
                      setDownloadIndices(next);
                    }}
                    className={`w-9 h-9 rounded-lg text-[12px] font-bold border transition ${downloadIndices.has(i) ? "bg-blue-600 border-blue-500 text-white" : "bg-white/[0.05] border-white/[0.1] text-white/50 hover:border-white/20"}`}
                  >{i + 1}</button>
                ))}
              </div>
              <p className="text-[11px] text-white/30">{downloadIndices.size} slide{downloadIndices.size !== 1 ? "s" : ""} selected</p>
            </div>
            <button onClick={handleSchedulePostLater} disabled={downloading || downloadIndices.size === 0}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[14px] transition disabled:opacity-40 flex items-center justify-center gap-2">
              {downloading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Scheduling...</> : <>⏰ Schedule {downloadIndices.size > 0 ? downloadIndices.size : ""} Slide{downloadIndices.size !== 1 ? "s" : ""}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Publish modal ── */}
      {publishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!publishing) setPublishOpen(false); }} />
          <div className="relative w-full max-w-lg bg-[#16161e] border border-white/[0.08] rounded-2xl shadow-2xl z-10 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                <h2 className="text-base font-bold text-white">Publish to LinkedIn</h2>
              </div>
              <button onClick={() => { if (!publishing) setPublishOpen(false); }} className="text-white/30 hover:text-white/70">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div>
              <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3">Select Slides to Post</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (publishIndices.size === slides.length) setPublishIndices(new Set());
                    else setPublishIndices(new Set(slides.map((_, i) => i)));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition ${publishIndices.size === slides.length ? "bg-blue-600 border-blue-500 text-white" : "bg-white/[0.05] border-white/[0.1] text-white/50 hover:border-white/20"}`}
                >All</button>
                {slides.map((_, i) => (
                  <button key={i}
                    onClick={() => {
                      const next = new Set(publishIndices);
                      next.has(i) ? next.delete(i) : next.add(i);
                      setPublishIndices(next);
                    }}
                    className={`w-9 h-9 rounded-lg text-[12px] font-bold border transition ${publishIndices.has(i) ? "bg-blue-600 border-blue-500 text-white" : "bg-white/[0.05] border-white/[0.1] text-white/50 hover:border-white/20"}`}
                  >{i + 1}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Caption</p>
                <button onClick={generateCaption} disabled={captionLoading}
                  className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition disabled:opacity-50">
                  {captionLoading ? <><span className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />Generating...</> : <>↻ Regenerate</>}
                </button>
              </div>
              {captionLoading && !caption ? (
                <div className="w-full h-36 bg-white/[0.04] border border-white/[0.1] rounded-xl flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : (
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={7}
                  placeholder="AI caption will appear here..."
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed" />
              )}
              <p className="text-[10px] text-white/20 mt-1">{caption.length} chars — edit before posting</p>
            </div>

            {!linkedinConnected && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-yellow-400 text-sm">⚠</span>
                <p className="text-yellow-300 text-[13px]">LinkedIn not connected. <a href="/dashboard/settings" className="underline">Connect here</a></p>
              </div>
            )}

            <button onClick={handlePublish} disabled={publishing || publishIndices.size === 0 || !caption.trim() || !linkedinConnected}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-[14px] transition disabled:opacity-40 flex items-center justify-center gap-3">
              {publishing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publishing...</> : <>Post {publishIndices.size} Slide{publishIndices.size !== 1 ? "s" : ""} to LinkedIn</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Smart Carousel drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!loading) setDrawerOpen(false); }} />
          <div className="relative w-full max-w-xl bg-[#16161e] border border-white/[0.08] rounded-t-3xl md:rounded-2xl shadow-2xl z-10 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                <h2 className="text-base font-bold text-white">Smart Carousel</h2>
              </div>
              <button onClick={() => { if (!loading) setDrawerOpen(false); }} className="text-white/30 hover:text-white/70 transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
                {([{ key: "topic", label: "Topic / Idea" }, { key: "product", label: "Product" }, { key: "url", label: "Article URL" }] as { key: InputMode; label: string }[]).map((tab) => (
                  <button key={tab.key} onClick={() => {
                    setMode(tab.key);
                    setInput(tab.key === "product" ? savedProductUrl : "");
                  }}
                    className={`flex-1 py-2.5 text-[12px] font-semibold transition border-r last:border-r-0 border-white/[0.08] ${mode === tab.key ? "bg-blue-600 text-white" : "bg-white/[0.03] text-white/35 hover:text-white/60 hover:bg-white/[0.06]"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">
                  {mode === "topic" ? "Your Topic or Idea" : mode === "product" ? "Product URL" : "Article / Blog URL"}
                </label>
                {mode === "topic" ? (
                  <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholders[mode]} rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 resize-none" />
                ) : (
                  <input type="url" value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholders[mode]}
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                )}
                {mode === "product" && (
                  <p className="text-[11px] text-white/25 mt-1.5">
                    We&apos;ll scan your website and extract product details automatically.
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Target Audience</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-[13px] focus:outline-none focus:border-blue-500/50 [color-scheme:dark]">
                  {AUDIENCES.map((a) => (
                    <option key={a} value={a} className="bg-[#16161e] text-white">{a}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Number of Slides</label>
                  <select value={numSlides} onChange={(e) => setNumSlides(Number(e.target.value))}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-[13px] focus:outline-none focus:border-blue-500/50 [color-scheme:dark]">
                    {SLIDE_COUNTS.map((n) => (
                      <option key={n} value={n} className="bg-[#16161e] text-white">{n} slides</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Tone</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value as Tone)}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-[13px] focus:outline-none focus:border-blue-500/50 [color-scheme:dark]">
                    <option value="professional" className="bg-[#16161e] text-white">Professional</option>
                    <option value="casual" className="bg-[#16161e] text-white">Casual</option>
                    <option value="bold" className="bg-[#16161e] text-white">Bold</option>
                    <option value="storytelling" className="bg-[#16161e] text-white">Storytelling</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <span className="text-red-400 text-sm">⚠</span>
                  <p className="text-red-300 text-[13px]">{error}</p>
                </div>
              )}

              <button onClick={handleGenerate} disabled={loading || !input.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-[14px] transition disabled:opacity-40 flex items-center justify-center gap-3">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{statusMsg || "Generating..."}</>
                ) : (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>Generate Carousel</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MiniSlide: static scaled thumbnail of a slide ────────────────────────────
function MiniSlide({ slide, width }: { slide: CanvasSlide; width: number }) {
  const scale = width / CW;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: slide.bgImage ? "#111" : slide.bg }}>
      {slide.bgImage && (
        <img src={slide.bgImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
      )}
      <div style={{ width: CW, height: CH, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        {slide.elements?.map((el) => <MiniEl key={el.id} el={el} />)}
      </div>
    </div>
  );
}

function MiniEl({ el }: { el: CanvasEl }) {
  const shape = el.shape ?? "text";
  const common: React.CSSProperties = {
    position: "absolute",
    left: el.x, top: el.y, width: el.w, height: el.h,
    boxSizing: "border-box",
  };
  if (shape === "ring") {
    return <div style={{ ...common, background: "transparent", borderRadius: "50%", border: `${el.borderWidth ?? 4}px solid ${el.borderColor ?? "rgba(255,255,255,0.25)"}` }} />;
  }
  if (shape === "bar") {
    return <div style={{ ...common, background: el.fillColor === "transparent" ? "rgba(255,255,255,0.35)" : el.fillColor, borderRadius: el.borderRadius ?? 999 }} />;
  }
  const bgStyle: React.CSSProperties =
    shape === "circle" ? { background: el.fillColor, borderRadius: "50%" } :
    shape === "chip"   ? { background: el.fillColor === "transparent" ? "transparent" : el.fillColor, border: el.borderColor ? `${el.borderWidth ?? 1}px solid ${el.borderColor}` : undefined, borderRadius: el.borderRadius ?? 6, padding: "4px 8px" } :
    {};
  return (
    <div style={{
      ...common, ...bgStyle,
      color: el.color,
      fontFamily: el.fontFamily + ",sans-serif",
      fontSize: el.fontSize,
      fontWeight: el.bold ? "bold" : "normal",
      fontStyle: el.italic ? "italic" : "normal",
      textAlign: el.textAlign,
      lineHeight: el.lineHeight ?? 1.35,
      letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
      textTransform: el.textTransform ?? "none",
      whiteSpace: "pre-wrap", wordBreak: "break-word",
      display: "flex", flexDirection: "column",
      justifyContent: shape === "circle" || shape === "chip" ? "center" : "flex-start",
      alignItems: el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
      overflow: "hidden",
    }}>
      {el.text}
    </div>
  );
}

// ── Canvas Text Element ───────────────────────────────────────────────────────
interface CanvasTextElProps {
  el: CanvasEl;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onChange: (patch: Partial<CanvasEl>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function CanvasTextElement({ el, selected, editing, onSelect, onStartEdit, onStopEdit, onDragStart, onResizeStart, onChange, onDelete, onDuplicate }: CanvasTextElProps) {
  const shape  = el.shape ?? "text";
  const locked = Boolean(el.locked);

  // ── Auto Typography Engine ────────────────────────────────────────────────
  const typo = useMemo(() => {
    if (!el.typoConfig || typeof window === "undefined") {
      return { fontSize: el.fontSize, lineHeight: el.lineHeight ?? 1.35, letterSpacing: el.letterSpacing ?? 0, overflows: false };
    }
    return fitText(el.text, el.fontFamily, el.bold, el.italic, el.fontSize, el.w, el.h, el.typoConfig);
  }, [el.text, el.fontFamily, el.bold, el.italic, el.fontSize, el.w, el.h, el.typoConfig, el.lineHeight, el.letterSpacing]);

  const effectiveLineHeight    = el.lineHeight    ?? typo.lineHeight;
  const effectiveLetterSpacing = el.letterSpacing ?? typo.letterSpacing;

  const textStyle: React.CSSProperties = {
    fontFamily:     el.fontFamily + ",sans-serif",
    fontSize:       typo.fontSize,
    fontWeight:     el.bold ? "bold" : "normal",
    fontStyle:      el.italic ? "italic" : "normal",
    textDecoration: [el.underline && "underline", el.strikethrough && "line-through"].filter(Boolean).join(" ") || "none",
    color:          el.color,
    textAlign:      el.textAlign,
    lineHeight:     effectiveLineHeight,
    letterSpacing:  effectiveLetterSpacing !== 0 ? `${effectiveLetterSpacing}px` : undefined,
    textTransform:  el.textTransform ?? "none",
    whiteSpace:     "pre-wrap",
    wordBreak:      "break-word",
    display:        "flex",
    flexDirection:  "column",
    justifyContent: shape === "circle" || shape === "chip" ? "center" : "flex-start",
    alignItems:     el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
  };

  // ── Shape-specific container styles ───────────────────────────────────────
  let shapeStyle: React.CSSProperties = {};
  if (shape === "circle") {
    shapeStyle = {
      background: el.fillColor === "transparent" ? "transparent" : el.fillColor,
      borderRadius: "50%",
      border: el.borderColor ? `${el.borderWidth ?? 1}px solid ${el.borderColor}` : undefined,
    };
  } else if (shape === "ring") {
    shapeStyle = {
      background: "transparent",
      borderRadius: "50%",
      border: `${el.borderWidth ?? 4}px solid ${el.borderColor ?? "rgba(255,255,255,0.25)"}`,
    };
  } else if (shape === "bar") {
    shapeStyle = {
      background: el.fillColor === "transparent" ? "rgba(255,255,255,0.35)" : el.fillColor,
      borderRadius: el.borderRadius ?? 999,
    };
  } else if (shape === "chip") {
    shapeStyle = {
      background: el.fillColor === "transparent" ? "transparent" : el.fillColor,
      border: el.borderColor ? `${el.borderWidth ?? 1}px solid ${el.borderColor}` : undefined,
      borderRadius: el.borderRadius ?? 6,
      padding: "4px 8px",
      boxSizing: "border-box",
    };
  } else {
    shapeStyle = {
      background: el.fillColor === "transparent" ? "transparent" : el.fillColor,
      borderRadius: 4,
    };
  }

  return (
    <div
      style={{
        position:  "absolute",
        left:      el.x,
        top:       el.y,
        width:     el.w,
        height:    shape === "circle" || shape === "ring" || shape === "bar" || shape === "chip" ? el.h : undefined,
        minHeight: shape === "text" ? el.h : undefined,
        transform: `rotate(${el.rotate}deg)`,
        boxSizing: "border-box",
        cursor:    locked ? "default" : (editing ? "text" : "move"),
        userSelect: editing ? "text" : "none",
        pointerEvents: locked ? "none" : "auto",
        ...shapeStyle,
        // Selection outline overrides shape border while selected
        outline: selected && !locked ? "1.5px solid rgba(99,102,241,0.85)" : "none",
        outlineOffset: 2,
      }}
      onClick={(e) => { if (locked) return; e.stopPropagation(); onSelect(); }}
      onDoubleClick={(e) => { if (locked) return; e.stopPropagation(); onStartEdit(); }}
      onMouseDown={(e) => { if (locked || editing) return; onDragStart(e); }}
    >
      {shape === "ring" || shape === "bar" ? null : editing ? (
        <textarea
          autoFocus
          value={el.text}
          onChange={(e) => onChange({ text: e.target.value })}
          onBlur={onStopEdit}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            ...textStyle,
            display: "block",
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            minHeight: el.h,
            background: "rgba(0,0,0,0.3)",
            border: "none",
            outline: "none",
            resize: "none",
            padding: "4px 6px",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <div style={{ ...textStyle, padding: "4px 6px", minHeight: el.h, boxSizing: "border-box" }}>
          {el.text}
        </div>
      )}

      {/* Selection handles + floating toolbar (only for editable text elements) */}
      {selected && !editing && !locked && shape === "text" && (
        <>
          {/* Floating toolbar above element */}
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: -42,
              left: 0,
              display: "flex",
              alignItems: "center",
              gap: 2,
              background: "#18182a",
              border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: 8,
              padding: "4px 6px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              zIndex: 20,
              whiteSpace: "nowrap",
            }}
          >
            {/* Edit text */}
            <button title="Edit text" onMouseDown={(e) => { e.stopPropagation(); onStartEdit(); }}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", color: "rgba(255,255,255,0.7)" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            {/* Duplicate */}
            <button title="Duplicate" onMouseDown={(e) => { e.stopPropagation(); onDuplicate(); }}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", color: "rgba(255,255,255,0.7)" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />
            {/* Delete */}
            <button title="Delete element" onMouseDown={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", color: "rgba(239,68,68,0.8)" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>

          {/* Corner dots */}
          {[
            { top: -4, left: -4 },
            { top: -4, right: -4 },
            { bottom: -4, left: -4 },
            { bottom: -4, right: -4 },
          ].map((pos, i) => (
            <div key={i} style={{ position: "absolute", width: 8, height: 8, background: "#fff", border: "1.5px solid #6366f1", borderRadius: 2, ...pos }} />
          ))}
          {/* Right resize handle */}
          <div
            onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e); }}
            style={{ position: "absolute", right: -5, top: "50%", transform: "translateY(-50%)", width: 10, height: 20, background: "#6366f1", borderRadius: 3, cursor: "ew-resize", opacity: 0.9 }}
          />
        </>
      )}
    </div>
  );
}
