import {
  Bell,
  Globe,
  MagnifyingGlass,
  SidebarSimple,
  GitBranch,
  HardDrives,
} from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';

/**
 * The cmux window, drawn in CSS.
 *
 * A fusion of two patterns: an app shell with an icon rail, a filterable list
 * pane and a master detail area, plus a prompt input along the bottom. One
 * component renders six states — the hero and five carousel panels — because
 * the geometry has to be identical between them. Five panels that each drew
 * their own window would read as five unrelated pictures rather than one
 * window changing state.
 *
 * Three rules this component is built under.
 *
 * Nothing invented. cmux has no icon rail; that is the app shell pattern's
 * contribution. So every rail icon maps to a shortcut cmux actually documents,
 * and the caption says the whole thing is a mock. Sidebar is Command B, search
 * is Command Shift P, the bell is Command Shift U, the globe is Command Shift
 * L. The prompt bar is `cmux send`. Nothing appears here without a referent.
 *
 * No focusable nodes. The window is role="img", so the prompt input is a div
 * and never an input. A real field inside an image role would be announced as
 * a form control and would be a keyboard trap around nothing. This is also
 * what keeps the carousel safe: no focus can be scrolled out of view inside a
 * snap container, because there is nothing in there to focus.
 *
 * Two hues, no more. Blue means a pane is waiting for you. Green means git or
 * process health. Everything else that wants attention gets a glyph.
 */

export type Tone = 'dim' | 'base' | 'bright' | 'signal' | 'good';
export type Line = { text: string; tone?: Tone };

export type Workspace = {
  name: string;
  path: string;
  branch?: string;
  pr?: { num: string; state: 'open' | 'draft' | 'checks' };
  ports?: readonly string[];
  host?: string;
  group?: string;
  active?: boolean;
  waiting?: boolean;
};

export type RailIcon = 'sidebar' | 'palette' | 'bell' | 'browser';
export type RailItem = { icon: RailIcon; label: string; active?: boolean; badge?: number };

export type BrowserBlock =
  | { kind: 'bar'; w: number }
  | { kind: 'box'; h: number }
  | { kind: 'field'; value: string }
  | { kind: 'cursor'; label: string };

export type Detail =
  | { kind: 'terminal'; title: string; lines: readonly Line[]; waiting?: boolean }
  | { kind: 'browser'; url: string; chip?: string; blocks: readonly BrowserBlock[] }
  | { kind: 'code'; file: string; lines: readonly Line[] }
  | { kind: 'split'; direction: 'row' | 'col'; panes: readonly Detail[] };

export type ShellState = {
  label: string;
  rail?: readonly RailItem[];
  list?: { filter?: string; workspaces: readonly Workspace[] };
  tabs?: readonly { name: string; active?: boolean; waiting?: boolean }[];
  detail: Detail;
  overlay?: {
    query: string;
    rows: readonly { title: string; meta: string; keys?: readonly string[]; custom?: boolean }[];
  };
  aside?: {
    title: string;
    items: readonly { workspace: string; text: string; ago: string; unread?: boolean }[];
  };
  prompt?: { agent: string; value: string };
  /** compact drops the rail, prompt and aside. The hero uses it. */
  density?: 'compact' | 'full';
  caption?: string | false;
};

const tone: Record<Tone, string> = {
  dim: 'text-term-ink-soft',
  base: 'text-term-ink',
  bright: 'text-term-ink-bright',
  signal: 'text-term-signal',
  good: 'text-term-good',
};

const railIcons = {
  sidebar: SidebarSimple,
  palette: MagnifyingGlass,
  bell: Bell,
  browser: Globe,
} as const;

/* ── pieces ──────────────────────────────────────────────────────────────── */

function Lines({ lines }: { lines: readonly Line[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <div key={i} className={cn('truncate', tone[l.tone ?? 'base'])}>
          {l.text}
        </div>
      ))}
    </>
  );
}

function DetailPane({ d }: { d: Detail }) {
  if (d.kind === 'split') {
    return (
      <div
        className={cn(
          'grid min-h-0 min-w-0 flex-1',
          d.direction === 'row' ? 'grid-cols-1 prose:grid-cols-2' : 'grid-rows-1 prose:grid-rows-2',
        )}
      >
        {d.panes.map((p, i) => (
          <div
            key={i}
            className={cn(
              'relative flex min-h-0 min-w-0 flex-col',
              // Below the prose breakpoint a split pane is too narrow to read,
              // so only the first survives. Every panel still tells its story.
              i > 0 && 'hidden prose:flex',
              i > 0 && (d.direction === 'row' ? 'prose:border-s' : 'prose:border-t'),
              i > 0 && 'border-term-rule',
            )}
          >
            <DetailPane d={p} />
          </div>
        ))}
      </div>
    );
  }

  if (d.kind === 'browser') {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-75 border-b border-term-rule bg-term-raised px-100 py-50">
          <span className="text-term-ink-muted" aria-hidden="true">
            ‹ ›
          </span>
          <span className="min-w-0 flex-1 truncate rounded-pill bg-term-sunken px-75 text-term-ink">
            {d.url}
          </span>
          {d.chip && (
            <span className="shrink-0 rounded-pill bg-term-sunken px-75 text-term-ink-muted">
              {d.chip}
            </span>
          )}
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-50 bg-term-raised p-100">
          {d.blocks.map((b, i) =>
            b.kind === 'bar' ? (
              <span
                key={i}
                style={{ width: `${b.w}%` }}
                className="h-[0.3rem] rounded-pill bg-term-rule-strong"
              />
            ) : b.kind === 'box' ? (
              <span
                key={i}
                style={{ height: `${b.h}rem` }}
                className="w-full rounded-[0.2rem] bg-term-sunken"
              />
            ) : b.kind === 'field' ? (
              <span
                key={i}
                className="rounded-[0.2rem] border border-term-rule bg-term px-75 py-25 text-term-ink"
              >
                {b.value}
              </span>
            ) : (
              // The agent's pointer. Ringed, because this is the one thing on
              // the page that means something is acting on its own.
              <span key={i} className="mt-auto flex items-center gap-50 text-term-signal">
                <span className="size-[0.42rem] rounded-pill bg-term-signal motion-safe:animate-ring" />
                {b.label}
              </span>
            ),
          )}
        </div>
      </div>
    );
  }

  if (d.kind === 'code') {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-b border-term-rule bg-term-raised px-100 py-50 text-term-ink-muted">
          {d.file}
        </div>
        <div className="min-h-0 flex-1 bg-term-sunken px-100 py-75">
          <Lines lines={d.lines} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col px-100 py-75">
      {d.waiting && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-25 rounded-[0.3rem] border-[1.5px] border-ring motion-safe:animate-ring"
        />
      )}
      <div className="mb-25 text-term-ink-muted">{d.title}</div>
      <Lines lines={d.lines} />
    </div>
  );
}

function PrChip({ pr, on }: { pr: NonNullable<Workspace['pr']>; on?: boolean }) {
  const glyph = pr.state === 'checks' ? '✓' : pr.state === 'draft' ? '◌' : '●';
  return (
    <span
      className={cn(
        'shrink-0',
        // On a selected row the ink is inherited: the row is already blue, and
        // green or grey on that blue neither reads nor clears contrast.
        on ? '' : pr.state === 'checks' ? 'text-term-good' : 'text-term-ink-muted',
      )}
    >
      {glyph} {pr.num}
    </span>
  );
}

/* ── the shell ───────────────────────────────────────────────────────────── */

export function AppShell({ state, className }: { state: ShellState; className?: string }) {
  const compact = state.density === 'compact';
  const showRail = !compact && state.rail?.length;
  const showAside = !compact && state.aside;

  return (
    <figure className={cn('m-0', className)}>
      <div
        role="img"
        aria-label={state.label}
        className={cn(
          'flex aspect-[4/3] flex-col overflow-hidden rounded-card prose:aspect-[16/10]',
          'border border-term-rule bg-term',
          'font-mono text-[0.5rem]/[1.75] prose:text-[0.6rem]/[1.8] split:text-[0.66rem]/[1.8]',
          'shadow-[0_24px_60px_-20px_rgb(0_0_0/0.55)]',
        )}
      >
        {/* chrome bar spans every column, the way a real title bar does */}
        <div className="flex shrink-0 items-center gap-100 border-b border-term-rule px-100 py-75">
          <span className="flex shrink-0 gap-50" aria-hidden="true">
            <span className="size-[0.42rem] rounded-pill bg-term-rule-strong" />
            <span className="size-[0.42rem] rounded-pill bg-term-rule-strong" />
            <span className="size-[0.42rem] rounded-pill bg-term-rule-strong" />
          </span>

          {state.tabs ? (
            <span className="flex min-w-0 items-center gap-50">
              {state.tabs.map((t) => (
                <span
                  key={t.name}
                  className={cn(
                    'truncate rounded-[0.2rem] px-75 py-25',
                    t.active
                      ? 'bg-term-raised text-term-ink-bright'
                      : t.waiting
                        ? 'text-term-signal'
                        : 'text-term-ink-muted',
                  )}
                >
                  {t.name}
                </span>
              ))}
            </span>
          ) : (
            <span className="truncate text-term-ink-muted">{'>_'} cmux</span>
          )}

          <span className="ms-auto shrink-0 tracking-widest text-term-ink-muted" aria-hidden="true">
            ▤ ▥
          </span>
        </div>

        <div
          className={cn(
            'grid min-h-0 flex-1',
            '[--rail-w:1.8rem] [--list-w:6.5rem] prose:[--list-w:8.5rem] split:[--list-w:10rem] [--aside-w:9.5rem]',
            showRail
              ? 'grid-cols-[var(--list-w)_minmax(0,1fr)] prose:grid-cols-[var(--rail-w)_var(--list-w)_minmax(0,1fr)]'
              : 'grid-cols-[var(--list-w)_minmax(0,1fr)]',
            showAside && 'split:grid-cols-[var(--rail-w)_var(--list-w)_minmax(0,1fr)_var(--aside-w)]',
          )}
        >
          {/* icon rail */}
          {showRail && (
            <div className="hidden flex-col items-center gap-100 border-e border-term-rule bg-term-rail py-100 prose:flex">
              {state.rail!.map((r) => {
                const Icon = railIcons[r.icon];
                return (
                  <span
                    key={r.label}
                    title={r.label}
                    className={cn(
                      'relative grid size-[1.15rem] place-items-center rounded-[0.25rem]',
                      r.active ? 'bg-term-raised text-term-ink-bright' : 'text-term-ink-muted',
                    )}
                  >
                    <Icon size={10} weight="regular" aria-hidden="true" />
                    {r.badge ? (
                      <span className="absolute -end-25 -top-25 grid size-[0.6rem] place-items-center rounded-pill bg-term-selected text-[0.4rem] text-term-on-signal">
                        {r.badge}
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          )}

          {/* filterable workspace list */}
          <div className="flex min-w-0 flex-col gap-25 border-e border-term-rule bg-term-rail py-75">
            {state.list?.filter !== undefined && (
              <div className="mx-50 mb-25 flex items-center gap-50 rounded-[0.25rem] bg-term-sunken px-75 py-25 text-term-ink-muted">
                <MagnifyingGlass size={8} weight="regular" aria-hidden="true" />
                <span className="truncate text-term-ink">{state.list.filter}</span>
              </div>
            )}
            {state.list?.workspaces.map((w, i) => (
              <div key={w.name + i} className="min-w-0">
                {w.group && (
                  <p className="truncate px-100 pb-25 pt-50 uppercase tracking-[0.12em] text-term-ink-muted">
                    {w.group}
                  </p>
                )}
                <div
                  className={cn(
                    'mx-50 flex min-w-0 flex-col rounded-[0.25rem] px-75 py-50',
                    w.active
                      ? 'bg-term-selected text-term-on-signal'
                      : w.waiting
                        ? 'text-term-signal'
                        : 'text-term-ink-soft',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-50">
                    {w.host && <HardDrives size={8} weight="regular" aria-hidden="true" />}
                    <span className="truncate">{w.name}</span>
                    {w.waiting && !w.active && (
                      <span className="ms-auto size-[0.3rem] shrink-0 rounded-pill bg-ring" />
                    )}
                  </span>
                  {w.branch && (
                    <span
                      className={cn(
                        'flex min-w-0 items-center gap-25',
                        w.active ? 'text-term-selected-ink' : 'text-term-ink-muted',
                      )}
                    >
                      <GitBranch size={7} weight="regular" aria-hidden="true" />
                      <span className="truncate">{w.branch}</span>
                      {w.pr && <PrChip pr={w.pr} on={w.active} />}
                    </span>
                  )}
                  <span
                    className={cn(
                      'flex min-w-0 items-center gap-50 truncate',
                      w.active ? 'text-term-selected-ink' : 'text-term-ink-muted',
                    )}
                  >
                    <span className="truncate">{w.path}</span>
                    {w.ports?.map((p) => (
                      <span key={p} className={cn('shrink-0', !w.active && 'text-term-good')}>
                        {p}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* detail area, plus the palette overlay */}
          <div className="relative flex min-h-0 min-w-0 flex-col">
            <DetailPane d={state.detail} />

            {state.overlay && (
              <>
                <span aria-hidden="true" className="absolute inset-0 bg-term/70" />
                <div className="absolute inset-x-200 top-200 overflow-hidden rounded-[0.35rem] border border-term-rule-strong bg-term-raised shadow-[0_12px_32px_-8px_rgb(0_0_0/0.6)]">
                  <div className="flex items-center gap-75 border-b border-term-rule px-100 py-75">
                    <span className="text-term-ink-muted" aria-hidden="true">
                      ⌘⇧P
                    </span>
                    <span className="text-term-ink-bright">{state.overlay.query}</span>
                    <span className="h-[1em] w-px bg-ring" aria-hidden="true" />
                  </div>
                  {state.overlay.rows.map((r, i) => (
                    <div
                      key={r.title}
                      className={cn(
                        'flex items-center gap-75 px-100 py-50',
                        i === 0 && 'bg-ring/12',
                      )}
                    >
                      <span
                        className={cn(
                          'size-[0.3rem] shrink-0 rounded-pill',
                          r.custom ? 'bg-ring' : 'bg-term-rule-strong',
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate text-term-ink-bright">
                        {r.title}
                      </span>
                      {r.keys && (
                        <span className="shrink-0 text-term-ink-muted">
                          {r.keys.join(' ')}
                        </span>
                      )}
                      <span className="shrink-0 uppercase tracking-[0.1em] text-term-ink-muted">
                        {r.meta}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* notification panel */}
          {showAside && (
            <div className="hidden min-w-0 flex-col border-s border-term-rule bg-term-rail split:flex">
              <p className="border-b border-term-rule px-100 py-75 uppercase tracking-[0.12em] text-term-ink-muted">
                {state.aside!.title}
              </p>
              {state.aside!.items.map((it, i) => (
                <div key={i} className="flex min-w-0 flex-col gap-25 px-100 py-75">
                  <span className="flex min-w-0 items-center gap-50">
                    {it.unread && <span className="size-[0.3rem] shrink-0 rounded-pill bg-ring" />}
                    <span className="truncate text-term-ink-bright">{it.workspace}</span>
                    <span className="ms-auto shrink-0 text-term-ink-muted">{it.ago}</span>
                  </span>
                  <span className="truncate text-term-ink-soft">{it.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* prompt bar. A div, never an input — see the header. */}
        {!compact && state.prompt && (
          <div className="flex shrink-0 items-center gap-75 border-t border-term-rule bg-term-raised px-100 py-75">
            <span className="shrink-0 rounded-pill bg-term-sunken px-75 text-term-ink-muted">
              {state.prompt.agent}
            </span>
            <span className="min-w-0 flex-1 truncate text-term-ink-bright">
              {state.prompt.value}
            </span>
            <span className="h-[1em] w-px shrink-0 bg-ring" aria-hidden="true" />
          </div>
        )}
      </div>

      {state.caption !== false && (
        <figcaption className="mt-75 font-mono text-[0.56rem] uppercase tracking-[0.12em]">
          {state.caption ?? 'Interface mock, not a screenshot'}
        </figcaption>
      )}
    </figure>
  );
}
