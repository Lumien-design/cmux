'use client';

import { useEffect, useRef } from 'react';

/**
 * DotRingCursor — as supplied, with the parts a production page needs.
 *
 * Kept unchanged: the fine-pointer gate, the passive move listener, the lerp
 * on the ring with the dot pinned to the real position, the scale approach on
 * hover, and the cleanup. That is the right shape for this.
 *
 * Four additions:
 *
 * 1. Reduced motion. A cursor that lags behind the pointer is continuous
 *    animation tied to the reader's own hand, which is exactly what that
 *    setting is asking you not to do. It does not mount at all, and the system
 *    cursor is left alone.
 * 2. The native cursor is hidden only while this is actually running, and only
 *    on fine pointers. Hiding it unconditionally would strip a reader of a
 *    cursor they may have deliberately configured.
 * 3. Difference blending. This page has warm paper and near black terminal
 *    windows on the same screen, so a single ink colour would vanish over the
 *    mocks. Difference inverts against whatever is underneath, so the ring
 *    stays visible on both without needing to know what it is over.
 * 4. It hides when the pointer leaves the window, rather than being stranded
 *    at the last known position.
 */

export function DotRingCursor({ ease = 0.14, grow = 2.2 }: { ease?: number; grow?: number }) {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduced.matches) return;

    document.documentElement.classList.add('has-custom-cursor');

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let scale = 1;
    let want = 1;
    let opacity = 0;
    let wantOpacity = 1;
    let id = 0;

    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      wantOpacity = 1;
    };
    const over = (e: PointerEvent) => {
      const t = e.target;
      want =
        t instanceof Element && t.closest('a, button, summary, [data-cursor-hover]') ? grow : 1;
    };
    // Do not strand the cursor at the last known point when the pointer leaves.
    const leave = () => {
      wantOpacity = 0;
    };
    const enter = () => {
      wantOpacity = 1;
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('pointerenter', enter);
    window.addEventListener('blur', leave);

    const loop = () => {
      rx += (mx - rx) * ease;
      ry += (my - ry) * ease;
      scale += (want - scale) * 0.12;
      opacity += (wantOpacity - opacity) * 0.15;

      if (dot.current) {
        dot.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
        dot.current.style.opacity = String(opacity);
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`;
        ring.current.style.opacity = String(opacity);
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('pointerenter', enter);
      window.removeEventListener('blur', leave);
      cancelAnimationFrame(id);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, [ease, grow]);

  /**
   * Both nodes always render. They start invisible in CSS and only the loop
   * gives them an opacity, so when the effect bails out for reduced motion or
   * a coarse pointer they stay hidden and the system cursor is untouched.
   * Gating this with state instead would mean writing state from an effect for
   * two aria-hidden divs, which is a re-render for nothing.
   */
  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
