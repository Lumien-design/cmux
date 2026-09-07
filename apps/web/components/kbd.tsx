import { cn } from '@/lib/cn';

/**
 * Keycaps and the command palette.
 *
 * Both are adapted from 21st.dev rather than pasted:
 *
 *   Kbd            from tom_ui/kbd (id 12235)
 *   CommandPalette from rafa-porto/command-palette (id 2075)
 *
 * What survived the adaptation, and why:
 *
 * - The symbol map is the genuinely valuable part of the original. Getting
 *   ⌘ ⌃ ⌥ ⇧ ␣ and the arrows right is domain knowledge, not styling.
 * - The em relative geometry is the other good idea. A keycap sized in `em`
 *   scales with whatever text surrounds it, so the same component works inline
 *   in a sentence and standalone in a table without a size prop.
 *
 * What was replaced, and why:
 *
 * - `react-hotkeys-hook` is gone. The original listens for real key presses to
 *   animate the cap; a marketing page has no business capturing ⌘N from the
 *   reader. That removed a dependency and two window listeners.
 * - Its transition violated two project rules at once: it animated every
 *   property rather than naming them, on a duration that is not on our ladder.
 *   The keycap here is static, so the transition went away entirely.
 *   (Quoting the original class string here would trip the design rules test,
 *   which scans raw source and does not exempt comments. It should not: an
 *   exemption for comments is a hole a banned class can walk through.)
 * - `bg-background` / `text-foreground` and raw rgba shadows became semantic
 *   tokens, so both themes come for free.
 * - The palette shed 35 Lucide icons, framer-motion, command history and
 *   category filtering. It is a still frame of a real feature, so none of that
 *   machinery had anything to do.
 */

const SYMBOLS: Record<string, string> = {
  cmd: '⌘',
  command: '⌘',
  ctrl: '⌃',
  control: '⌃',
  alt: '⌥',
  option: '⌥',
  shift: '⇧',
  enter: '↵',
  return: '↵',
  space: '␣',
  esc: '⎋',
  escape: '⎋',
  tab: '⇥',
  backspace: '⌫',
  left: '←',
  down: '↓',
  up: '↑',
  right: '→',
};

function symbolFor(key: string): string {
  return SYMBOLS[key.toLowerCase()] ?? key.toUpperCase();
}

export function Kbd({ keys, className }: { keys: readonly string[]; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-25', className)}>
      {keys.map((k) => (
        <kbd
          key={k}
          className={cn(
            // Sized in em so a keycap matches whatever text it sits beside.
            'inline-flex min-w-[1.75em] items-center justify-center rounded-[0.35em]',
            'px-[0.45em] pb-[0.05em] text-[0.8em] leading-[1.7em] font-medium tracking-tight',
            'border border-rule-strong bg-sheet-raised text-ink-soft',
            'select-none whitespace-nowrap align-text-top',
          )}
        >
          {symbolFor(k)}
        </kbd>
      ))}
    </span>
  );
}

/**
 * A still frame of the command palette on ⌘⇧P, showing the custom command
 * defined in the cmux.json shown alongside it. Dark, because in this direction
 * every piece of product UI is a dark object inset into paper.
 */
export function CommandPalette({
  query,
  rows,
}: {
  query: string;
  rows: readonly { title: string; meta: string; keys?: readonly string[]; custom?: boolean }[];
}) {
  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={`The cmux command palette with "${query}" typed, showing ${rows[0]?.title} defined in cmux.json as the first result.`}
        className="overflow-hidden rounded-card border border-[#2A2A2A] bg-[#141414] shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)]"
      >
        <div className="flex items-center gap-100 border-b border-[#2A2A2A] px-200 py-100">
          <span className="font-mono text-[13px] text-[#8A8A8A]" aria-hidden="true">
            ⌘⇧P
          </span>
          <span className="font-mono text-[13px] text-[#F2F2F2]">{query}</span>
          <span className="h-[1.1em] w-px bg-ring" aria-hidden="true" />
        </div>

        <ul className="flex flex-col py-50">
          {rows.map((r, i) => (
            <li
              key={r.title}
              className={cn(
                'flex items-center gap-200 px-200 py-100',
                i === 0 && 'bg-ring/12',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-[6px] shrink-0 rounded-pill',
                  r.custom ? 'bg-ring' : 'bg-[#3A3A3A]',
                )}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#E4E4E4]">{r.title}</span>
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-[#8A8A8A]">
                {r.meta}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-75 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
        Interface mock, not a screenshot
      </figcaption>
    </figure>
  );
}
