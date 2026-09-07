'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { ThemeToggle } from '@/components/interactive';
import { navCards, site } from '@/content/site';

/**
 * CardNav — from reactbits, rebuilt without its animation dependency.
 *
 * The original needs GSAP and react-icons. Neither ships here, and the reason
 * is worth stating rather than quietly working around: choosing Motion over
 * GSAP is the single largest architectural decision in this project, made
 * against three skills that mandate GSAP, and documented as such. Pulling GSAP
 * in for one navigation bar would undo it.
 *
 * It turns out no animation library was needed at all. GSAP is doing two jobs
 * here, a height tween on the shell and a staggered rise on the cards, and CSS
 * does both. So this component ships zero animation runtime and the behaviour
 * is the same.
 *
 * The design is faithful: a pill that expands into a panel of grouped cards,
 * a two line trigger that crosses into an X, a CTA that stays reachable while
 * the panel is open.
 *
 * Accessibility the original left out: the panel is labelled and linked to its
 * trigger, Escape closes and returns focus, the rest of the page is inert while
 * it is open, and the whole thing collapses to an instant state change under
 * reduced motion.
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

    // The page behind the panel is not reachable while it is open.
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
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center p-300">
      <div
        className={cn(
          'pointer-events-auto w-full max-w-[var(--container-page)] overflow-hidden',
          'border border-rule bg-sheet-raised/85 backdrop-blur-xl',
          open ? 'rounded-card' : 'rounded-pill',
          'transition-[border-radius] duration-240 ease-out',
        )}
      >
        {/* top bar */}
        <div className="flex h-[44px] items-center gap-300 px-300">
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="grid size-400 shrink-0 place-items-center rounded-pill text-ink"
          >
            <span className="relative block h-[10px] w-[18px]" aria-hidden="true">
              <span
                className={cn(
                  'absolute inset-x-0 top-0 h-[1.5px] origin-center rounded-pill bg-ink',
                  'transition-[transform] duration-240 ease-out',
                  open && 'translate-y-[4.25px] rotate-45',
                )}
              />
              <span
                className={cn(
                  'absolute inset-x-0 bottom-0 h-[1.5px] origin-center rounded-pill bg-ink',
                  'transition-[transform] duration-240 ease-out',
                  open && '-translate-y-[4.25px] -rotate-45',
                )}
              />
            </span>
          </button>

          <a href="#top" className="font-mono text-sm font-medium tracking-tight text-ink">
            cmux
          </a>

          <div className="ms-auto flex items-center gap-100">
            <ThemeToggle />
            <a
              href={site.download}
              className={cn(
                'rounded-pill bg-ink px-100 py-75 text-sm font-semibold text-ink-inverse',
                'transition-[translate] duration-120 ease-out active:translate-y-25',
              )}
            >
              Download
            </a>
          </div>
        </div>

        {/* panel

            Collapsed with grid-template-rows 0fr to 1fr rather than an
            animated height. Motion's height:'auto' left the panel measured at
            zero here while its content was 243px tall, which meant the menu
            reported itself open to assistive technology while showing nothing.
            The grid technique needs no measurement, so there is nothing to get
            wrong: the row resolves to the content's natural height and the
            transition is pure CSS. */}
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
            <div className="grid gap-100 border-t border-rule p-100 prose:grid-cols-3">
              {navCards.map((card, i) => (
                <div
                  key={card.label}
                  style={{ transitionDelay: open ? `${60 + i * 60}ms` : '0ms' }}
                  className={cn(
                    'rounded-control bg-sheet p-300',
                    'transition-[translate,opacity] duration-240 ease-out motion-reduce:transition-none',
                    open ? 'translate-y-0 opacity-100' : 'translate-y-100 opacity-0',
                  )}
                >
                  {/* ink-soft rather than ink-muted: these labels sit on a
                      translucent panel that composites darker than plain paper,
                      which put muted at 4.33:1 against a 4.5 floor. */}
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
                    {card.label}
                  </p>
                  <ul className="mt-200 flex flex-col gap-100">
                    {card.links.map((l) => (
                      <li key={l.label}>
                        <a
                          href={l.href}
                          tabIndex={open ? undefined : -1}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'group inline-flex items-center gap-50 text-[15px] text-ink-soft',
                            'transition-[color] duration-180 ease-out hover:text-ink',
                          )}
                        >
                          <ArrowUpRight
                            size={14}
                            weight="regular"
                            aria-hidden="true"
                            className="text-ink-muted transition-[translate] duration-180 ease-out group-hover:translate-x-25"
                          />
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
