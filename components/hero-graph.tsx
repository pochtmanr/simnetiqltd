"use client";

import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;

type Particle = {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  accent: boolean;
};

// The five strokes mirror components/logo.tsx, including its blue accent stroke.
const LOGO_STROKES = [
  [53, 5.65685, 5.65685, 53, false],
  [92, 43.6569, 44.6569, 91, true],
  [105, 55.6569, 57.6569, 103, false],
  [66, 18.6569, 5.65685, 79, false],
  [79, 30.6569, 8.65685, 101, false],
] as const;

/** Rounded 3D strokes give the logo the original sculpture's beaded surface. */
function buildSculpture(longitudes: number, latitudes: number): Particle[] {
  const particles: Particle[] = [];
  for (const [x1, y1, x2, y2, accent] of LOGO_STROKES) {
    const length = Math.hypot(x2 - x1, y2 - y1);
    const tx = (x2 - x1) / length;
    const ty = (y2 - y1) / length;
    const rows = Math.round(longitudes * (length + 8) / 240);
    for (let i = 0; i < rows; i++) {
      const along = -4 + ((i + 0.5) / rows) * (length + 8);
      const cap = along < 0 ? along : along > length ? along - length : 0;
      const radius = Math.sqrt(Math.max(0, 16 - cap * cap));
      // Inset the end rings and follow their circumference to avoid isolated tip dots.
      const columns = Math.max(3, Math.round(latitudes * radius / 4));
      for (let j = 0; j < columns; j++) {
        const angle = ((j + (i % 2) * 0.5) / columns) * TAU;
        const across = Math.cos(angle);
        const depth = Math.sin(angle);
        particles.push({
          x: (x1 + tx * along - ty * radius * across - 55) / 58,
          y: (y1 + ty * along + tx * radius * across - 54) / 58,
          z: radius * depth / 58,
          nx: (tx * cap - ty * radius * across) / 4,
          ny: (ty * cap + tx * radius * across) / 4,
          nz: radius * depth / 4,
          accent,
        });
      }
    }
  }
  return particles;
}

export function HeroGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      canvas.classList.add("hero-field__fallback");
      return;
    }
    const ctx = context;
    const hero = canvas.closest(".hero-field");
    const narrow = window.matchMedia("(max-width: 767px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const particles = buildSculpture(64, 8);
    const projected = particles.map(() => ({ x: 0, y: 0, z: 0, radius: 0, alpha: 0, accent: false }));
    let ink = getComputedStyle(canvas).getPropertyValue("--color-text").trim();
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = false;
    let running = false;
    let elapsed = 0;
    let previous = 0;
    let pointerX = 0;
    let pointerY = 0;
    let tiltX = 0;
    let tiltY = 0;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      if (narrow.matches || width < 2 || height < 2) return;
      const time = reduced.matches ? 0 : elapsed;
      const easing = 0.045;
      tiltX += ((reduced.matches ? 0 : pointerX) - tiltX) * easing;
      tiltY += ((reduced.matches ? 0 : pointerY) - tiltY) * easing;
      // Gentle rocking reveals the rounded strokes while keeping the logo readable.
      const rx = 0.12 + Math.sin(time * 0.18) * 0.16 + tiltY * 0.13;
      const ry = -0.18 + Math.sin(time * 0.14) * 0.24 + tiltX * 0.2;
      const rz = Math.sin(time * 0.12) * 0.035;
      const cx = Math.cos(rx);
      const sx = Math.sin(rx);
      const cy = Math.cos(ry);
      const sy = Math.sin(ry);
      const cz = Math.cos(rz);
      const sz = Math.sin(rz);
      const scale = Math.min(width, height) * 0.43;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const y1 = p.y * cx - p.z * sx;
        const z1 = p.y * sx + p.z * cx;
        const x2 = p.x * cy + z1 * sy;
        const z2 = -p.x * sy + z1 * cy;
        const x3 = x2 * cz - y1 * sz;
        const y3 = x2 * sz + y1 * cz;
        const perspective = 3.6 / (3.6 - z2);
        const normalY1 = p.ny * cx - p.nz * sx;
        const normalZ1 = p.ny * sx + p.nz * cx;
        const normalX2 = p.nx * cy + normalZ1 * sy;
        const normalZ = -p.nx * sy + normalZ1 * cy;
        const normalX = normalX2 * cz - normalY1 * sz;
        const normalY = normalX2 * sz + normalY1 * cz;
        const lighting = Math.max(0, -normalX * 0.4 - normalY * 0.55 + normalZ * 0.73);
        const depth = Math.min(1, Math.max(0, (z2 + 1) / 2));
        const point = projected[i];
        point.x = width * 0.5 + x3 * scale * perspective;
        point.y = height * 0.5 + y3 * scale * perspective;
        point.z = z2;
        // Use the service globe’s 4.5–6px dots, independent of the logo bounds.
        point.radius = (0.65 + (z2 + 1) * 0.12) * (480 / 140);
        // Keep the reverse surface visible, with softer dots behind the front face.
        point.alpha = normalZ < -0.12
          ? 0.18 + depth * 0.16
          : 0.32 + lighting * 0.48 + depth * 0.2;
        point.accent = p.accent;
      }

      // Sort references separately so every particle keeps its scratch-buffer slot.
      const ordered = drawOrder;
      ordered.sort((a, b) => projected[a].z - projected[b].z);
      for (const index of ordered) {
        const p = projected[index];
        if (p.alpha === 0) continue;
        ctx.fillStyle = p.accent ? "#5473A1" : ink;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const drawOrder = particles.map((_, index) => index);

    function resize() {
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.max(1, Math.round(width * dpr));
      canvas!.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function tick(now: number) {
      if (narrow.matches || reduced.matches || document.hidden || !visible) {
        syncPlayback();
        draw();
        return;
      }
      elapsed += Math.min((now - previous) / 1000, 0.05);
      previous = now;
      draw();
      frame = requestAnimationFrame(tick);
    }

    function syncPlayback() {
      const shouldRun = visible && !narrow.matches && !document.hidden && !reduced.matches;
      if (shouldRun === running) return;
      running = shouldRun;
      if (running) {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(frame);
      }
    }

    function onPointer(event: Event) {
      if (reduced.matches || !(event instanceof PointerEvent) || event.pointerType === "touch") return;
      const rect = hero!.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width * 2 - 1;
      pointerY = (event.clientY - rect.top) / rect.height * 2 - 1;
    }

    function resetPointer() {
      pointerX = 0;
      pointerY = 0;
    }

    function onReducedChange() {
      tiltX = 0;
      tiltY = 0;
      syncPlayback();
      draw();
    }

    function onNarrowChange() {
      resetPointer();
      syncPlayback();
      resize();
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    });
    intersectionObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      ink = getComputedStyle(canvas).getPropertyValue("--color-text").trim();
      draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    hero?.addEventListener("pointermove", onPointer, { passive: true });
    hero?.addEventListener("pointerleave", resetPointer);
    document.addEventListener("visibilitychange", syncPlayback);
    window.addEventListener("blur", resetPointer);
    reduced.addEventListener("change", onReducedChange);
    narrow.addEventListener("change", onNarrowChange);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      hero?.removeEventListener("pointermove", onPointer);
      hero?.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", syncPlayback);
      window.removeEventListener("blur", resetPointer);
      reduced.removeEventListener("change", onReducedChange);
      narrow.removeEventListener("change", onNarrowChange);
    };
  }, []);

  return (
    <div className="hero-field__visual" aria-hidden="true">
      <canvas ref={canvasRef} className="hero-field__canvas" />
    </div>
  );
}
