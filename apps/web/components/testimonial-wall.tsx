'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { testimonials, type Testimonial } from '@/content/testimonials';

/**
 * DriftWall — the real thing this time, with the supplied settings.
 *
 * My first pass kept DriftWall's column drift but threw away the 3D plane,
 * because tilted text is harder to read. That was my judgement substituted for
 * the brief, and the brief was explicit. This is the actual component: one
 * plane rotated on all three axes, columns drifting in alternating directions
 * at golden-ratio-varied speeds, pointer parallax damped into the plane
 * rotation, and tiles that lift toward the viewer on hover.
 *
 * The only substantive change is the tile body: a quote instead of an `img`,
 * since that is what it is displaying. Everything numeric comes from the
 * settings as given — columns 7, tilt 27, turn 23, roll -10, perspective 900,
 * depth 40, speed 26, variance 0.65, parallax 0.9, lift 64, fade 0, dim 1,
 * radius 15, pauseOnHover false.
 *
 * Two things kept from the original that matter and are easy to lose: the
 * reduced-motion branch still lays the wall out and simply does not drift it,
 * and every tile is a real link, so the wall is keyboard reachable and each
 * quote goes to its source.
 */

/** DriftWall's per-column variance: deterministic, not random, so it is stable across renders. */
const columnFactor = (index: number, variance: number) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

export function TestimonialWall({
  items = testimonials,
  columns = 7,
  tileWidth = 280,
  tileHeight = 160,
  gap = 12,
  radius = 15,
  tilt = 27,
  turn = 23,
  roll = -10,
  perspective = 900,
  depth = 40,
  speed = 26,
  direction = 'up',
  variance = 0.65,
  parallax = 0.9,
  lift = 64,
  fade = 0,
  dim = 1,
  pauseOnHover = false,
  className,
}: {
  items?: readonly Testimonial[];
  columns?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  tilt?: number;
  turn?: number;
  roll?: number;
  perspective?: number;
  depth?: number;
  speed?: number;
  direction?: 'up' | 'down';
  variance?: number;
  parallax?: number;
  lift?: number;
  fade?: number;
  dim?: number;
  pauseOnHover?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const offsetsRef = useRef<number[]>([]);
  const velocitiesRef = useRef<number[]>([]);
  const hoveredColRef = useRef(-1);
  const wallHoveredRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerDampedRef = useRef({ x: 0, y: 0 });
  const lastTsRef = useRef<number | null>(null);

  const [containerHeight, setContainerHeight] = useState(600);

  /**
   * The original reads matchMedia and mirrors it into state from inside an
   * effect. Motion's hook is a real subscription with a server snapshot, so it
   * survives hydration and reacts if the reader changes the setting mid visit,
   * without writing state from an effect body.
   */
  const reduced = useReducedMotion() ?? false;

  const columnItems = useMemo(() => {
    const cols: Testimonial[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, i) => cols[i % columns]!.push(item));
    return cols.map((col) => (col.length ? col : items.slice(0, 1)));
  }, [items, columns]);

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap;
    return columnItems.map((col) => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
      return { copyHeight, copies };
    });
  }, [columnItems, tileHeight, gap, containerHeight]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry?.contentRect.height || 600);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const baseVelocities = useMemo(() => {
    const dirSign = direction === 'up' ? 1 : -1;
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });
  }, [columnItems, speed, direction, variance]);

  useEffect(() => {
    offsetsRef.current = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
    velocitiesRef.current = columnItems.map(() => 0);
  }, [columnMeta, columnItems]);

  const applyPlaneTransform = useCallback(
    (px: number, py: number) => {
      const plane = planeRef.current;
      if (!plane) return;
      plane.style.transform =
        `translate(-50%, -50%) scale(1.18) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`;
    },
    [tilt, turn, roll, depth],
  );

  useEffect(() => {
    let visible = true;

    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const maxTilt = parallax * 8;
      const targetX = pointerRef.current.x * maxTilt;
      const targetY = -pointerRef.current.y * maxTilt;
      const damp = 1 - Math.exp(-dt / 0.12);
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

      if (!reduced) {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const meta = columnMeta[c];
          if (!meta) continue;
          const paused = wallHoveredRef.current && pauseOnHover;
          const factor = paused || hoveredColRef.current === c ? 0 : 1;
          const target = (baseVelocities[c] ?? 0) * factor;

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
          velocitiesRef.current[c] = (velocitiesRef.current[c] ?? 0) + (target - (velocitiesRef.current[c] ?? 0)) * ease;
          let next = (offsetsRef.current[c] ?? 0) + (velocitiesRef.current[c] ?? 0) * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          offsetsRef.current[c] = next;

          const el = trackRefs.current[c];
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      } else {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const el = trackRefs.current[c];
          if (el) el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
        }
      }

      if (visible) rafRef.current = requestAnimationFrame(animate);
    };

    // Park the loop off screen. A 3D plane of tiles is not cheap to composite.
    const vis = new IntersectionObserver(
      ([entry]) => {
        const now = entry?.isIntersecting ?? true;
        if (now && !visible) {
          lastTsRef.current = null;
          rafRef.current = requestAnimationFrame(animate);
        }
        visible = now;
      },
      { rootMargin: '200px' },
    );
    if (containerRef.current) vis.observe(containerRef.current);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      vis.disconnect();
    };
  }, [baseVelocities, columnMeta, pauseOnHover, parallax, reduced, applyPlaneTransform]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (parallax > 0 && !reduced) {
        pointerRef.current = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        };
      }
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const tile = hit instanceof Element ? hit.closest<HTMLElement>('[data-col]') : null;
      hoveredColRef.current = tile ? Number(tile.dataset.col) : -1;
    },
    [parallax, reduced],
  );

  const cssVars = {
    '--dw-tile-w': `${tileWidth}px`,
    '--dw-tile-h': `${tileHeight}px`,
    '--dw-gap': `${gap}px`,
    '--dw-radius': `${radius}px`,
    '--dw-perspective': `${perspective}px`,
    '--dw-lift': `${lift}px`,
    '--dw-dim': String(dim),
    '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`,
  } as React.CSSProperties;

  return (
    <div
      ref={containerRef}
      className={cn('drift-wall', className)}
      style={cssVars}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => {
        wallHoveredRef.current = true;
      }}
      onPointerLeave={() => {
        wallHoveredRef.current = false;
        pointerRef.current = { x: 0, y: 0 };
        hoveredColRef.current = -1;
      }}
    >
      <div ref={planeRef} className="drift-wall__plane">
        {columnItems.map((col, c) => (
          <div key={c} className="drift-wall__col">
            <div
              ref={(el) => {
                trackRefs.current[c] = el;
              }}
              className="drift-wall__track"
            >
              {Array.from({ length: columnMeta[c]?.copies ?? 2 }).flatMap((_, copy) =>
                col.map((t) => (
                  <a
                    key={`${t.href}-${copy}`}
                    href={t.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-col={c}
                    // Only the first pass is reachable; the repeats exist to
                    // make the wrap seamless and would otherwise announce every
                    // quote several times over.
                    aria-hidden={copy > 0}
                    tabIndex={copy > 0 ? -1 : undefined}
                    className="drift-wall__tile"
                  >
                    <span className="drift-wall__inner">
                      <span className="drift-wall__quote">{t.quote}</span>
                      <span className="drift-wall__by">
                        {t.name}
                        {t.title ? <span className="drift-wall__role"> · {t.title}</span> : null}
                      </span>
                    </span>
                  </a>
                )),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
