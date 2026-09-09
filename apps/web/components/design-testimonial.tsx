'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { cn } from '@/lib/cn';
import { testimonials, type Testimonial } from '@/content/testimonials';

/**
 * Testimonial — the editorial single quote treatment.
 *
 * One quote at a time, an oversized index bleeding off the left edge, a rail
 * carrying the section label and a progress line, and the quote itself
 * assembling word by word. Replaces the stagger deck, which put twenty cards on
 * a 600px band and had nowhere to go on a phone.
 *
 * What changed on the way in, and why.
 *
 * The quotes are the real ones, as with everything else on this page. The
 * original ships three invented people at Linear, Vercel and Stripe; those are
 * other companies' names attached to praise they never gave. Our data has no
 * company field either, so the badge carries the source link instead, which is
 * the thing a reader can actually check.
 *
 * Type is Google Sans Flex throughout. The original sets the rail and the badge
 * in mono; here mono is Google Sans Code and belongs to terminal chrome, so
 * using it for prose would say "terminal" where nothing terminal is happening.
 *
 * Quotes are sized by length. The original's are one liners and set at 5xl.
 * Ours run to 245 characters and eight of them carry a translation as well, so
 * the scale steps down as the quote grows rather than overflowing.
 *
 * Motion is on the imported library, `motion`, not framer-motion: it is the
 * same API by the same authors and already in this project, so pulling the old
 * package in would ship two copies of one library.
 *
 * The rotation stops when you point at it or tab into it, and never starts
 * under reduced motion. Content that advances on its own with no way to hold it
 * still is a failure of WCAG 2.2.2, and the whole point of the section is that
 * you get to read it.
 */

/** Long quotes step down the scale rather than overflowing their box. */
const quoteScale = (length: number) =>
  length <= 90
    ? 'text-2xl prose:text-4xl'
    : length <= 180
      ? 'text-xl prose:text-3xl'
      : 'text-lg prose:text-2xl';

/** The host of the citation, as a short label: "x.com" rather than the full URL. */
const sourceLabel = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
};

const ROTATE_MS = 6000;

export function Testimonial({ items = testimonials }: { items?: readonly Testimonial[] }) {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { damping: 25, stiffness: 200 };
  const x = useSpring(mouseX, spring);
  const y = useSpring(mouseY, spring);
  const numberX = useTransform(x, [-200, 200], [-20, 20]);
  const numberY = useTransform(y, [-200, 200], [-10, 10]);

  const go = (delta: number) => setActive((i) => (i + delta + items.length) % items.length);

  useEffect(() => {
    if (reduced || held) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [reduced, held, items.length]);

  const current = items[active];
  if (!current) return null;

  const body = current.original ?? current.quote;

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        if (reduced) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set(e.clientX - (rect.left + rect.width / 2));
        mouseY.set(e.clientY - (rect.top + rect.height / 2));
      }}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
      className="relative isolate w-full overflow-hidden py-500"
    >
      {/* The index, oversized and bled off the left edge. Decoration, so it is
          out of the accessibility tree, and it only appears once there is width
          to bleed into. */}
      <motion.div
        aria-hidden="true"
        style={{ x: numberX, y: numberY }}
        // Far enough out that the root's clip cuts it: the numeral should read
        // as bleeding off the page, not as a grey shape parked behind the text.
        className="pointer-events-none absolute -left-[9rem] top-1/2 hidden -translate-y-1/2 select-none text-[18rem] font-bold leading-none tracking-tight text-ink/[0.04] split:block"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={active}
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="block"
          >
            {String(active + 1).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      <div className="relative flex">
        {/* The rail. Below the prose breakpoint a phone has no width to give a
            vertical label, so it goes and the quote takes the full measure. */}
        <div className="hidden flex-col items-center justify-center border-r border-rule pr-500 prose:flex">
          <span
            className="text-xs uppercase tracking-[0.2em] text-ink-muted"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Testimonials
          </span>
          <div className="relative mt-300 h-300 w-px bg-rule">
            <motion.div
              className="absolute left-0 top-0 w-full origin-top bg-ink"
              animate={{ height: `${((active + 1) / items.length) * 100}%` }}
              transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 prose:pl-500">
          <AnimatePresence mode="wait">
            <motion.a
              key={active}
              href={current.href}
              target="_blank"
              rel="noreferrer noopener"
              initial={{ opacity: 0, x: reduced ? 0 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : 20 }}
              transition={{ duration: reduced ? 0 : 0.24 }}
              className="mb-300 inline-flex items-center gap-50 rounded-pill border border-rule px-100 py-25 text-xs text-ink-muted transition-colors duration-180 ease-out hover:border-rule-strong hover:text-ink"
            >
              <span aria-hidden="true" className="size-[6px] rounded-pill bg-ring" />
              {sourceLabel(current.href)}
            </motion.a>
          </AnimatePresence>

          {/* A floor under the quote, so a short one after a long one does not
              drag the author row up the page mid rotation. */}
          <div className="relative mb-400 min-h-[9rem] prose:min-h-[11rem]">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={active}
                initial="hidden"
                animate="visible"
                exit="exit"
                lang={current.original ? current.lang : undefined}
                className={cn(
                  // Measured in ch so the line length holds at every step of
                  // the scale rather than needing a cap per size.
                  'max-w-[30ch] font-light leading-tight tracking-tight text-ink',
                  quoteScale(body.length),
                )}
              >
                {body.split(' ').map((word, i) => (
                  <motion.span
                    key={`${active}-${i}`}
                    className="mr-[0.28em] inline-block"
                    variants={{
                      hidden: { opacity: 0, y: reduced ? 0 : 20, rotateX: reduced ? 0 : 90 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        // Capped, or a forty word quote would still be
                        // assembling itself when the rotation moves on.
                        transition: {
                          duration: reduced ? 0 : 0.24,
                          delay: reduced ? 0 : Math.min(i * 0.02, 0.9),
                          ease: [0.22, 1, 0.36, 1],
                        },
                      },
                      exit: {
                        opacity: 0,
                        y: reduced ? 0 : -10,
                        transition: { duration: reduced ? 0 : 0.12, delay: reduced ? 0 : Math.min(i * 0.01, 0.2) },
                      },
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {/* The translation, when the quote is not in English. Dropping it
              would quietly erase that this is being adopted in eight languages,
              which is the point those quotes are making. */}
          {current.original ? (
            <AnimatePresence mode="wait">
              <motion.p
                key={active}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.24, delay: reduced ? 0 : 0.18 }}
                className="-mt-300 mb-400 max-w-[var(--container-measure)] text-sm leading-relaxed text-ink-muted"
              >
                {current.quote}
              </motion.p>
            </AnimatePresence>
          ) : null}

          {/* Stacked on a phone. Side by side, the arrows take enough width
              that a two word name wraps and a long role breaks to three lines. */}
          <div className="flex flex-col items-start gap-300 prose:flex-row prose:items-end prose:justify-between">
            <AnimatePresence mode="wait">
              <motion.figcaption
                key={active}
                initial={{ opacity: 0, y: reduced ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : -20 }}
                transition={{ duration: reduced ? 0 : 0.24, delay: reduced ? 0 : 0.12 }}
                className="flex min-w-0 items-center gap-200"
              >
                <motion.span
                  aria-hidden="true"
                  className="hidden h-px w-300 shrink-0 bg-ink prose:block"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.18 }}
                  style={{ originX: 0 }}
                />
                <span className="min-w-0">
                  <span className="block text-base font-medium text-ink">{current.name}</span>
                  {current.title ? (
                    <span className="block text-sm text-ink-muted">{current.title}</span>
                  ) : null}
                </span>
              </motion.figcaption>
            </AnimatePresence>

            <div className="flex shrink-0 items-center gap-100">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous testimonial"
                className="grid size-500 place-items-center rounded-pill border border-rule text-ink transition-colors duration-180 ease-out hover:bg-hover"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M10 12L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next testimonial"
                className="grid size-500 place-items-center rounded-pill border border-rule text-ink transition-colors duration-180 ease-out hover:bg-hover"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {`Testimonial ${active + 1} of ${items.length}. ${current.quote} — ${current.name}`}
      </p>
    </div>
  );
}
