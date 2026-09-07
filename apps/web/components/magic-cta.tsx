'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';

/* ═══════════════════════════════════════════════════════════════════════════
   ScrubbedTagline — from magic-text, adapted

   The supplied version is a genuine improvement on what was here. My tagline
   lit each word on a timer once the block crossed a trigger; this ties word
   opacity directly to scroll position, so the reader drives the reveal instead
   of watching it play. The spec asks for words resolving "as they cross a
   trigger line", and scrubbing is the more literal reading of that.

   One thing did not survive. The original renders the dormant word at
   `opacity-20`, which measures about 2.2:1 against this ground and fails even
   the large text floor — and a reader who never scrolls the section into range
   sees only that state. The dormant colour is a token here instead, measured at
   4.8:1. The effect looks the same and the floor passes.

   Structure is preserved too: the dim word stays in the flow and the lit word
   is absolutely positioned over it, so nothing reflows as opacity changes.
   ═══════════════════════════════════════════════════════════════════════════ */

function Word({
  children,
  progress,
  range,
  reduced,
}: {
  children: string;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  range: [number, number];
  reduced: boolean;
}) {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className="relative me-[0.25em] inline-block">
      {/* Dormant: a token, not an opacity. Readable on its own. */}
      <span className="text-ink-muted" aria-hidden="true">
        {children}
      </span>
      <motion.span
        aria-hidden="true"
        style={reduced ? { opacity: 1 } : { opacity }}
        className="absolute inset-0 text-ink"
      >
        {children}
      </motion.span>
    </span>
  );
}

export function ScrubbedTagline({ lines }: { lines: readonly string[] }) {
  const container = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start 0.9', 'start 0.35'],
  });

  const words = lines.flatMap((line, li) =>
    line.split(' ').map((w, wi) => ({ w, key: `${li}-${wi}`, br: wi === 0 && li > 0 })),
  );

  return (
    <p
      ref={container}
      // The visible text for assistive technology and for copy and paste. The
      // animated spans above are aria-hidden so the sentence is announced once.
      aria-label={lines.join(' ')}
      className="max-w-[var(--container-measure)] text-4xl font-semibold leading-[1.15] tracking-tight split:text-6xl"
    >
      {words.map((w, i) => (
        <span key={w.key}>
          {w.br && <br />}
          <Word
            progress={scrollYProgress}
            range={[i / words.length, (i + 1) / words.length]}
            reduced={reduced}
          >
            {w.w}
          </Word>
        </span>
      ))}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   InteractiveCta — from interactive-hover-button, adapted

   Replaced wholesale: `lucide-react` for Phosphor, shadcn's bg-background and
   bg-primary for semantic tokens, `w-32` for content width (32 is not on the
   spacing ladder and would not have compiled), 300ms for the ladder's 240ms,
   and the animate-everything transition for named properties.

   The mechanic is inverted. The original expands a coloured disc across a light
   button; here the button is already ink, and a paper disc floods across it and
   inverts the label. That keeps blue meaning one thing on this page — a pane
   needs you — instead of spending it on a hover state.

   Gated behind hover and fine pointer, so a touch device gets a plain button
   rather than a state it can never leave.
   ═══════════════════════════════════════════════════════════════════════════ */

export function InteractiveCta({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        'group relative isolate inline-flex items-center justify-center overflow-hidden',
        'rounded-control px-100 py-75 text-[15px] font-semibold',
        'bg-ink text-ink-inverse',
        'transition-[translate] duration-240 ease-out active:translate-y-25',
        className,
      )}
    >
      {/* The flood. Starts as a dot, becomes the whole button. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -z-10 rounded-pill bg-sheet-raised',
          'left-[18%] top-[45%] size-[8px] opacity-0',
          'transition-[left,top,width,height,opacity] duration-240 ease-out',
          'motion-reduce:transition-none',
          '[@media(hover:hover)and(pointer:fine)]:group-hover:left-0',
          '[@media(hover:hover)and(pointer:fine)]:group-hover:top-0',
          '[@media(hover:hover)and(pointer:fine)]:group-hover:size-full',
          '[@media(hover:hover)and(pointer:fine)]:group-hover:opacity-100',
        )}
      />
      <span className="inline-flex items-center gap-50 transition-[color] duration-240 ease-out [@media(hover:hover)and(pointer:fine)]:group-hover:text-ink">
        {children}
        <ArrowRight
          size={15}
          weight="regular"
          aria-hidden="true"
          className={cn(
            'transition-[translate] duration-240 ease-out',
            '[@media(hover:hover)and(pointer:fine)]:group-hover:translate-x-25',
          )}
        />
      </span>
    </a>
  );
}
