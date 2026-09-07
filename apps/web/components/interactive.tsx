'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { List, X, Copy, Check, Sun, Moon } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { nav, site } from '@/content/site';

/* ═══════════════════════════════════════════════════════════════════════════
   Reveal — scroll entrance
   IntersectionObserver, never a scroll listener.

   The hidden state is applied after mount, so the server rendered markup is
   fully visible. If JavaScript never runs, the page reads normally instead of
   being blank. That is the most common way a scroll reveal site ships broken.
   ═══════════════════════════════════════════════════════════════════════════ */

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion, or no observer support: stay visible, never arm.
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    // Already on screen at mount. Animating it would mean hiding something the
    // reader can already see, so leave it alone.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setArmed(true);

    // Safety net. Nothing on this page may stay invisible because an observer
    // did not fire — a background tab, a throttled frame loop or an unusual
    // root can all swallow the callback. If it has not fired by now, reveal.
    const failsafe = window.setTimeout(() => setShown(true), 3000);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShown(true);
        window.clearTimeout(failsafe);
        io.disconnect(); // fires once
      },
      // threshold 0 rather than a fraction: a section taller than the viewport
      // can never satisfy a fractional threshold against a shrunken root.
      { threshold: 0, rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        // Tailwind v4 sets `translate`, not `transform`, so the transition has
        // to name that property or the movement never animates.
        'transition-[translate,opacity,filter] duration-900 ease-drawer',
        armed && !shown
          ? 'translate-y-700 opacity-0 blur-md'
          : 'translate-y-0 opacity-100 blur-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ThemeToggle
   One mechanism for theming: a data-theme attribute on <html>. No token is
   ever defined behind a media query, so there is nothing to fall out of sync.
   ═══════════════════════════════════════════════════════════════════════════ */

export function ThemeToggle({ className }: { className?: string }) {
  /**
   * No React state here on purpose. The document already holds the theme in
   * its data-theme attribute, so mirroring it into state would create a second
   * source of truth that is wrong for one render after hydration. The icons
   * swap in CSS instead, which also means the correct one is painted before
   * hydration rather than after it.
   */
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('cmux-theme', next);
    } catch {
      /* private mode, or site data blocked. The page still works. */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch colour theme"
      className={cn(
        'grid size-400 place-items-center rounded-pill text-ink-soft',
        'transition-colors duration-180 ease-out hover:bg-hover hover:text-ink',
        className,
      )}
    >
      <Moon size={16} weight="regular" aria-hidden="true" className="dark:hidden" />
      <Sun size={16} weight="regular" aria-hidden="true" className="hidden dark:block" />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IslandNav — floating pill, morphing trigger, full screen overlay
   ═══════════════════════════════════════════════════════════════════════════ */

export function IslandNav() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center p-300">
      <nav
        aria-label="Primary"
        className={cn(
          'pointer-events-auto flex w-full max-w-[var(--container-page)] items-center gap-300',
          'rounded-pill border border-rule bg-sheet-raised/80 px-300 py-75 backdrop-blur-xl',
        )}
      >
        <a href="#top" className="font-mono text-sm font-medium tracking-tight text-ink">
          cmux
        </a>

        <ul className="ms-300 hidden items-center gap-300 split:flex">
          {nav.map((n) => (
            <li key={n.href}>
              <a
                href={n.href}
                className="text-sm text-ink-soft transition-colors duration-180 ease-out hover:text-ink"
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ms-auto flex items-center gap-100">
          <ThemeToggle />
          <a
            href={site.download}
            className={cn(
              'hidden rounded-pill bg-ink px-100 py-75 text-sm font-semibold text-ink-inverse split:inline-block',
              'transition-transform duration-120 ease-out active:scale-[0.98]',
            )}
          >
            Download
          </a>
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="grid size-400 place-items-center rounded-pill text-ink split:hidden"
          >
            <span className="relative block size-[18px]">
              <List
                size={18}
                weight="regular"
                aria-hidden="true"
                className={cn(
                  'absolute inset-0 transition-[transform,opacity] duration-240 ease-out',
                  open ? 'rotate-45 opacity-0' : 'rotate-0 opacity-100',
                )}
              />
              <X
                size={18}
                weight="regular"
                aria-hidden="true"
                className={cn(
                  'absolute inset-0 transition-[transform,opacity] duration-240 ease-out',
                  open ? 'rotate-0 opacity-100' : '-rotate-45 opacity-0',
                )}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* overlay */}
      <div
        id={panelId}
        hidden={!open}
        className="pointer-events-auto fixed inset-0 z-40 bg-shell/90 backdrop-blur-3xl"
      >
        <ul className="flex h-full flex-col justify-center gap-300 px-500">
          {nav.map((n, i) => (
            <li
              key={n.href}
              style={{ transitionDelay: `${100 + i * 50}ms` }}
              className={cn(
                'transition-[transform,opacity] duration-240 ease-out',
                open ? 'translate-y-0 opacity-100' : 'translate-y-100 opacity-0',
              )}
            >
              <a
                href={n.href}
                onClick={() => setOpen(false)}
                className="text-3xl font-semibold tracking-tight text-shell-ink"
              >
                {n.label}
              </a>
            </li>
          ))}
          <li className="mt-300">
            <a
              href={site.repo}
              className="font-mono text-sm uppercase tracking-[0.12em] text-shell-ink/70"
            >
              View source
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CopyCommand — the one place mono is functionally required
   ═══════════════════════════════════════════════════════════════════════════ */

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the text is selectable either way */
    }
  }

  return (
    <div className="flex items-center gap-100 rounded-control border border-rule bg-sheet-sunken px-100 py-75">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] text-ink">
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy: ${command}`}
        className="grid size-400 shrink-0 place-items-center rounded-control text-ink-muted transition-colors duration-180 ease-out hover:bg-hover hover:text-ink"
      >
        {copied ? <Check size={15} weight="regular" /> : <Copy size={15} weight="regular" />}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </div>
  );
}
