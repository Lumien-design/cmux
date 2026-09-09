import { cn } from '@/lib/cn';

/**
 * Keycaps.
 *
 * Adapted from 21st.dev's tom_ui/kbd (id 12235) rather than pasted. A sibling
 * CommandPalette lived here until the app mock started drawing the palette
 * itself, at which point a second, differently built version of the same UI
 * was two sources of truth for one thing.
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
