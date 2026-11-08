"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import { FolderColorPicker, useFolderColors } from "@/components/business-os/admin/brain/folder-colors";
import { folderColor, topFolder } from "@/components/business-os/admin/brain/note-shared";

type GraphNode = SimulationNodeDatum & { id: string; title: string; ghost: boolean; degree: number; folder: string };
type GraphLink = SimulationLinkDatum<GraphNode>;

export type GraphInput = {
  notes: { id: string; title: string; key: string; folder: string }[];
  links: { from: string; toKey: string }[];
};

/** Notes as nodes, links as edges. Links to notes that do not exist yet become faint "ghost" nodes, as in Obsidian. */
export function buildGraph({ notes, links }: GraphInput): { nodes: GraphNode[]; edges: { source: string; target: string }[] } {
  const byKey = new Map(notes.map((note) => [note.key, note.id]));
  const nodes = new Map<string, GraphNode>(notes.map((note) => [note.id, { id: note.id, title: note.title, ghost: false, degree: 0, folder: note.folder }]));
  const edges: { source: string; target: string }[] = [];
  for (const link of links) {
    if (!nodes.has(link.from)) continue;
    let target = byKey.get(link.toKey);
    if (!target) {
      target = `ghost:${link.toKey}`;
      if (!nodes.has(target)) nodes.set(target, { id: target, title: link.toKey, ghost: true, degree: 0, folder: "" });
    }
    if (target === link.from) continue;
    edges.push({ source: link.from, target });
    nodes.get(link.from)!.degree += 1;
    nodes.get(target)!.degree += 1;
  }
  return { nodes: [...nodes.values()], edges };
}

function cssVar(element: Element, name: string, fallback: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

/**
 * Force-directed note graph on a canvas. Drag to pan, wheel or pinch to zoom,
 * click a node to open it. The current note is highlighted with its neighbours.
 */
export function NoteGraph({ input, current, onOpen }: { input: GraphInput; current: string | null; onOpen: (id: string, ghostTitle?: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const hoverRef = useRef<string | null>(null);
  const currentRef = useRef(current);
  const openRef = useRef(onOpen);
  const drawRef = useRef<() => void>(() => {});
  const [picked, pick] = useFolderColors();
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
    drawRef.current();
  }, [picked]);
  useEffect(() => {
    openRef.current = onOpen;
  }, [onOpen]);
  useEffect(() => {
    currentRef.current = current;
    drawRef.current();
  }, [current]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const { nodes, edges } = buildGraph(input);
    const links: GraphLink[] = edges.map((edge) => ({ ...edge }));
    const neighbours = new Map<string, Set<string>>();
    for (const edge of edges) {
      if (!neighbours.has(edge.source)) neighbours.set(edge.source, new Set());
      if (!neighbours.has(edge.target)) neighbours.set(edge.target, new Set());
      neighbours.get(edge.source)!.add(edge.target);
      neighbours.get(edge.target)!.add(edge.source);
    }
    const colors = {
      node: cssVar(canvas, "--color-text-dim", "#888"),
      accent: cssVar(canvas, "--bos-accent", "#5473a1"),
      text: cssVar(canvas, "--color-text", "#eee"),
      edge: cssVar(canvas, "--color-border-strong", "#444"),
      top: cssVar(canvas, "--bos-muted", "#888"),
    };
    const fill = (node: GraphNode) => {
      if (node.ghost) return colors.node;
      return topFolder(node.folder) ? folderColor(node.folder, pickedRef.current) : colors.top;
    };
    let view = { x: 0, y: 0, k: 1 };
    let width = 0;
    let height = 0;
    const ratio = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      draw();
    }

    const radius = (node: GraphNode) => 3 + Math.min(9, Math.sqrt(node.degree) * 2);

    function draw() {
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.translate(width / 2 + view.x, height / 2 + view.y);
      context.scale(view.k, view.k);
      const focus = hoverRef.current ?? currentRef.current;
      const near = focus ? neighbours.get(focus) : undefined;
      context.lineWidth = 1 / view.k;
      for (const link of links) {
        const source = link.source as GraphNode;
        const target = link.target as GraphNode;
        const lit = focus && (source.id === focus || target.id === focus);
        context.strokeStyle = lit ? colors.accent : colors.edge;
        context.globalAlpha = focus && !lit ? 0.25 : 0.7;
        context.beginPath();
        context.moveTo(source.x ?? 0, source.y ?? 0);
        context.lineTo(target.x ?? 0, target.y ?? 0);
        context.stroke();
      }
      for (const node of nodes) {
        const active = node.id === focus || node.id === currentRef.current;
        const dim = focus && !active && !near?.has(node.id);
        context.globalAlpha = node.ghost ? (dim ? 0.15 : 0.4) : dim ? 0.3 : 1;
        context.fillStyle = fill(node);
        context.beginPath();
        context.arc(node.x ?? 0, node.y ?? 0, radius(node), 0, Math.PI * 2);
        context.fill();
        if (active) {
          context.strokeStyle = colors.accent;
          context.lineWidth = 2.5 / view.k;
          context.beginPath();
          context.arc(node.x ?? 0, node.y ?? 0, radius(node) + 2.5 / view.k, 0, Math.PI * 2);
          context.stroke();
          context.lineWidth = 1 / view.k;
        }
        if (view.k > 0.8 || active || near?.has(node.id) || node.degree > 4) {
          context.fillStyle = colors.text;
          context.globalAlpha = dim ? 0.3 : node.ghost ? 0.5 : 0.9;
          context.font = `${12 / view.k}px system-ui, sans-serif`;
          context.textAlign = "center";
          context.fillText(node.title, node.x ?? 0, (node.y ?? 0) + radius(node) + 12 / view.k);
        }
      }
      context.globalAlpha = 1;
    }

    drawRef.current = draw;
    const simulation = forceSimulation<GraphNode>(nodes)
      .force("link", forceLink<GraphNode, GraphLink>(links).id((node) => node.id).distance(60).strength(0.4))
      .force("charge", forceManyBody().strength(-120))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide<GraphNode>().radius((node) => radius(node) + 4))
      .on("tick", draw);

    function toWorld(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      return { x: (clientX - rect.left - width / 2 - view.x) / view.k, y: (clientY - rect.top - height / 2 - view.y) / view.k };
    }

    function nodeAt(clientX: number, clientY: number): GraphNode | null {
      const point = toWorld(clientX, clientY);
      let best: GraphNode | null = null;
      let bestDistance = Infinity;
      for (const node of nodes) {
        const distance = Math.hypot((node.x ?? 0) - point.x, (node.y ?? 0) - point.y);
        if (distance < radius(node) + 6 / view.k && distance < bestDistance) {
          best = node;
          bestDistance = distance;
        }
      }
      return best;
    }

    let drag: { x: number; y: number; moved: boolean } | null = null;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch: number | null = null;

    function onPointerDown(event: PointerEvent) {
      canvas!.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1) drag = { x: event.clientX, y: event.clientY, moved: false };
    }
    function onPointerMove(event: PointerEvent) {
      if (pointers.has(event.pointerId)) pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) view = { ...view, k: Math.min(4, Math.max(0.2, view.k * (distance / pinch))) };
        pinch = distance;
        if (drag) drag.moved = true;
        draw();
        return;
      }
      if (drag) {
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        view = { ...view, x: view.x + dx, y: view.y + dy };
        drag = { ...drag, x: event.clientX, y: event.clientY };
        draw();
        return;
      }
      const node = nodeAt(event.clientX, event.clientY);
      const id = node?.id ?? null;
      if (id !== hoverRef.current) {
        hoverRef.current = id;
        setHover(id);
        draw();
      }
    }
    function onPointerUp(event: PointerEvent) {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = null;
      if (drag && !drag.moved && pointers.size === 0) {
        const node = nodeAt(event.clientX, event.clientY);
        if (node) openRef.current(node.ghost ? "" : node.id, node.ghost ? node.title : undefined);
      }
      if (pointers.size === 0) drag = null;
    }
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * 0.0015);
      view = { ...view, k: Math.min(4, Math.max(0.2, view.k * factor)) };
      draw();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    resize();
    return () => {
      simulation.stop();
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [input]);

  const legend = useMemo(() => [...new Set(input.notes.map((note) => topFolder(note.folder)))].sort((a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b))), [input]);

  return (
    <div className="bos-graph">
      <canvas ref={canvasRef} data-hover={hover ? "" : undefined} aria-label="Note graph. Click a note to open it." role="img" />
      {legend.length > 1 ? (
        <ul className="bos-graph-legend" aria-label="Folder colours">
          {legend.map((name) => (
            <li key={name || "_top"}>
              <FolderColorPicker folder={name} picked={picked} onPick={pick} />
              {name || "Top level"}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
