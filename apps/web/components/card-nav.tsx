'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { ThemeToggle } from '@/components/interactive';
import { navCards, site } from '@/content/site';

/**
 * CardNav — reactbits, implemented to its actual spec.
 *
 * My first pass drifted a long way from the original, so this one follows
 * CardNav.css rather than my memory of it:
 *
 *   container   90% wide, capped at 800px, centred, floating from the top
 *   shell       one rounded rectangle at 0.75rem that grows in height, with
 *               overflow hidden, so the panel is revealed rather than dropped
 *   top bar     fixed height row: trigger left, wordmark absolutely centred,
 *               call to action right
 *   trigger     two 30px lines that translate 4px and rotate into a cross
 *   panel       cards side by side, each flex 1, label at the top and links
 *               pushed to the bottom with margin-top auto
 *   narrow      wordmark moves leading, trigger moves trailing, CTA drops,
 *               cards stack
 *
 * Two deliberate departures, both behavioural rather than visual:
 *
 * - Fixed rather than absolute. The original sits at the top of a demo page
 *   and scrolls away; on a page this long that is a regression.
 * - The height is a grid-template-rows collapse, not an animated height.
 *   Motion's height:'auto' measured this panel at zero while it held 243px of
 *   content, which announced the menu as open while showing nothing.
 *
 * Colour follows the page rather than the original's per-card palette. The last
 * card is ink, which does the job those contrasting card colours were doing:
 * giving the panel a terminus instead of three equal blocks.
 */

export function CardNav() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);

    const main = document.getElementById('main');
    const footer = document.querySelector('footer');
    main?.setAttribute('inert', '');
    footer?.setAttribute('inert', '');

    return () => {
      document.removeEventListener('keydown', onKey);
      main?.removeAttribute('inert');
      footer?.removeAttribute('inert');
    };
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-400 z-50 flex justify-center px-300">
      {/* 90% wide, capped at 800px — a compact floating bar, not a full width rail. */}
      <div
        className={cn(
          'pointer-events-auto w-[90%] max-w-[50rem] overflow-hidden',
          'rounded-[0.75rem] border border-rule bg-sheet-raised/90 backdrop-blur-xl',
          'shadow-[0_4px_18px_-6px_rgb(0_0_0/0.18)]',
        )}
      >
        {/* ── top bar ─────────────────────────────────────────────────────── */}
        <div className="relative flex h-[3.4rem] items-center justify-between ps-300 pe-75">
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="order-2 flex h-full cursor-pointer flex-col items-center justify-center gap-[6px] px-50 prose:order-none"
          >
            <span
              aria-hidden="true"
              className={cn(
                'block h-[2px] w-[1.6rem] origin-center rounded-pill bg-ink',
                'transition-[transform] duration-240 ease-out motion-reduce:transition-none',
                open && 'translate-y-[4px] rotate-45',
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                'block h-[2px] w-[1.6rem] origin-center rounded-pill bg-ink',
                'transition-[transform] duration-240 ease-out motion-reduce:transition-none',
                open && '-translate-y-[4px] -rotate-45',
              )}
            />
          </button>

          {/* Centred on wide screens, leading on narrow ones — as the original. */}
          <a
            href="#top"
            className={cn(
              'order-1 font-mono text-lg font-medium tracking-tight text-ink prose:order-none',
              'prose:absolute prose:left-1/2 prose:top-1/2 prose:-translate-x-1/2 prose:-translate-y-1/2',
            )}
          >
            cmux
          </a>

          <div className="order-3 flex items-center gap-75 prose:order-none">
            <ThemeToggle />
            <a
              href={site.download}
              className={cn(
                'hidden h-[2.4rem] items-center rounded-[0.4rem] bg-ink px-200 text-base font-medium text-ink-inverse prose:inline-flex',
                'transition-[translate] duration-120 ease-out active:translate-y-25',
              )}
            >
              Download
            </a>
          </div>
        </div>

        {/* ── panel ───────────────────────────────────────────────────────── */}
        <div
          id={panelId}
          role="group"
          aria-label="Sections"
          aria-hidden={!open}
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-240 ease-out',
            'motion-reduce:transition-none',
            open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-col items-stretch gap-75 p-75 prose:flex-row">
              {navCards.map((card, i) => {
                const terminal = i === navCards.length - 1;
                return (
                  <div
                    key={card.label}
                    style={{ transitionDelay: open ? `${60 + i * 60}ms` : '0ms' }}
                    className={cn(
                      'flex min-w-0 flex-1 flex-col rounded-[0.55rem] px-200 py-200',
                      'transition-[translate,opacity] duration-240 ease-out motion-reduce:transition-none',
                      open ? 'translate-y-0 opacity-100' : 'translate-y-100 opacity-0',
                      terminal ? 'bg-ink' : 'bg-sheet-sunken',
                    )}
                  >
                    {/* Label first, at the weight and size the original sets. */}
                    <p
                      className={cn(
                        'text-xl font-normal tracking-[-0.5px]',
                        terminal ? 'text-ink-inverse' : 'text-ink',
                      )}
                    >
                      {card.label}
                    </p>

                    {/* margin-top auto: links sit against the bottom edge. */}
                    <ul className="mt-auto flex flex-col gap-25 pt-300">
                      {card.links.map((l) => (
                        <li key={l.label}>
                          <a
                            href={l.href}
                            tabIndex={open ? undefined : -1}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'inline-flex items-center gap-50 text-base',
                              'transition-[opacity] duration-240 ease-out hover:opacity-75',
                              terminal ? 'text-ink-inverse' : 'text-ink-soft',
                            )}
                          >
                            <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
                            {l.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
