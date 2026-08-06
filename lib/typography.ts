// ── Auto Typography Engine ────────────────────────────────────────────────────
// Canvas-based text measurement + adaptive fitting.
// Keeps designs visually balanced as user types — no sudden size jumps.
//
// Adaptation order (priority-ordered, no skipping steps):
//   1. Tighten lineHeight         (compresses vertical space, preserves font)
//   2. Tighten letterSpacing      (compresses horizontal space, only for large fonts)
//   3. Reduce fontSize 1px/step   (last resort — no sudden jumps)

export interface TypoConfig {
  minFontSize:   number;   // absolute floor — never go below
  maxLines:      number;   // target line count ceiling
  lineHeight:    number;   // preferred line height multiplier
  letterSpacing: number;   // preferred letter spacing in px
  padding:       number;   // internal element padding px (subtracted from measure width)
}

export interface TypoResult {
  fontSize:      number;
  lineHeight:    number;
  letterSpacing: number;
  overflows:     boolean;  // true when even minFontSize couldn't fit
}

// ── Per-role presets ─────────────────────────────────────────────────────────
// Each element role has sensible defaults.
// maxFontSize is NOT stored here — it comes from el.fontSize (the user's intent).
export const TYPO_PRESETS: Record<string, TypoConfig> = {
  headline_bold:    { minFontSize: 20, maxLines: 4, lineHeight: 1.10, letterSpacing: -0.5, padding: 8 },
  headline_quote:   { minFontSize: 18, maxLines: 5, lineHeight: 1.20, letterSpacing:  0,   padding: 8 },
  headline_number:  { minFontSize: 22, maxLines: 3, lineHeight: 1.15, letterSpacing: -0.3, padding: 8 },
  headline_profile: { minFontSize: 20, maxLines: 4, lineHeight: 1.20, letterSpacing:  0,   padding: 8 },
  headline_default: { minFontSize: 20, maxLines: 4, lineHeight: 1.15, letterSpacing: -0.3, padding: 8 },
  body:             { minFontSize: 11, maxLines: 8, lineHeight: 1.45, letterSpacing:  0,   padding: 8 },
  tag:              { minFontSize: 10, maxLines: 1, lineHeight: 1.20, letterSpacing:  2,   padding: 4 },
  free_heading:     { minFontSize: 14, maxLines: 5, lineHeight: 1.20, letterSpacing: -0.2, padding: 8 },
  free_subheading:  { minFontSize: 12, maxLines: 4, lineHeight: 1.30, letterSpacing:  0,   padding: 8 },
  free_body:        { minFontSize: 10, maxLines: 12, lineHeight: 1.50, letterSpacing:  0,  padding: 8 },
};

// ── Singleton hidden canvas (never attached to DOM) ──────────────────────────
let _canvas: HTMLCanvasElement | null = null;

function getCtx(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!_canvas) _canvas = document.createElement("canvas");
  return _canvas.getContext("2d");
}

// ── Text line counter ─────────────────────────────────────────────────────────
// Simulates CSS word-wrap: break-word + white-space: pre-wrap behaviour.
export function countLines(
  text: string,
  fontFamily: string,
  bold: boolean,
  italic: boolean,
  sizePx: number,
  widthPx: number,
): number {
  const c = getCtx();
  if (!c || widthPx <= 0) return 1;

  c.font = `${italic ? "italic " : ""}${bold ? "bold " : ""}${sizePx}px ${fontFamily}, sans-serif`;

  let total = 0;
  for (const para of text.split("\n")) {
    if (!para.trim()) { total++; continue; }
    let line = "";
    for (const word of para.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (c.measureText(candidate).width > widthPx && line !== "") {
        total++;
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) total++;
  }
  return Math.max(1, total);
}

/**
 * Fit `text` into `availWidth × availHeight` starting from `startSize`.
 *
 * Never makes sudden jumps — reduces parameters in gentle steps.
 * Returns the largest font size that fits without exceeding maxLines.
 */
export function fitText(
  text: string,
  fontFamily: string,
  bold: boolean,
  italic: boolean,
  startSize: number,
  availWidth: number,
  availHeight: number,
  config: TypoConfig,
): TypoResult {
  // Empty text — return intent unchanged
  if (!text.trim()) {
    return {
      fontSize:      startSize,
      lineHeight:    config.lineHeight,
      letterSpacing: config.letterSpacing,
      overflows:     false,
    };
  }

  const innerW = Math.max(20, availWidth - config.padding * 2);
  let fontSize      = Math.min(Math.max(startSize, config.minFontSize), 500);
  let lineHeight    = config.lineHeight;
  let letterSpacing = config.letterSpacing;

  for (let iter = 0; iter < 300; iter++) {
    const lines      = countLines(text, fontFamily, bold, italic, fontSize, innerW);
    const requiredH  = lines * fontSize * lineHeight + config.padding * 2;

    if (lines <= config.maxLines && requiredH <= availHeight) break; // ✓ fits

    // Step 1 — tighten lineHeight (0.05 per step, floor 1.0)
    if (lineHeight > 1.0) {
      lineHeight = Math.max(1.0, lineHeight - 0.05);
      continue;
    }

    // Step 2 — reduce letterSpacing for large text (0.3px per step, floor -3)
    if (fontSize > 28 && letterSpacing > -3) {
      letterSpacing = Math.max(-3, letterSpacing - 0.3);
      continue;
    }

    // Step 3 — reduce fontSize (1px per step — no sudden jumps)
    if (fontSize <= config.minFontSize) break;
    fontSize--;
  }

  return {
    fontSize:      Math.max(config.minFontSize, Math.round(fontSize)),
    lineHeight,
    letterSpacing,
    overflows:     fontSize <= config.minFontSize,
  };
}
