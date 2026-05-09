"use client";

import { useEffect, useRef } from "react";

/**
 * PCB / microchip schematic hero animation.
 *
 * Static board (grid + traces + ICs + vias + SMD parts + labels) is baked
 * into an offscreen canvas once and re-baked only on resize / theme change.
 * Per-frame work: drawImage(static) + a handful of pulses, via blinks, and
 * an occasional diagnostic sweep. Canvas 2D only.
 *
 * Honors prefers-reduced-motion (renders a single frozen frame).
 * Reads brand CSS vars at mount and on data-theme change.
 */

type RGB = { r: number; g: number; b: number };

type Point = { x: number; y: number };

type Trace = {
  pts: Point[]; // anchor points (axis-aligned chain)
  segLens: number[]; // length per segment (after rounded-corner approximation)
  total: number; // total polyline length
};

type Pulse = {
  trace: number;
  t: number; // 0..1 along trace
  speed: number; // units/sec (in 0..1 space)
  delay: number; // seconds remaining before respawn (>0 means dead/cooldown)
};

type IC = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  pinSide: "v" | "h"; // pins on vertical sides or horizontal
  pinCount: number;
};

type Via = { x: number; y: number; phase: number };

type SMD = { x: number; y: number; w: number; h: number; label?: string };

type CornerLabel = { x: number; y: number; text: string; align: CanvasTextAlign };

type MotherChip = { x: number; y: number; w: number; h: number; pinCount: number };

type Layout = {
  traces: Trace[];
  ics: IC[];
  vias: Via[];
  smds: SMD[];
  cornerLabels: CornerLabel[];
  mother: MotherChip;
};

type Palette = {
  primary: RGB;
  primaryDim: RGB;
  primaryGlow: RGB;
  secondary: RGB;
  bg: RGB;
  text: RGB;
  textFaint: string; // already-formatted color string for fillStyle
};

const GRID = 24;

function hexToRgb(hex: string): RGB {
  const clean = hex.trim().replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full || "000000", 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgba(c: RGB, a: number): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => {
    const v = cs.getPropertyValue(name).trim();
    return v || fallback;
  };
  return {
    primary: hexToRgb(read("--color-primary", "#B2451E")),
    primaryDim: hexToRgb(read("--color-primary-dim", "#7D3015")),
    primaryGlow: hexToRgb(read("--color-primary-glow", "#C8795D")),
    secondary: hexToRgb(read("--color-secondary", "#FFB38A")),
    bg: hexToRgb(read("--color-bg", "#07090D")),
    text: hexToRgb(read("--color-text", "#EBEBEB")),
    textFaint: read("--color-text-faint", "#787878"),
  };
}

// Mulberry32 PRNG — deterministic, no deps.
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Snap a coordinate to grid + 0.5 so 1px lines render crisply.
function snap(v: number): number {
  return Math.round(v / GRID) * GRID + 0.5;
}

function buildLayout(width: number, height: number, rng: () => number): Layout {
  const isMobile = width < 600;

  // Place the "mother" chip dead-center first; everything else lays out around it.
  const motherW = isMobile
    ? Math.max(78, Math.min(108, Math.floor(width * 0.26)))
    : Math.max(132, Math.min(168, Math.floor(width * 0.16)));
  const motherH = isMobile
    ? Math.max(60, Math.min(84, Math.floor(height * 0.22)))
    : Math.max(104, Math.min(132, Math.floor(height * 0.21)));
  const mother: MotherChip = {
    x: snap(width / 2 - motherW / 2) - 0.5,
    y: snap(height / 2 - motherH / 2) - 0.5,
    w: motherW,
    h: motherH,
    pinCount: isMobile ? 7 : 9,
  };
  const motherBuffer = isMobile ? 18 : 28;
  const motherBox = {
    x1: mother.x - motherBuffer,
    y1: mother.y - motherBuffer,
    x2: mother.x + mother.w + motherBuffer,
    y2: mother.y + mother.h + motherBuffer,
  };

  // Place ICs across the panel on a coarse jittered grid.
  const ics: IC[] = [];
  const cols = width > 900 ? 4 : 3;
  const rows = 2;
  const padX = isMobile ? 38 : 90;
  const padY = isMobile ? 42 : 70;
  const cellW = (width - padX * 2) / (cols - 1 || 1);
  const cellH = (height - padY * 2) / (rows - 1 || 1);

  let counter = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = padX + c * cellW + (rng() - 0.5) * (isMobile ? 10 : 16);
      const cy = padY + r * cellH + (rng() - 0.5) * (isMobile ? 8 : 14);
      const w = isMobile
        ? 26 + Math.floor(rng() * 12)
        : 38 + Math.floor(rng() * 18);
      const h = isMobile
        ? 16 + Math.floor(rng() * 8)
        : 22 + Math.floor(rng() * 10);
      // Clamp so the IC body + its pin stubs + label never bleed past the
      // panel edge. Pins extend 4px out; labels can sit ~10px above the body.
      const edgePad = 10;
      const xRaw = snap(cx) - 0.5;
      const yRaw = snap(cy) - 0.5;
      const x = Math.max(
        edgePad,
        Math.min(width - w - edgePad, xRaw),
      );
      const y = Math.max(
        edgePad + 4,
        Math.min(height - h - edgePad, yRaw),
      );
      // Skip cells that would crash into the mother chip's reserved zone.
      if (
        x < motherBox.x2 &&
        x + w > motherBox.x1 &&
        y < motherBox.y2 &&
        y + h > motherBox.y1
      ) {
        continue;
      }
      const pinSide: "v" | "h" = rng() > 0.5 ? "v" : "h";
      const pinCount = isMobile
        ? 4 + Math.floor(rng() * 4)
        : 6 + Math.floor(rng() * 5);
      const prefix = rng() > 0.65 ? "IC" : "U";
      ics.push({
        x,
        y,
        w,
        h,
        label: `${prefix}${counter++}`,
        pinSide,
        pinCount,
      });
    }
  }

  // Build traces. Most go IC↔IC; a strong fraction connect mother↔IC so
  // the centerpiece visually fans out into the rest of the board.
  const traces: Trace[] = [];
  const targetTraces = Math.min(22, Math.max(14, Math.floor(width / 80)));
  const motherTargetCount = Math.min(8, Math.max(5, Math.floor(ics.length * 0.7)));
  for (let i = 0; i < targetTraces + motherTargetCount; i++) {
    const linkMother = i < motherTargetCount;
    const a: MotherChip | IC = linkMother
      ? mother
      : ics[Math.floor(rng() * ics.length)];
    let b: IC | undefined = ics[Math.floor(rng() * ics.length)];
    let guard = 0;
    while (!linkMother && b !== undefined && b === a && guard++ < 8) {
      b = ics[Math.floor(rng() * ics.length)];
    }
    if (!a || !b) continue;
    if (!linkMother && b === a) continue;

    const start = pickEdgePoint(a, rng);
    const end = pickEdgePoint(b, rng);

    // Build a 2–6 bend axis-aligned path between start and end.
    const pts: Point[] = [start];
    let cur = { ...start };
    const bends = 2 + Math.floor(rng() * 5);
    let horiz = Math.abs(end.x - cur.x) > Math.abs(end.y - cur.y);
    for (let k = 0; k < bends; k++) {
      const remaining = bends - k;
      if (horiz) {
        const targetX =
          k === bends - 1
            ? end.x
            : cur.x + (end.x - cur.x) / remaining + (rng() - 0.5) * 40;
        cur = { x: snap(targetX) - 0.5, y: cur.y };
      } else {
        const targetY =
          k === bends - 1
            ? end.y
            : cur.y + (end.y - cur.y) / remaining + (rng() - 0.5) * 30;
        cur = { x: cur.x, y: snap(targetY) - 0.5 };
      }
      pts.push({ ...cur });
      horiz = !horiz;
    }
    // Final approach: align the missing axis then move to end.
    if (cur.x !== end.x) {
      pts.push({ x: end.x, y: cur.y });
    }
    if (cur.y !== end.y) {
      pts.push({ x: end.x, y: end.y });
    } else if (pts[pts.length - 1].x !== end.x || pts[pts.length - 1].y !== end.y) {
      pts.push({ x: end.x, y: end.y });
    }

    // Compute segment lengths.
    const segLens: number[] = [];
    let total = 0;
    for (let s = 1; s < pts.length; s++) {
      const dx = pts[s].x - pts[s - 1].x;
      const dy = pts[s].y - pts[s - 1].y;
      const len = Math.hypot(dx, dy);
      segLens.push(len);
      total += len;
    }
    if (total > 30) {
      traces.push({ pts, segLens, total });
    }
  }

  // Vias at trace junctions (sample bend points, dedup). Skip any that
  // would land inside the mother chip body so its face stays clean.
  const viaSet = new Map<string, Via>();
  for (const t of traces) {
    for (let i = 1; i < t.pts.length - 1; i++) {
      if (rng() < 0.55) {
        const p = t.pts[i];
        if (
          p.x >= mother.x &&
          p.x <= mother.x + mother.w &&
          p.y >= mother.y &&
          p.y <= mother.y + mother.h
        ) {
          continue;
        }
        const key = `${Math.round(p.x)}:${Math.round(p.y)}`;
        if (!viaSet.has(key)) {
          viaSet.set(key, { x: p.x, y: p.y, phase: rng() * Math.PI * 2 });
        }
      }
    }
  }
  const vias = Array.from(viaSet.values()).slice(0, 18);

  // Surface-mount components scattered on traces.
  const smds: SMD[] = [];
  const smdCount = 6 + Math.floor(rng() * 5);
  for (let i = 0; i < smdCount; i++) {
    const t = traces[Math.floor(rng() * traces.length)];
    if (!t) break;
    // pick a midpoint of a random straight segment
    const segIdx = Math.floor(rng() * (t.pts.length - 1));
    const p1 = t.pts[segIdx];
    const p2 = t.pts[segIdx + 1];
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const horizontal = Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y);
    const w = horizontal ? 8 : 4;
    const h = horizontal ? 4 : 8;
    const label =
      rng() > 0.55
        ? `${rng() > 0.5 ? "R" : "C"}${10 + Math.floor(rng() * 80)}`
        : undefined;
    smds.push({ x: mx - w / 2, y: my - h / 2, w, h, label });
  }

  // Corner labels.
  const cornerLabels: CornerLabel[] = [
    { x: 14, y: 18, text: "VCC", align: "start" },
    { x: width - 14, y: 18, text: "3V3", align: "end" },
    { x: 14, y: height - 12, text: "GND", align: "start" },
    { x: width - 14, y: height - 12, text: "TX/RX", align: "end" },
  ];

  return { traces, ics, vias, smds, cornerLabels, mother };
}

function pickEdgePoint(
  box: { x: number; y: number; w: number; h: number },
  rng: () => number,
): Point {
  const side = Math.floor(rng() * 4);
  if (side === 0) {
    return { x: snap(box.x + rng() * box.w) - 0.5, y: box.y };
  }
  if (side === 1) {
    return { x: box.x + box.w, y: snap(box.y + rng() * box.h) - 0.5 };
  }
  if (side === 2) {
    return { x: snap(box.x + rng() * box.w) - 0.5, y: box.y + box.h };
  }
  return { x: box.x, y: snap(box.y + rng() * box.h) - 0.5 };
}

// Walk along a trace polyline and return point at parameter t in [0,1].
function pointOnTrace(trace: Trace, t: number): Point {
  if (t <= 0) return trace.pts[0];
  if (t >= 1) return trace.pts[trace.pts.length - 1];
  const target = t * trace.total;
  let acc = 0;
  for (let i = 0; i < trace.segLens.length; i++) {
    if (acc + trace.segLens[i] >= target) {
      const local = (target - acc) / trace.segLens[i];
      const a = trace.pts[i];
      const b = trace.pts[i + 1];
      return { x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local };
    }
    acc += trace.segLens[i];
  }
  return trace.pts[trace.pts.length - 1];
}

function drawMotherChip(
  ctx: CanvasRenderingContext2D,
  m: MotherChip,
  palette: Palette,
) {
  // Solid neutral background — the main gray/black page color
  ctx.fillStyle = rgba(palette.bg, 1);
  ctx.fillRect(Math.round(m.x), Math.round(m.y), m.w, m.h);
  // Outer stroke
  ctx.strokeStyle = rgba(palette.primaryGlow, 1);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(
    Math.round(m.x) + 0.5,
    Math.round(m.y) + 0.5,
    m.w - 1,
    m.h - 1,
  );
  // Inset outline
  ctx.strokeStyle = rgba(palette.primary, 0.55);
  ctx.lineWidth = 1;
  ctx.strokeRect(
    Math.round(m.x) + 5.5,
    Math.round(m.y) + 5.5,
    m.w - 11,
    m.h - 11,
  );
  // Pin-1 notch dot
  ctx.fillStyle = rgba(palette.primaryGlow, 1);
  ctx.beginPath();
  ctx.arc(m.x + 9, m.y + 9, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Pins on all 4 sides
  ctx.strokeStyle = rgba(palette.primaryGlow, 0.9);
  ctx.lineWidth = 1;
  ctx.beginPath();
  const pinLen = Math.max(4, Math.round(Math.min(m.w, m.h) * 0.05));
  const stepX = m.w / (m.pinCount + 1);
  for (let p = 1; p <= m.pinCount; p++) {
    const px = Math.round(m.x + p * stepX) + 0.5;
    ctx.moveTo(px, m.y - pinLen);
    ctx.lineTo(px, m.y);
    ctx.moveTo(px, m.y + m.h);
    ctx.lineTo(px, m.y + m.h + pinLen);
  }
  const stepY = m.h / (m.pinCount + 1);
  for (let p = 1; p <= m.pinCount; p++) {
    const py = Math.round(m.y + p * stepY) + 0.5;
    ctx.moveTo(m.x - pinLen, py);
    ctx.lineTo(m.x, py);
    ctx.moveTo(m.x + m.w, py);
    ctx.lineTo(m.x + m.w + pinLen, py);
  }
  ctx.stroke();

  // Simnetiq logo inscribed in the chip (5 diagonal strokes from logo.tsx).
  const logoBoxW = Math.min(m.w, m.h) * 0.62;
  const logoBoxH = logoBoxW * (107 / 109);
  const logoX = m.x + (m.w - logoBoxW) / 2;
  const logoY = m.y + (m.h - logoBoxH) / 2;
  const scale = logoBoxW / 109;
  const logoLines: { x1: number; y1: number; x2: number; y2: number; accent: boolean }[] = [
    { x1: 53, y1: 5.65685, x2: 5.65685, y2: 53, accent: false },
    { x1: 92, y1: 43.6569, x2: 44.6569, y2: 91, accent: true },
    { x1: 105, y1: 55.6569, x2: 57.6569, y2: 103, accent: false },
    { x1: 66, y1: 18.6569, x2: 5.65685, y2: 79, accent: false },
    { x1: 79, y1: 30.6569, x2: 8.65685, y2: 101, accent: false },
  ];
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, 7 * scale);
  for (const ln of logoLines) {
    ctx.strokeStyle = ln.accent
      ? rgba(palette.primary, 1)
      : rgba(palette.text, 1);
    ctx.beginPath();
    ctx.moveTo(logoX + ln.x1 * scale, logoY + ln.y1 * scale);
    ctx.lineTo(logoX + ln.x2 * scale, logoY + ln.y2 * scale);
    ctx.stroke();
  }

  // Brand label below the chip — clearance scales with chip size so the
  // label doesn't crash into ICs sitting just outside the buffer.
  const labelOffset = Math.max(12, pinLen + 8);
  ctx.fillStyle = palette.textFaint;
  ctx.font = '9px ui-monospace, "JetBrains Mono", Menlo, monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("SIMNETIQ", m.x + m.w / 2, m.y + m.h + labelOffset);
}

function bakeStaticLayer(
  off: HTMLCanvasElement,
  layout: Layout,
  palette: Palette,
  width: number,
  height: number,
  dpr: number,
) {
  off.width = Math.floor(width * dpr);
  off.height = Math.floor(height * dpr);
  const ctx = off.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Grid
  ctx.strokeStyle = rgba(palette.primaryDim, 0.18);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = GRID; x < width; x += GRID) {
    const sx = Math.round(x) + 0.5;
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
  }
  for (let y = GRID; y < height; y += GRID) {
    const sy = Math.round(y) + 0.5;
    ctx.moveTo(0, sy);
    ctx.lineTo(width, sy);
  }
  ctx.stroke();

  // Traces with rounded corners
  ctx.strokeStyle = rgba(palette.primary, 0.45);
  ctx.lineWidth = 1;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const radius = 3;
  for (const t of layout.traces) {
    const pts = t.pts;
    if (pts.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      ctx.arcTo(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, radius);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }

  // SMD components
  for (const s of layout.smds) {
    ctx.fillStyle = rgba(palette.primaryDim, 0.55);
    ctx.fillRect(Math.round(s.x), Math.round(s.y), s.w, s.h);
    // pin lines
    ctx.strokeStyle = rgba(palette.primary, 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (s.w > s.h) {
      // horizontal SMD — pins extend horizontally
      ctx.moveTo(s.x - 2 + 0.5, s.y + s.h / 2);
      ctx.lineTo(s.x + 0.5, s.y + s.h / 2);
      ctx.moveTo(s.x + s.w + 0.5, s.y + s.h / 2);
      ctx.lineTo(s.x + s.w + 2 + 0.5, s.y + s.h / 2);
    } else {
      ctx.moveTo(s.x + s.w / 2, s.y - 2 + 0.5);
      ctx.lineTo(s.x + s.w / 2, s.y + 0.5);
      ctx.moveTo(s.x + s.w / 2, s.y + s.h + 0.5);
      ctx.lineTo(s.x + s.w / 2, s.y + s.h + 2 + 0.5);
    }
    ctx.stroke();
    if (s.label) {
      ctx.fillStyle = palette.textFaint;
      ctx.font = '8px ui-monospace, "JetBrains Mono", Menlo, monospace';
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(s.label, Math.round(s.x), Math.round(s.y - 3));
    }
  }

  // ICs (rect + faint fill + pins + label)
  for (const ic of layout.ics) {
    // fill
    ctx.fillStyle = rgba(palette.primaryDim, 0.08);
    ctx.fillRect(Math.round(ic.x), Math.round(ic.y), ic.w, ic.h);
    // stroke
    ctx.strokeStyle = rgba(palette.primaryGlow, 0.85);
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.round(ic.x) + 0.5,
      Math.round(ic.y) + 0.5,
      ic.w - 1,
      ic.h - 1,
    );
    // notch (small dot near top-left to denote pin 1)
    ctx.fillStyle = rgba(palette.primaryGlow, 0.9);
    ctx.beginPath();
    ctx.arc(ic.x + 4, ic.y + 4, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // pins
    ctx.strokeStyle = rgba(palette.primaryGlow, 0.7);
    ctx.beginPath();
    if (ic.pinSide === "v") {
      const step = ic.h / (ic.pinCount + 1);
      for (let p = 1; p <= ic.pinCount; p++) {
        const py = Math.round(ic.y + p * step) + 0.5;
        ctx.moveTo(ic.x - 4, py);
        ctx.lineTo(ic.x, py);
        ctx.moveTo(ic.x + ic.w, py);
        ctx.lineTo(ic.x + ic.w + 4, py);
      }
    } else {
      const step = ic.w / (ic.pinCount + 1);
      for (let p = 1; p <= ic.pinCount; p++) {
        const px = Math.round(ic.x + p * step) + 0.5;
        ctx.moveTo(px, ic.y - 4);
        ctx.lineTo(px, ic.y);
        ctx.moveTo(px, ic.y + ic.h);
        ctx.lineTo(px, ic.y + ic.h + 4);
      }
    }
    ctx.stroke();

    // label
    ctx.fillStyle = palette.textFaint;
    ctx.font = '9px ui-monospace, "JetBrains Mono", Menlo, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ic.label, ic.x + ic.w / 2, ic.y + ic.h / 2 + 0.5);
  }

  // Mother chip — the centered hero IC carrying the Simnetiq logo.
  drawMotherChip(ctx, layout.mother, palette);

  // Vias (filled circles) — base color, blink layer added on top per frame
  for (const v of layout.vias) {
    ctx.fillStyle = rgba(palette.primaryGlow, 0.6);
    ctx.beginPath();
    ctx.arc(v.x, v.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Corner labels
  ctx.fillStyle = palette.textFaint;
  ctx.font = '9px ui-monospace, "JetBrains Mono", Menlo, monospace';
  ctx.textBaseline = "alphabetic";
  for (const l of layout.cornerLabels) {
    ctx.textAlign = l.align;
    ctx.fillText(l.text, l.x, l.y);
  }
}

export function HeroCircuit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let palette = readPalette();
    let layout: Layout = {
      traces: [],
      ics: [],
      vias: [],
      smds: [],
      cornerLabels: [],
      mother: { x: 0, y: 0, w: 0, h: 0, pinCount: 0 },
    };

    const offscreen = document.createElement("canvas");

    const pulses: Pulse[] = [];

    let sweepActive = false;
    let sweepStart = 0;
    let nextSweepAt = 0;

    function spawnPulse(): Pulse {
      const trace = layout.traces.length
        ? Math.floor(Math.random() * layout.traces.length)
        : 0;
      return {
        trace,
        t: 0,
        speed: 0.10 + Math.random() * 0.15,
        delay: 0,
      };
    }

    function rebake() {
      if (!canvas || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rng = makeRng(0x51a3 ^ Math.floor(width) * 73856093);
      layout = buildLayout(width, height, rng);
      bakeStaticLayer(offscreen, layout, palette, width, height, dpr);

      // Initialize pulses if needed.
      const target = Math.min(10, Math.max(6, Math.floor(layout.traces.length / 2)));
      while (pulses.length < target) {
        const p = spawnPulse();
        p.t = Math.random();
        pulses.push(p);
      }
      while (pulses.length > target) pulses.pop();

      nextSweepAt = performance.now() / 1000 + 7 + Math.random() * 3;
    }

    rebake();

    // Resize handling — debounce re-bake for smooth dragging.
    let resizeTimer: number | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        rebake();
        resizeTimer = null;
      }, 80);
    });
    ro.observe(wrap);

    // Theme reactivity — re-read palette + re-bake on data-theme change.
    const themeObs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "data-theme") {
          palette = readPalette();
          bakeStaticLayer(offscreen, layout, palette, width, height, dpr);
          break;
        }
      }
    });
    themeObs.observe(document.documentElement, { attributes: true });

    let raf = 0;
    let last = performance.now();

    function frame(now: number) {
      if (!ctx) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const tSec = now / 1000;

      ctx.clearRect(0, 0, width, height);

      ctx.drawImage(
        offscreen,
        0,
        0,
        offscreen.width,
        offscreen.height,
        0,
        0,
        width,
        height,
      );

      // Via blinks
      for (const v of layout.vias) {
        const brightness = 0.4 + 0.6 * (Math.sin(tSec * 1.3 + v.phase) * 0.5 + 0.5);
        ctx.fillStyle = rgba(palette.secondary, brightness * 0.55);
        ctx.beginPath();
        ctx.arc(v.x, v.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Travelling pulses
      for (const p of pulses) {
        if (p.delay > 0) {
          p.delay -= dt;
          if (p.delay <= 0) {
            const fresh = spawnPulse();
            p.trace = fresh.trace;
            p.t = 0;
            p.speed = fresh.speed;
            p.delay = 0;
          }
          continue;
        }
        const trace = layout.traces[p.trace];
        if (!trace) {
          p.delay = 0.5 + Math.random();
          continue;
        }
        p.t += p.speed * dt;
        if (p.t >= 1) {
          p.delay = 0.4 + Math.random() * 0.8;
          continue;
        }
        const head = pointOnTrace(trace, p.t);

        ctx.fillStyle = rgba(palette.secondary, 0.95);
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(palette.secondary, 0.25);
        ctx.beginPath();
        ctx.arc(head.x, head.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Re-paint the mother chip on top so pulses pass behind it.
      drawMotherChip(ctx, layout.mother, palette);

      // Diagnostic sweep
      if (!sweepActive && tSec >= nextSweepAt) {
        sweepActive = true;
        sweepStart = tSec;
      }
      if (sweepActive) {
        const elapsed = tSec - sweepStart;
        const dur = 1.2;
        if (elapsed >= dur) {
          sweepActive = false;
          nextSweepAt = tSec + 7 + Math.random() * 3;
        } else {
          const y = (elapsed / dur) * (height + 6) - 3;
          ctx.fillStyle = rgba(palette.secondary, 0.06);
          ctx.fillRect(0, y, width, 3);
        }
      }

      raf = requestAnimationFrame(frame);
    }

    if (reduce) {
      // Freeze a couple of pulses mid-trace and render one frame.
      for (let i = 0; i < pulses.length; i++) pulses[i].t = 0.2 + (i * 0.37) % 0.6;
      frame(performance.now());
      // Don't continue the RAF loop.
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObs.disconnect();
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
