import { cn } from '@/lib/cn';

/**
 * A cmux window, drawn in CSS.
 *
 * Two reasons this is not a screenshot. A still image cannot show the ring
 * breathing, which is the single behaviour the product is named for. And in
 * this direction the terminal is the darkest object on a paper page, so it has
 * to hold its own edges at any size rather than being a fixed raster.
 *
 * It is a mock and it is labelled as one. It never claims to be a capture.
 */

type Pane = {
  lines: readonly { text: string; tone?: 'dim' | 'bright' | 'signal' }[];
  /** Draws the notification ring: this pane is waiting on you. */
  waiting?: boolean;
};

type Workspace = {
  name: string;
  meta: string;
  active?: boolean;
  /** The tab lights up when its pane is waiting. */
  waiting?: boolean;
};

const toneClass = {
  dim: 'text-[#8A8A8A]',
  bright: 'text-[#F2F2F2]',
  signal: 'text-[#5AA9FF]',
} as const;

export function CmuxWindow({
  workspaces,
  panes,
  className,
  label,
}: {
  workspaces: readonly Workspace[];
  panes: readonly Pane[];
  className?: string;
  label: string;
}) {
  return (
    <figure className={cn('m-0', className)}>
      <div
        role="img"
        aria-label={label}
        className="grid grid-cols-[104px_1fr] overflow-hidden rounded-card border border-[#2A2A2A] bg-[#141414] font-mono text-[0.56rem]/[1.8] shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)] prose:grid-cols-[136px_1fr] prose:text-xs"
      >
        {/* sidebar */}
        <div className="flex flex-col gap-25 border-r border-[#2A2A2A] bg-[#0E0E0E] py-75">
          <div className="flex gap-50 px-100 pb-75 pt-25" aria-hidden="true">
            <span className="size-[8px] rounded-pill bg-[#2E2E2E]" />
            <span className="size-[8px] rounded-pill bg-[#2E2E2E]" />
            <span className="size-[8px] rounded-pill bg-[#2E2E2E]" />
          </div>
          {workspaces.map((w) => (
            <div
              key={w.name}
              className={cn(
                'mx-50 flex flex-col rounded-[5px] px-75 py-50',
                w.active ? 'bg-[#0A5BB5] text-white' : 'text-[#8A8A8A]',
                w.waiting && !w.active && 'text-[#5AA9FF]',
              )}
            >
              <span className="truncate">{w.name}</span>
              <span
                className={cn('truncate text-[0.5rem]', w.active ? 'text-[#D8E6FA]' : 'text-[#7E7E7E]')}
              >
                {w.meta}
              </span>
            </div>
          ))}
        </div>

        {/* main */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-75 border-b border-[#2A2A2A] px-100 py-75 text-[0.5rem] text-[#8A8A8A]">
            <span>{'>_'}</span>
            <span className="truncate">~</span>
            <span className="ms-auto tracking-widest" aria-hidden="true">
              ▤ ▥
            </span>
          </div>
          <div className={cn('grid min-w-0 flex-1', panes.length > 1 && 'grid-cols-2')}>
            {panes.map((p, i) => (
              <div
                key={i}
                className={cn(
                  'relative min-w-0 px-100 py-100',
                  i > 0 && 'border-s border-[#2A2A2A]',
                )}
              >
                {p.waiting && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-25 rounded-[6px] border-[1.5px] border-ring motion-safe:animate-ring"
                  />
                )}
                {p.lines.map((l, j) => (
                  <div
                    key={j}
                    className={cn('truncate', l.tone ? toneClass[l.tone] : 'text-[#9B9B9B]')}
                  >
                    {l.text}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-75 font-mono text-[0.56rem] uppercase tracking-[0.12em] text-ink-muted">
        Interface mock, not a screenshot
      </figcaption>
    </figure>
  );
}

/** The hero arrangement: one agent mid task, one waiting on you. */
export const heroWindow = {
  label:
    'A cmux window with three workspaces in the sidebar and two terminal panes. The right pane is ringed in blue because its agent is waiting for input.',
  workspaces: [
    { name: 'main', meta: '~/cmux · :3000', active: true },
    { name: 'feat/rings', meta: '~/web · :5173', waiting: true },
    { name: 'docs', meta: '~/docs' },
  ],
  panes: [
    {
      lines: [
        { text: '$ claude', tone: 'dim' as const },
        { text: '› reading tokens.css' },
        { text: '› 41 files changed' },
        { text: '› running tests' },
      ],
    },
    {
      waiting: true,
      lines: [
        { text: '$ codex', tone: 'dim' as const },
        { text: '› migration written' },
        { text: 'Apply to database? (y/n)', tone: 'bright' as const },
        { text: '● waiting for you', tone: 'signal' as const },
      ],
    },
  ],
} as const;
