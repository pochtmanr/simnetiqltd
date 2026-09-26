"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Marks the stretch of the homepage hero the navigation may float over.
 *
 * Its mere presence in the DOM is what the `:has()` rule in globals.css keys
 * off, so the transparent state is already correct in the server-rendered
 * HTML — no hydration flash, and it disarms by itself on route change because
 * this component unmounts.
 *
 * The element spans hero-top to the seam rather than the hero's full height:
 * that way the bar turns solid the moment the photograph would reach it,
 * instead of leaving white glyphs sitting on the bright sky.
 */
export function HeroNavSentinel() {
  const ref = useRef<HTMLDivElement>(null);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setPassed(!entry.isIntersecting),
      // Pull the root down by the 4rem header so the flip lands exactly when
      // the seam meets the bottom of the bar.
      { rootMargin: "-64px 0px 0px 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id="hero-nav-sentinel"
      data-passed={passed ? "" : undefined}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
    />
  );
}
