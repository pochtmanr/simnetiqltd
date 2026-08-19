"use client";

import { useEffect, useRef } from "react";

/**
 * Hero background: an Obsidian-style knowledge graph.
 *
 * Clustered nodes joined by links, drawn as ONE CENTRED FIGURE — a medallion
 * roughly the width of the copy column — rather than a full-bleed field. The
 * centre is kept as a clearing so the display type reads against the page
 * ground instead of against the graph.
 *
 * 2D canvas rather than WebGL: an Obsidian graph is ~200 discs and ~250 hairlines
 * with per-element radius and alpha, which canvas draws crisply for free and a
 * point-sprite shader has to fake. Budget guards are unchanged — DPR clamped to
 * 2, density scaled down on small viewports, rendering paused while off-screen
 * or the tab is hidden, and a single static frame under `prefers-reduced-motion`.
 *
 * Palette is monochrome + the brand orange (--color-primary family), per theme.
 */

const TAU = Math.PI * 2;

type Node = {
  x: number; // layout position in graph units, roughly -1.2…1.2
  y: number;
  r: number; // radius in graph units
  z: number; // 0 far … 1 near — drives parallax, size and alpha
  hub: boolean; // orange: a hub, or one of the scattered accent notes
  glow: boolean; // only the true hubs carry a halo

  phase: number;
  wobble: number;
};

type Edge = { a: number; b: number; hub: boolean };

/**
 * Ink and paper, both themes: white on the dark ground, near-black on the
 * light one. Hierarchy is carried by size and brightness alone — no hue.
 */
const THEMES = {
  dark: {
    node: [225, 225, 228] as const,
    hub: [255, 255, 255] as const,
    link: [255, 255, 255] as const,
    hubLink: [255, 255, 255] as const,
    nodeAlpha: 0.92,
    linkAlpha: 0.2,
    hubLinkAlpha: 0.34,
    glow: 0.22,
  },
  light: {
    node: [32, 32, 36] as const,
    hub: [10, 10, 11] as const,
    link: [10, 10, 11] as const,
    hubLink: [10, 10, 11] as const,
    nodeAlpha: 0.82,
    linkAlpha: 0.16,
    hubLinkAlpha: 0.3,
    glow: 0,
  },
};

/** Deterministic layout: the same graph every load, on every machine. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * Hubs on a wide ellipse, satellites scattered around each, a ring joining
 * neighbouring hubs and sparse near-neighbour links between satellites. No
 * chords across the middle — those would cut straight through the headline.
 */
function buildGraph(dense: boolean) {
  const rand = mulberry32(0x51b7);
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const push = (n: Node) => nodes.push(n) - 1;

  const hubCount = dense ? 9 : 6;
  const hubIdx: number[] = [];

  /*
   * Hubs on a wide ellipse, but nothing about them is uniform: each one gets
   * its own orbit radius, its own angular nudge and its own weight, and the
   * weight then decides how big its cluster grows. A vault has a couple of
   * huge notes and a lot of small ones; an even ring would read as wallpaper.
   */
  const weights: number[] = [];
  for (let i = 0; i < hubCount; i++) {
    const a = (i / hubCount) * TAU + (rand() - 0.5) * 0.42 - 0.35;
    const rad = 0.5 + rand() * 0.34;
    const weight = rand();
    weights.push(weight);
    hubIdx.push(
      push({
        x: Math.cos(a) * rad * 1.5,
        y: Math.sin(a) * rad * 0.82,
        r: 0.009 + weight * 0.013,
        z: 0.55 + rand() * 0.45,
        hub: true,
        glow: true,
        phase: rand() * TAU,
        wobble: 0.007 + rand() * 0.009,
      })
    );
  }

  // Two tiers under each hub — satellites, and leaves hanging off those. The
  // second tier is what gives a vault its bushy, uneven silhouette.
  hubIdx.forEach((h, hi) => {
    const w = weights[hi];
    const count = (dense ? 6 : 4) + Math.floor(w * w * (dense ? 17 : 9));
    const spread = 0.16 + w * 0.2;
    for (let k = 0; k < count; k++) {
      const a = rand() * TAU;
      const d = spread * (0.35 + rand() * rand() * 1.5);
      const sat = push({
        x: nodes[h].x + Math.cos(a) * d * 1.5,
        y: nodes[h].y + Math.sin(a) * d * 0.86,
        r: 0.004 + rand() * rand() * 0.012,
        z: 0.2 + rand() * 0.8,
        // A scattering of satellites read as minor hubs: brighter, no halo.
        hub: rand() < 0.11,
        glow: false,
        phase: rand() * TAU,
        wobble: 0.005 + rand() * 0.012,
      });
      edges.push({ a: h, b: sat, hub: true });

      const leaves = Math.floor(rand() * rand() * 5);
      for (let l = 0; l < leaves; l++) {
        const la = a + (rand() - 0.5) * 2.4;
        const ld = 0.04 + rand() * 0.12;
        edges.push({
          a: sat,
          b: push({
            x: nodes[sat].x + Math.cos(la) * ld * 1.5,
            y: nodes[sat].y + Math.sin(la) * ld * 0.86,
            r: 0.003 + rand() * 0.0035,
            z: 0.12 + rand() * 0.6,
            hub: false,
            glow: false,
            phase: rand() * TAU,
            wobble: 0.007 + rand() * 0.015,
          }),
          hub: false,
        });
      }
    }
  });

  const clustered = nodes.length;

  // Strays — scattered small notes, each still tethered to the nearest thing
  // in the vault. Nothing floats free: the whole graph is one component.
  const strays = dense ? 24 : 13;
  for (let i = 0; i < strays; i++) {
    const a = rand() * TAU;
    const rad = 0.34 + rand() * rand() * 0.72;
    const stray = push({
      x: Math.cos(a) * rad * 1.55,
      y: Math.sin(a) * rad * 0.9,
      r: 0.0028 + rand() * 0.004,
      z: 0.1 + rand() * 0.7,
      hub: rand() < 0.08,
      glow: false,
      phase: rand() * TAU,
      wobble: 0.008 + rand() * 0.016,
    });
    let near = 0;
    let nearD = Infinity;
    for (let j = 0; j < clustered; j++) {
      const d = Math.hypot(nodes[stray].x - nodes[j].x, nodes[stray].y - nodes[j].y);
      if (d < nearD) {
        nearD = d;
        near = j;
      }
    }
    edges.push({ a: stray, b: near, hub: false });
  }

  /*
   * Hub mesh. The ring joins neighbours; the chords join each hub to the one
   * OPPOSITE it and to a second-nearest, so the graph is spanned rather than
   * merely fenced. These cross the middle, and are meant to — the copy sits on
   * a scrim, so links passing beneath it read as depth.
   */
  const half = Math.floor(hubCount / 2);
  for (let i = 0; i < hubCount; i++) {
    edges.push({ a: hubIdx[i], b: hubIdx[(i + 1) % hubCount], hub: true });
    edges.push({ a: hubIdx[i], b: hubIdx[(i + half) % hubCount], hub: true });
    if (rand() < 0.55) {
      edges.push({ a: hubIdx[i], b: hubIdx[(i + 2) % hubCount], hub: true });
    }
  }

  // Cross-links between whatever happens to be adjacent: what makes it read as
  // a graph rather than a set of stars.
  const first = hubCount;
  for (let i = first; i < clustered; i++) {
    if (rand() > 0.46) continue;
    let best = -1;
    let bestD = 0.2;
    for (let j = first; j < clustered; j++) {
      if (j === i) continue;
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    if (best >= 0) edges.push({ a: i, b: best, hub: false });
  }

  // Long-range links right across the figure, including straight through the
  // middle: opposite sides of the vault have to be visibly related.
  for (let i = 0; i < (dense ? 16 : 9); i++) {
    const a = first + Math.floor(rand() * (clustered - first));
    const b = first + Math.floor(rand() * (clustered - first));
    if (Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y) < 1) continue;
    edges.push({ a, b, hub: false });
  }

  // Nothing sits dead centre: the headline lives there. The guard is a wide
  // lens rather than a circle, because the copy block is wide and short.
  for (const n of nodes) {
    const d = Math.hypot(n.x / 1.55, n.y / 0.78);
    if (d < 0.3 && d > 0.0001) {
      const k = 0.3 / d;
      n.x *= k;
      n.y *= k;
    }
  }

  return { nodes, edges };
}

export function HeroGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      // DOM fallback: a static centred dot cluster, so the figure still reads
      // as a figure when canvas is unavailable or blocked. Swapped by class
      // rather than by state — there is nothing here for React to re-render.
      canvas.classList.add("hero-field__fallback");
      return;
    }

    const narrow = window.matchMedia("(max-width: 767px)").matches;
    const { nodes, edges } = buildGraph(!narrow);

    // The site resolves "system" and always writes a concrete value, so
    // reading data-theme is enough — no matchMedia needed here.
    const readTheme = () =>
      document.documentElement.getAttribute("data-theme") === "light"
        ? THEMES.light
        : THEMES.dark;
    let theme = readTheme();

    let dpr = 1;
    let w = 0;
    let h = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      const pw = Math.max(1, Math.round(w * dpr));
      const ph = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (!running) draw(0);
    });
    ro.observe(canvas);

    /*
     * The pointer PUSHES nodes away from itself, locally: the cursor parts the
     * graph like a hand through water, and the field settles back when it
     * leaves. It is not a parallax — the field never moves as one body.
     *
     * Tracked on the window because the canvas is pointer-events:none: it must
     * never eat clicks meant for the CTAs.
     */
    const REPEL_RADIUS = 240; // px of influence around the cursor
    const REPEL_PUSH = 92; // px of displacement at the cursor itself
    let ptrX = 0;
    let ptrY = 0;
    let clientX = -1e4;
    let clientY = -1e4;
    let ptrAim = 0; // 1 while the cursor is over the hero, 0 once it leaves
    let ptrLive = 0; // eased follower, so entering and leaving are not a jump
    // Scrolling moves the canvas under a stationary cursor, so the canvas-local
    // position is recomputed from the last client coordinates, not cached.
    const syncPointer = () => {
      const rect = canvas.getBoundingClientRect();
      ptrX = clientX - rect.left;
      ptrY = clientY - rect.top;
      ptrAim =
        ptrX >= 0 && ptrY >= 0 && ptrX <= rect.width && ptrY <= rect.height
          ? 1
          : 0;
    };
    const onPointer = (e: PointerEvent) => {
      clientX = e.clientX;
      clientY = e.clientY;
      syncPointer();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", syncPointer, { passive: true });
    const onPointerOut = () => {
      ptrAim = 0;
    };
    window.addEventListener("pointerleave", onPointerOut, { passive: true });
    window.addEventListener("blur", onPointerOut);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Scratch buffers, reused every frame so the loop allocates nothing.
    const px = new Float32Array(nodes.length);
    const py = new Float32Array(nodes.length);
    const pa = new Float32Array(nodes.length);
    // Displacement under the cursor, eased per node so the graph springs back
    // rather than snapping.
    const ox = new Float32Array(nodes.length);
    const oy = new Float32Array(nodes.length);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      if (w < 2 || h < 2) return;

      ptrLive += (ptrAim - ptrLive) * 0.08;

      // Bounded on purpose: a wide centred figure, held clear of the viewport
      // edges rather than bled to them.
      const R = Math.min(w * 0.33, h * 0.62, 500);
      const cx = w / 2;
      const cy = h / 2;

      // Breathing pulse + a drift small enough to read as float, not spin.
      const breathe = 1 + 0.014 * Math.sin(t * 0.22);
      const rot = 0.05 * Math.sin(t * 0.07);
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const x = n.x + Math.sin(t * 0.33 + n.phase) * n.wobble;
        const y = n.y + Math.cos(t * 0.27 + n.phase * 1.3) * n.wobble;

        const rx = (x * cosR - y * sinR) * breathe;
        const ry = (x * sinR + y * cosR) * breathe;

        const bx = cx + rx * R;
        const by = cy - ry * R;

        // Cursor repulsion, eased. Near nodes move most; the falloff is
        // quadratic so the edge of the influence disc is invisible.
        let tx = 0;
        let ty = 0;
        if (ptrLive > 0.002) {
          const dx = bx - ptrX;
          const dy = by - ptrY;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < REPEL_RADIUS) {
            const f = 1 - dist / REPEL_RADIUS;
            const push = f * f * REPEL_PUSH * ptrLive * (0.55 + 0.6 * n.z);
            tx = (dx / dist) * push;
            ty = (dy / dist) * push;
          }
        }
        ox[i] += (tx - ox[i]) * 0.12;
        oy[i] += (ty - oy[i]) * 0.12;

        px[i] = bx + ox[i];
        py[i] = by + oy[i];

        // Elliptical falloff, matching the layout: soft at the rim, cleared
        // through the middle where the headline sits.
        const dRim = Math.hypot(rx / 1.42, ry / 0.98);
        const dCore = Math.hypot(rx / 1.55, ry / 0.78);
        const rim = 1 - smoothstep(0.86, 1.2, dRim);
        const clearing = smoothstep(0.28, 0.72, dCore);
        const wave = 0.86 + 0.14 * Math.sin(t * 0.6 - dRim * 2.6);
        pa[i] = rim * (0.1 + 0.9 * clearing) * (0.35 + 0.65 * n.z) * wave;
      }

      // Links under nodes, so the discs always read as the terminals.
      ctx.lineCap = "round";
      for (const e of edges) {
        const a = pa[e.a] * pa[e.b];
        if (a < 0.004) continue;
        const c = e.hub ? theme.hubLink : theme.link;
        const alpha = a * (e.hub ? theme.hubLinkAlpha : theme.linkAlpha);
        ctx.strokeStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
        ctx.lineWidth = e.hub ? 1.1 : 0.75;
        ctx.beginPath();
        ctx.moveTo(px[e.a], py[e.a]);
        ctx.lineTo(px[e.b], py[e.b]);
        ctx.stroke();
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const a = pa[i] * theme.nodeAlpha;
        if (a < 0.01) continue;
        const rad = n.r * R * (0.6 + 0.7 * n.z) * breathe;
        const c = n.hub ? theme.hub : theme.node;

        /*
         * Hub halo. Composited ADDITIVELY on dark: a source-over gradient over
         * a near-black ground reads as a grey-black disc around the dot, which
         * is the opposite of a glow. `lighter` can only ever brighten.
         * Light theme gets none — a halo on paper is just a smudge.
         */
        if (n.glow && theme.glow > 0) {
          const g = ctx.createRadialGradient(px[i], py[i], rad, px[i], py[i], rad * 6);
          g.addColorStop(0, `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a * theme.glow})`);
          g.addColorStop(0.45, `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a * theme.glow * 0.22})`);
          g.addColorStop(1, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0)`);
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px[i], py[i], rad * 6, 0, TAU);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }

        ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
        ctx.beginPath();
        ctx.arc(px[i], py[i], rad, 0, TAU);
        ctx.fill();
      }
    };

    let raf = 0;
    let running = false;
    const start = performance.now();

    const loop = () => {
      draw((performance.now() - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (running || reduced.matches) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Reduced motion still gets the graph — just held still, per the spec's
    // "minimal motion" level rather than no visual at all.
    draw(0);
    if (!reduced.matches) play();

    // The theme toggle rewrites data-theme on <html>; repaint on that.
    const themeObserver = new MutationObserver(() => {
      theme = readTheme();
      if (!running) draw(0);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? play() : pause()),
      { threshold: 0 }
    );
    io.observe(canvas);

    const onVisibility = () =>
      document.hidden ? pause() : io.takeRecords().length || play();
    document.addEventListener("visibilitychange", onVisibility);

    const onReducedChange = () => {
      pause();
      draw(0);
      if (!reduced.matches) play();
    };
    reduced.addEventListener("change", onReducedChange);

    return () => {
      pause();
      themeObserver.disconnect();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", syncPointer);
      window.removeEventListener("pointerleave", onPointerOut);
      window.removeEventListener("blur", onPointerOut);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onReducedChange);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="hero-field__canvas" />;
}
