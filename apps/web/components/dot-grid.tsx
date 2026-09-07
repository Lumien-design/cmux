"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

/**
 * DotGridBackground — from the Dot Grid Background jig, adapted.
 *
 * Kept as supplied: the DPR clamp, ResizeObserver, pointer smoothing, seeded
 * per-dot phase, and the reduced-motion freeze. That is careful work and there
 * was no reason to touch it.
 *
 * Two changes:
 *
 * 1. It rendered forever. An IntersectionObserver now parks the loop whenever
 *    the section is off screen, so a canvas at the bottom of a long page costs
 *    nothing while you read the top of it.
 * 2. The dot colour inherits from CSS `color`, so it is driven by a semantic
 *    token on the wrapper rather than a hardcoded grey, and both themes work.
 *
 * It runs behind the whole sheet as a sticky, viewport tall layer rather than
 * a full page canvas, so the cost is one screen of pixels no matter how long
 * the page gets. See the mount in app/page.tsx for why sticky and not fixed.
 */

const OPTIONS = {
  fullscreen: true,
  rows: 10,
  cols: 10,
  gap: 38, // px between dots
  baseRadius: 1, // px
  breathSpeed: 0.000465421, // rad/ms (~13.5s cycle)
  breathDepth: 0.78, // 0..1 size swing
  influenceRadius: 290, // px around the cursor
  pushStrength: 24, // max px of displacement
  magnify: 0.75, // extra radius at the cursor (0..2)
  smoothing: 111.35, // ms cursor-follow time constant
};

const COLORS = {
  dot: null as string | null, // null → inherit CSS color
  background: null as string | null, // null → transparent
};

interface Dot {
  x: number;
  y: number;
  phase: number;
}

function seededPhase(index: number): number {
  const s = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * Math.PI * 2;
}

function makeDots(rows: number, cols: number, left: number, top: number, gap: number): Dot[] {
  const dots: Dot[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push({ x: left + c * gap, y: top + r * gap, phase: seededPhase(r * cols + c) });
    }
  }
  return dots;
}

function buildGrid(width: number, height: number): Dot[] {
  if (OPTIONS.fullscreen) {
    const gap = Math.max(OPTIONS.gap, Math.sqrt((width * height) / 4000));
    const cols = Math.ceil(width / gap) + 1;
    const rows = Math.ceil(height / gap) + 1;
    return makeDots(rows, cols, (width - (cols - 1) * gap) / 2, (height - (rows - 1) * gap) / 2, gap);
  }
  const { rows, cols } = OPTIONS;
  const maxSpan = Math.min(width, height) * 0.78;
  const gap = Math.min(OPTIONS.gap, maxSpan / (Math.max(rows, cols) - 1));
  return makeDots(rows, cols, (width - (cols - 1) * gap) / 2, (height - (rows - 1) * gap) / 2, gap);
}

function smoothstep(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
}

export function DotGridBackground({
  color,
  className,
  style,
}: {
  /** dot color; defaults to the canvas's inherited CSS color */
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let fillColor = color || COLORS.dot || "rgb(128, 128, 128)";
    const cursor = { x: -9999, y: -9999, strength: 0 };
    const target = { x: -9999, y: -9999, active: false };

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!color && !COLORS.dot) fillColor = getComputedStyle(canvas).color;
      dots = buildGrid(width, height);
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = fillColor;
      for (const dot of dots) {
        const breath = 0.5 + 0.5 * Math.sin(time * OPTIONS.breathSpeed + dot.phase);
        let radius = OPTIONS.baseRadius * (1 - OPTIONS.breathDepth / 2 + OPTIONS.breathDepth * breath);
        let alpha = 0.33 + 0.3 * OPTIONS.breathDepth * (breath - 0.5);
        let x = dot.x;
        let y = dot.y;
        if (cursor.strength > 0.001) {
          const dx = x - cursor.x;
          const dy = y - cursor.y;
          const dist = Math.hypot(dx, dy);
          const falloff = smoothstep(1 - dist / OPTIONS.influenceRadius) * cursor.strength;
          if (falloff > 0 && dist > 0.0001) {
            const push = falloff * OPTIONS.pushStrength;
            x += (dx / dist) * push;
            y += (dy / dist) * push;
            radius *= 1 + OPTIONS.magnify * falloff;
            alpha += 0.4 * falloff;
          }
        }
        ctx.globalAlpha = Math.min(alpha, 0.85);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
      target.active = true;
    };
    const onPointerLeave = () => {
      target.active = false;
    };

    let raf = 0;
    let last = performance.now();
    let visible = true;
    const frame = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      const k = 1 - Math.exp(-dt / OPTIONS.smoothing);
      if (cursor.strength < 0.01 && target.active) {
        cursor.x = target.x;
        cursor.y = target.y;
      } else {
        cursor.x += (target.x - cursor.x) * k;
        cursor.y += (target.y - cursor.y) * k;
      }
      cursor.strength += ((target.active ? 1 : 0) - cursor.strength) * k;
      draw(reducedMotion ? 0 : now);
      if (visible) raf = requestAnimationFrame(frame);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);

    // Park the loop while the section is off screen.
    const vis = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry?.isIntersecting ?? true;
        if (nowVisible && !visible) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
        visible = nowVisible;
      },
      { rootMargin: "200px" },
    );
    vis.observe(stage);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerdown", onPointerMove);
    stage.addEventListener("pointerleave", onPointerLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      vis.disconnect();
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerdown", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={"dot-grid-canvas" + (className ? " " + className : "")}
      style={{
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...(COLORS.background ? { background: COLORS.background } : {}),
        ...style,
      }}
    />
  );
}
