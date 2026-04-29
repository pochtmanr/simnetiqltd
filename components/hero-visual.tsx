"use client";

import { useEffect, useRef } from "react";

/**
 * Fluid wave field with slow breathing pulse + pointer-reactive drift.
 * Canvas 2D to avoid ThreeJS dependency; DPR clamp; prefers-reduced-motion honored.
 */
export function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    function resize() {
      if (!canvas || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onPointer(e: PointerEvent) {
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      pointer.tx = (e.clientX - rect.left) / rect.width;
      pointer.ty = (e.clientY - rect.top) / rect.height;
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.addEventListener("pointermove", onPointer, { passive: true });

    let raf = 0;
    const start = performance.now();

    function frame(now: number) {
      if (!ctx) return;
      const t = (now - start) / 1000;

      // Ease pointer
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Soft rust halo at center — fades to fully transparent at edges so the
      // canvas blends into whatever bg the page is using (light or dark).
      const bg = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7,
      );
      bg.addColorStop(0, "rgba(178, 69, 30, 0.08)");
      bg.addColorStop(0.6, "rgba(178, 69, 30, 0.02)");
      bg.addColorStop(1, "rgba(178, 69, 30, 0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Breathing pulse amplitude
      const breathe = (Math.sin(t * 0.35) + 1) / 2; // 0..1, slow
      const amp = 0.65 + breathe * 0.35;

      // Wave field — stacked sine layers tinted with rust/peach
      const lineCount = 26;
      const step = height / (lineCount + 2);
      const parallaxX = (pointer.x - 0.5) * (reduce ? 0 : 40);
      const parallaxY = (pointer.y - 0.5) * (reduce ? 0 : 20);

      for (let i = 0; i < lineCount; i++) {
        const y0 = step * (i + 1) + parallaxY * (i / lineCount - 0.5);
        const phase = t * 0.3 + i * 0.18;
        const localAmp = (14 + Math.sin(t * 0.4 + i) * 6) * amp;

        // Tint ramp: deep rust at the edges, pale peach through the middle, a cold neutral line at center.
        const normalized = i / (lineCount - 1); // 0..1 top→bottom
        const mid = Math.abs(normalized - 0.5) * 2; // 0 at center, 1 at edges
        const alpha = reduce ? 0.22 : 0.18 + (1 - mid) * 0.25;
        let stroke: string;
        if (mid < 0.18) {
          stroke = `rgba(255, 179, 138, ${alpha})`; // peach center
        } else if (mid < 0.55) {
          stroke = `rgba(200, 121, 93, ${alpha * 0.9})`; // warm rust
        } else {
          stroke = `rgba(125, 48, 21, ${alpha * 0.7})`; // deep rust edges
        }

        ctx.beginPath();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        const segments = 96;
        for (let s = 0; s <= segments; s++) {
          const x = (s / segments) * (width + 80) - 40 + parallaxX * (normalized - 0.5);
          const k = s / segments;
          const wave =
            Math.sin(phase + k * 5.2) * localAmp +
            Math.sin(phase * 0.6 + k * 2.1 + i * 0.5) * localAmp * 0.4;
          const y = y0 + wave;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Centerline marker — thin bright horizon
      ctx.strokeStyle = "rgba(255, 179, 138, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2 + parallaxY);
      ctx.lineTo(width, height / 2 + parallaxY);
      ctx.stroke();

      // Pulse dot on horizon
      const pulseR = 2.5 + breathe * 3.5;
      ctx.beginPath();
      ctx.arc(width * 0.5 + parallaxX * 0.4, height / 2 + parallaxY, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 179, 138, ${0.6 - breathe * 0.2})`;
      ctx.fill();

      if (!reduce) raf = requestAnimationFrame(frame);
    }

    if (reduce) {
      frame(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
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
