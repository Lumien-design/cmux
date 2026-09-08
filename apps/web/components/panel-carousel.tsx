'use client';

import { useEffect, useRef, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';

/**
 * The five product panels, as one horizontal scroller.
 *
 * Native overflow with CSS scroll snap, not a JavaScript slider. Trackpad,
 * shift wheel, touch swipe and keyboard all work without being reimplemented,
 * and with JavaScript off it degrades to a plain scroller with every panel
 * still reachable.
 *
 * Panels arrive as already rendered nodes, so the app mock inside them stays a
 * server component and none of its markup ships to the browser. Only the
 * scroll wiring is client side.
 *
 * Three decisions worth knowing.
 *
 * Movement is native. The browser's own smooth scrolling does the sliding, so
 * there is no duration written anywhere, which is how this satisfies the
 * project's duration ladder rather than fighting it. Buttons call scrollTo and
 * nothing else.
 *
 * The active panel is tracked with an IntersectionObserver rooted on the track
 * itself, not the viewport. With only a sliver of the next panel showing,
 * exactly one can pass the threshold at rest, so exactly one dot lights. Part
 * way through a drag neither qualifies and the dot simply waits, which is
 * right: a dot should report where you landed, not chase your finger. This
 * project bans the equivalent scroll listener outright, and this is the better
 * mechanism anyway.
 *
 * Nothing inside a panel is focusable. The mock is an image role and its
 * prompt bar is a plain element, so the only tab stops here are the track, the
 * two buttons and the five dots. That removes the classic snap carousel bug
 * where focus moves to something scrolled out of view.
 */

/** Read live rather than cached, so a reader who changes the setting mid visit is obeyed. */
const prefersStillness = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export type PanelItem = {
  id: string;
  heading: string;
  content: React.ReactNode;
};

export function PanelCarousel({
  items,
  label,
}: {
  items: readonly PanelItem[];
  label: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(i)) setActive(i);
        }
      },
      { root: track, threshold: 0.6 },
    );

    for (const el of itemRefs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [items.length]);

  /**
   * Four of the site's navigation links point at a panel by fragment. The
   * browser will scroll the page down to the carousel on its own but leaves
   * the track where it was, so the link lands you on the band showing panel
   * one rather than the panel you asked for. This closes that: on load the
   * panel is simply placed, and a later click slides, so you see which way you
   * moved.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const jumpToHash = (behavior: ScrollBehavior) => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = itemRefs.current.findIndex((el) => el?.id === id);
      const first = itemRefs.current[0];
      if (target < 0 || !first) return;
      const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
      track.scrollTo({ left: target * (first.getBoundingClientRect().width + gap), behavior });
    };

    jumpToHash('auto');
    const onHash = () => jumpToHash(prefersStillness() ? 'auto' : 'smooth');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function goTo(index: number) {
    const track = trackRef.current;
    const first = itemRefs.current[0];
    if (!track || !first) return;

    const clamped = Math.max(0, Math.min(items.length - 1, index));
    // Panels are uniform, so index times step is exact, and snap corrects any
    // sub pixel drift left over from the rem to pixel rounding.
    const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
    const step = first.getBoundingClientRect().width + gap;

    track.scrollTo({ left: clamped * step, behavior: prefersStillness() ? 'auto' : 'smooth' });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    // Taken over from the browser deliberately: native arrow scrolling inside a
    // mandatory snap container lands part way between panels in some engines.
    const jump: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: items.length - 1,
    };
    const next = jump[e.key];
    if (next === undefined) return;
    e.preventDefault();
    goTo(next);
  }

  return (
    <div className="mt-500">
      <ul
        ref={trackRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label={`${label}. Use the left and right arrow keys.`}
        className={cn(
          'panel-track flex gap-300 snap-x snap-mandatory',
          // overscroll-x-contain is the load bearing one: it stops a sideways
          // gesture from chaining out to the page or to browser back
          // navigation. Vertical is left to chain, so the page still scrolls
          // when a finger lands on a panel.
          'overflow-x-auto overscroll-x-contain scroll-smooth motion-reduce:scroll-auto',
          // On a phone the band breaks out of the section gutter and runs to
          // the sheet edge. Two rem of margin either side is a fifth of a 375
          // pixel screen, and a panel holding a heading, three points and a
          // window cannot afford it. The scroll padding matches the padding,
          // or the snap position would sit a gutter to the left of the panel.
          '-mx-400 px-200 [scroll-padding-inline-start:var(--spacing-200)]',
          'prose:mx-0 prose:px-0 prose:[scroll-padding-inline-start:0px]',
        )}
      >
        {items.map((item, i) => (
          <li
            key={item.id}
            id={item.id}
            data-index={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="w-[calc(100%-1rem)] shrink-0 snap-start prose:w-[calc(100%-3rem)]"
          >
            {item.content}
          </li>
        ))}
      </ul>

      <div className="mt-300 flex items-center gap-300">
        <div className="flex items-center gap-100">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to ${item.heading}`}
              aria-current={i === active ? 'true' : undefined}
              className={cn(
                'h-[0.3rem] rounded-pill transition-[width,background-color] duration-180 ease-out',
                i === active ? 'w-300 bg-ink' : 'w-100 bg-rule-strong',
              )}
            />
          ))}
        </div>

        {/* Hidden on a phone, where the dots already say it and the row has no
            width to spare. */}
        <p className="hidden whitespace-nowrap font-mono text-xs uppercase tracking-[0.12em] text-ink-muted prose:block">
          {active + 1} of {items.length}
        </p>

        <div className="ms-auto flex items-center gap-100">
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Previous panel"
            className={cn(
              'grid size-400 place-items-center rounded-pill border border-rule-strong text-ink',
              'transition-colors duration-180 ease-out hover:bg-hover disabled:opacity-40',
            )}
          >
            <CaretLeft size={14} weight="regular" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            disabled={active === items.length - 1}
            aria-label="Next panel"
            className={cn(
              'grid size-400 place-items-center rounded-pill border border-rule-strong text-ink',
              'transition-colors duration-180 ease-out hover:bg-hover disabled:opacity-40',
            )}
          >
            <CaretRight size={14} weight="regular" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Announced on landing, so a screen reader gets the same feedback the
          dots give sighted readers. */}
      <p aria-live="polite" className="sr-only">
        Panel {active + 1} of {items.length}: {items[active]?.heading}
      </p>
    </div>
  );
}
