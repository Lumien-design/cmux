'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { toolMarks } from '@/components/logos';

/**
 * LogoLoop — from reactbits, adapted.
 *
 * Kept the part that matters: velocity is integrated per frame against real
 * elapsed time and the offset wraps on the measured sequence width, so the
 * loop stays seamless at any speed and survives a resize. That is the piece
 * people usually get wrong by animating a percentage and hoping.
 *
 * Dropped vertical mode, image loading and the custom item renderer. The marks
 * here are inline SVG in a fixed row, so none of that generality had work to do.
 *
 * Two additions, both required by this project rather than the original:
 *
 * - Reduced motion renders a static row and never starts the loop. The slop
 *   catalogue lists marquees under motion theatre, and a marquee with no
 *   reduced-motion path is the version it is actually complaining about.
 * - The loop parks when off screen, so it costs nothing while you read the
 *   rest of the page.
 */

const SMOOTH_TAU = 0.25;
const MIN_COPIES = 2;
const COPY_HEADROOM = 2;

export function LogoLoop({
  speed = 44,
  gap = 64,
  markHeight = 22,
  className,
  ariaLabel = 'Tools that run in cmux',
}: {
  speed?: number;
  gap?: number;
  markHeight?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLUListElement>(null);

  const [seqWidth, setSeqWidth] = useState(0);
  const [copyCount, setCopyCount] = useState(MIN_COPIES);

  /**
   * Hover lives in a ref, not in state, and deliberately.
   *
   * With `hovered` as an effect dependency the whole loop was torn down and
   * rebuilt on every enter and leave, which reset the offset to zero. The row
   * snapped back to its start instead of easing to a stop, so the deceleration
   * that is already in the maths never got a chance to show. Offset and
   * velocity persist across renders for the same reason.
   */
  const hoveredRef = useRef(false);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  // Motion's hook rather than a matchMedia read mirrored into state: it is a
  // real subscription, so a reader who flips the system setting mid visit gets
  // the static row without reloading, and there is no first render where the
  // component disagrees with the document.
  const reduced = useReducedMotion() ?? false;

  const measure = useCallback(() => {
    const container = containerRef.current;
    const seq = seqRef.current;
    if (!container || !seq) return;
    const width = Math.ceil(seq.getBoundingClientRect().width);
    if (width <= 0) return;
    setSeqWidth(width);
    setCopyCount(Math.max(MIN_COPIES, Math.ceil(container.clientWidth / width) + COPY_HEADROOM));
  }, []);

  useEffect(() => {
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (seqRef.current) ro.observe(seqRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (reduced || !seqWidth) return;
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    let raf = 0;
    let last: number | null = null;
    let visible = true;

    const frame = (now: number) => {
      if (last === null) last = now;
      const dt = Math.max(0, now - last) / 1000;
      last = now;

      // Exponential approach: the row coasts to a stop on hover and picks the
      // speed back up on leave, rather than switching between on and off.
      const target = hoveredRef.current ? 0 : speed;
      const ease = 1 - Math.exp(-dt / SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * ease;

      const next = offsetRef.current + velocityRef.current * dt;
      offsetRef.current = ((next % seqWidth) + seqWidth) % seqWidth;
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;

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
      { rootMargin: '120px' },
    );
    vis.observe(container);

    // Native listeners rather than React's onPointerEnter. The frame loop reads
    // this ref directly, so routing it through React's synthetic delegation
    // adds a layer for no benefit and makes the behaviour harder to verify.
    const enter = () => {
      hoveredRef.current = true;
    };
    const leave = () => {
      hoveredRef.current = false;
    };
    container.addEventListener('pointerenter', enter);
    container.addEventListener('pointerleave', leave);

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      vis.disconnect();
      container.removeEventListener('pointerenter', enter);
      container.removeEventListener('pointerleave', leave);
    };
  }, [reduced, seqWidth, speed]);

  // A function, not a shared element: only the first copy carries the measuring
  // ref, and every copy after it is hidden from assistive technology so the
  // tool names are announced once rather than once per repetition.
  const renderRow = (measured: boolean) => (
    <ul
      ref={measured ? seqRef : undefined}
      aria-hidden={!measured}
      className="flex shrink-0 items-center"
      style={{ gap: `${gap}px`, paddingInlineEnd: `${gap}px` }}
    >
      {toolMarks.map(({ key, label, Mark }) => (
        <li key={key} className="group/mark flex shrink-0 items-center">
          <Mark
            className={cn(
              'w-auto text-ink-muted',
              // Colour and a 2px lift rather than a scale: the marks sit on a
              // baseline with each other, and scaling breaks that line.
              'transition-[color,translate] duration-180 ease-out',
              'motion-reduce:transition-none',
              '[@media(hover:hover)and(pointer:fine)]:group-hover/mark:-translate-y-25',
              '[@media(hover:hover)and(pointer:fine)]:group-hover/mark:text-ink',
            )}
          />
          <span className="sr-only">{label}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={ariaLabel}
      className={cn(
        'relative overflow-hidden',
        // Edge fade, so marks arrive and leave rather than being cut off.
        '[mask-image:linear-gradient(90deg,transparent,black_9%,black_91%,transparent)]',
        className,
      )}
      style={{ ['--mark-h' as string]: `${markHeight}px` }}
    >
      <div
        ref={trackRef}
        className="flex w-max will-change-transform [&_svg]:h-[var(--mark-h)]"
      >
        {/* Under reduced motion a single static row is rendered and the loop
            never starts, so nothing moves and nothing is clipped mid travel. */}
        {reduced
          ? renderRow(true)
          : Array.from({ length: copyCount }, (_, i) => (
              <div key={i} className="flex">
                {renderRow(i === 0)}
              </div>
            ))}
      </div>
    </div>
  );
}
