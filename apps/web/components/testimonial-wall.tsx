'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { testimonials, type Testimonial } from '@/content/testimonials';

/**
 * TestimonialWall — DriftWall, adapted from images to quotes.
 *
 * DriftWall is an image wall: 200x132 tiles holding an `img`, drifting in
 * columns under a 3D tilt. Kept the mechanics, which are the good part — the
 * column distribution, the per-column speed variance from a golden ratio
 * pseudo random, the continuous drift with modulo wrap, pointer parallax,
 * pause on hover, and the reduced-motion bail.
 *
 * Two changes, and the second is a real disagreement with the original.
 *
 * Tiles carry a quote instead of an image, so they are sized for text rather
 * than for a 3:2 crop.
 *
 * The 3D tilt defaults to zero. DriftWall turns tiles 16 degrees on one axis
 * and -14 on another, which is lovely for photographs and close to unreadable
 * for a paragraph. A testimonial that cannot be read is decoration wearing
 * proof's clothing, and proof is the entire reason this section exists. The
 * prop is still there if a little is wanted.
 */

const SPEED = 16; // px per second, slow enough to read against
const VARIANCE = 0.35;

function goldenFactor(index: number, variance: number) {
  const pseudo = ((index * 0.618033988749 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
}

function Quote({ t }: { t: Testimonial }) {
  return (
    <a
      href={t.href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        'group flex flex-col gap-200 rounded-card bg-panel p-300 text-ink',
        'shadow-(--shadow-raised-sm)',
        'transition-[translate] duration-240 ease-out hover:-translate-y-25',
      )}
    >
      {t.original && (
        <p lang={t.lang === 'Korean' ? 'ko' : undefined} className="text-base leading-relaxed text-ink-muted">
          {t.original}
        </p>
      )}
      <p className="text-base leading-relaxed text-ink">
        {t.original ? <span className="text-ink-muted">— </span> : null}
        {t.quote}
      </p>
      <p className="mt-auto flex items-baseline gap-50 pt-100 text-sm">
        <span className="font-medium text-ink">{t.name}</span>
        {t.title && <span className="text-ink-muted">· {t.title}</span>}
        <ArrowUpRight
          size={13}
          weight="regular"
          aria-hidden="true"
          className="ms-auto shrink-0 self-center text-ink-muted transition-[translate] duration-180 ease-out group-hover:-translate-y-25"
        />
      </p>
    </a>
  );
}

export function TestimonialWall({
  columns = 3,
  tilt = 0,
  className,
}: {
  columns?: number;
  /** Degrees. DriftWall's default is 16; text wants 0. */
  tilt?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [reduced, setReduced] = useState(true);
  const hovered = useRef(false);
  const pointer = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Deal the quotes into columns, as DriftWall does.
  const cols = useMemo(() => {
    const out: Testimonial[][] = Array.from({ length: columns }, () => []);
    testimonials.forEach((t, i) => out[i % columns]!.push(t));
    return out;
  }, [columns]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    pointer.current = (e.clientY - r.top) / r.height - 0.5;
  }, []);

  useEffect(() => {
    if (reduced) return;
    const tracks = trackRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!tracks.length) return;

    const offsets = tracks.map(() => 0);
    let raf = 0;
    let last: number | null = null;
    let visible = true;

    const frame = (now: number) => {
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      tracks.forEach((track, i) => {
        const half = track.scrollHeight / 2;
        if (half > 0 && !hovered.current) {
          // Alternate direction per column, vary the speed per column.
          const dir = i % 2 === 0 ? 1 : -1;
          offsets[i] = (offsets[i]! + SPEED * goldenFactor(i, VARIANCE) * dir * dt + half) % half;
        }
        const parallax = pointer.current * 14 * goldenFactor(i, 0.5);
        track.style.transform = `translate3d(0, ${-(offsets[i] ?? 0) + parallax}px, 0)`;
      });

      if (visible) raf = requestAnimationFrame(frame);
    };

    const vis = new IntersectionObserver(
      ([entry]) => {
        const now = entry?.isIntersecting ?? true;
        if (now && !visible) {
          last = null;
          raf = requestAnimationFrame(frame);
        }
        visible = now;
      },
      { rootMargin: '150px' },
    );
    if (containerRef.current) vis.observe(containerRef.current);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      vis.disconnect();
    };
  }, [reduced, cols.length]);

  return (
    <div
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerEnter={() => {
        hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
        pointer.current = 0;
      }}
      style={tilt ? { perspective: '1200px' } : undefined}
      className={cn(
        'grid gap-300 prose:grid-cols-2 split:grid-cols-3',
        // Only the drifting version needs clipping and a height cap; the
        // static one is an ordinary column layout that ends where it ends.
        !reduced && 'max-h-[42rem] overflow-hidden',
        !reduced &&
          '[mask-image:linear-gradient(180deg,transparent,black_8%,black_92%,transparent)]',
        className,
      )}
    >
      {cols.map((col, i) => (
        <div
          key={i}
          ref={(el) => {
            trackRefs.current[i] = el;
          }}
          style={tilt ? { transform: `rotateY(${tilt * (i % 2 ? -1 : 1)}deg)` } : undefined}
          className="flex flex-col gap-300 will-change-transform"
        >
          {col.map((t) => (
            <Quote key={t.href} t={t} />
          ))}
          {/* The duplicate makes the wrap seamless. Hidden from assistive
              technology so every quote is announced exactly once. */}
          {!reduced &&
            col.map((t) => (
              <div key={`${t.href}-dup`} aria-hidden="true">
                <Quote t={t} />
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
