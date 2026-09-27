"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useInView } from "motion/react";
import styles from "./service-figure-motion.module.css";

type Point = { x: number; y: number; z: number };

export function ServiceFigureMotion({ children, className, variant, points }: {
  children: ReactNode;
  className?: string;
  variant: string;
  points: Point[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elapsed = useRef(0);
  const visible = useInView(ref);

  useEffect(() => {
    const host = ref.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !visible) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = 0;
    let color = getComputedStyle(host).color;
    const projected = points.map(() => ({ x: 0, y: 0, z: 0, light: 1 }));
    const ordered = [...projected];
    const geometry = points.map((point) => ({
      longitude: Math.atan2(point.z, point.x),
      radius: Math.hypot(point.x, point.y, point.z),
    }));
    const speed = variant === "web" ? 0.22 : variant === "mobile" ? -0.17 : 0.19;

    const draw = () => {
      const time = elapsed.current;
      const angle = time * speed;
      // Distinct scan, breathing and shaping rhythms inspired by libraries.dev/orbs.
      // Keep our original point clouds and responsive canvas resolution.
      const morph = (1 - Math.cos(time * 0.48)) * 0.5;
      const tilt = Math.sin(elapsed.current * 0.45) * 0.13;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const tiltCos = Math.cos(tilt);
      const tiltSin = Math.sin(tilt);
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const { longitude, radius } = geometry[i];
        let scale = 1;
        let lift = 0;
        let light = 1;
        if (variant === "web") {
          const scan = Math.pow((1 + Math.cos(longitude - time * 0.8)) / 2, 12);
          scale += 0.025 * Math.sin(point.y * 5 - time * 1.1);
          light = 0.65 + scan * 0.65;
        } else if (variant === "mobile") {
          const wave = longitude * 3 + time * 0.85;
          scale += 0.055 * Math.sin(wave);
          lift = 0.055 * Math.cos(wave);
        } else {
          // Round the facets into an orb, then let the original form return.
          scale += (0.96 / radius - 1) * morph * 0.85;
        }
        const x = point.x * scale;
        const y = point.y * scale + lift;
        const z = point.z * scale * cos - x * sin;
        projected[i].x = x * cos + point.z * scale * sin;
        projected[i].y = y * tiltCos - z * tiltSin;
        projected[i].z = y * tiltSin + z * tiltCos;
        projected[i].light = light;
      }
      context.clearRect(0, 0, 140, 100);
      context.fillStyle = color;
      // Render the farther particles first to preserve dimensional depth.
      ordered.sort((a, b) => a.z - b.z);
      for (const point of ordered) {
        context.globalAlpha = Math.min(1, Math.max(0.15, (0.25 + (point.z + 1) * 0.32) * point.light));
        context.beginPath();
        context.arc(70 + point.x * 42, 50 + point.y * 42, 0.65 + (point.z + 1) * 0.12, 0, Math.PI * 2);
        context.fill();
      }
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(host.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(host.clientHeight * ratio));
      context.setTransform(canvas.width / 140, 0, 0, canvas.height / 100, 0, 0);
      draw();
    };
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - previous < 1000 / 30) return;
      elapsed.current += previous ? Math.min((now - previous) / 1000, 0.1) : 0;
      previous = now;
      draw();
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (reducedMotion.matches) {
        delete host.dataset.animated;
      } else {
        host.dataset.animated = "true";
        if (!document.hidden) frame = requestAnimationFrame(tick);
      }
    };
    const updateColor = () => {
      color = getComputedStyle(host).color;
      draw();
    };
    const themeObserver = new MutationObserver(updateColor);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    reducedMotion.addEventListener("change", onVisibility);
    document.addEventListener("transitionend", updateColor);
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      reducedMotion.removeEventListener("change", onVisibility);
      document.removeEventListener("transitionend", updateColor);
      document.removeEventListener("visibilitychange", onVisibility);
      delete host.dataset.animated;
    };
  }, [points, variant, visible]);

  return (
    <div ref={ref} className={`${styles.figure} ${className ?? ""}`} aria-hidden="true">
      {children}
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
