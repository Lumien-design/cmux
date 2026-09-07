import { ArrowUpRight, Camera } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { shots } from '@/lib/shots';
import { CmuxWindow, heroWindow } from '@/components/cmux-window';
import { Reveal, CopyCommand } from '@/components/interactive';
import { Kbd, CommandPalette } from '@/components/kbd';
import { ScrubbedTagline, InteractiveCta } from '@/components/magic-cta';
import { DotGridBackground } from '@/components/dot-grid';
import { LogoLoop } from '@/components/logo-loop';
import {
  agents,
  capabilities,
  credit,
  faq,
  finalCta,
  foundation,
  hero,
  install,
  nav,
  openSource,
  palette,
  platforms,
  problem,
  programmable,
  shortcuts,
  site,
  tagline,
} from '@/content/site';

/* ── primitives ─────────────────────────────────────────────────────────── */

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">{children}</p>
  );
}

export function Section({
  id,
  children,
  labelledBy,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  labelledBy?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn('px-400 py-800 split:px-700 split:py-900', className)}
    >
      <div className="mx-auto w-full max-w-[var(--container-page)]">{children}</div>
    </section>
  );
}

function Button({
  href,
  children,
  variant = 'solid',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'solid' | 'quiet';
}) {
  return (
    <a
      href={href}
      className={cn(
        // 8px vertical, 12px horizontal — the mandated control padding.
        'inline-flex items-center gap-50 rounded-control px-100 py-75 text-base font-semibold',
        'transition-[transform,background-color,border-color,color] duration-180 ease-out',
        'active:scale-[0.98]',
        variant === 'solid'
          ? 'bg-ink text-ink-inverse hover:bg-ink/90'
          : 'border border-rule-strong text-ink hover:bg-hover',
      )}
    >
      {children}
    </a>
  );
}

/** The image slot. Owns the aspect ratio so a real capture drops in unchanged. */
function ShotFrame({ id }: { id: string }) {
  const shot = shots[id];
  if (!shot) return null;
  return (
    <div
      className="overflow-hidden rounded-card bg-sheet-sunken shadow-(--shadow-pressed)"
      style={{ aspectRatio: `${shot.w} / ${shot.h}` }}
    >
      <div className="flex h-full flex-col items-start justify-end gap-75 p-300">
        <Camera size={18} weight="regular" className="text-ink-muted" aria-hidden="true" />
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted">
          {shot.id}
        </p>
        <p className="max-w-[42ch] text-sm text-ink-soft">{shot.brief}</p>
      </div>
    </div>
  );
}

/* ── sections ───────────────────────────────────────────────────────────── */

export function Hero({ stars }: { stars: number }) {
  return (
    <section id="top" className="px-400 pb-800 pt-900 split:px-700">
      <div className="mx-auto w-full max-w-[var(--container-page)]">
        <div className="grid items-center gap-600 split:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] split:gap-700">
          <div>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
            {/* 680px measure cap on the heading and its subheading. */}
            <h1 className="mt-200 max-w-[var(--container-measure)] text-4xl font-semibold leading-[1.05] tracking-tight split:text-6xl">
              {hero.headline}
            </h1>
            <p className="mt-300 max-w-[var(--container-measure)] text-lg leading-relaxed text-ink-soft">
              {hero.sub}
            </p>
            <div className="mt-500 flex flex-wrap items-center gap-100">
              <InteractiveCta href={hero.primary.href}>{hero.primary.label}</InteractiveCta>
              <Button href={hero.secondary.href} variant="quiet">
                {hero.secondary.label}
                <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
              </Button>
            </div>
            <p className="mt-400 border-t border-rule pt-200 font-mono text-xs tabular-nums text-ink-muted">
              <span className="text-ink-soft">{stars.toLocaleString('en-US')}</span> stars on GitHub
              &nbsp;·&nbsp; <span className="text-ink-soft">GPL 3.0</span> &nbsp;·&nbsp; Swift and
              AppKit
            </p>
          </div>

          <CmuxWindow
            label={heroWindow.label}
            workspaces={heroWindow.workspaces}
            panes={heroWindow.panes}
          />
        </div>
      </div>
    </section>
  );
}

export function ToolStrip() {
  return (
    <div className="px-400 py-500 split:px-700">
      <div className="mx-auto w-full max-w-[var(--container-page)]">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
          {agents.label}
        </p>
        <LogoLoop className="mt-300" markHeight={1.62} gap={72} speed={40} />
      </div>
    </div>
  );
}

export function Problem() {
  return (
    <Section labelledBy="problem-h">
      <Reveal>
        <div className="max-w-[var(--container-measure)]">
          <h2 id="problem-h" className="text-3xl font-semibold leading-tight tracking-tight">
            {problem.heading}
          </h2>
          <p className="mt-300 text-lg leading-relaxed text-ink-soft">{problem.body}</p>
        </div>
      </Reveal>
    </Section>
  );
}

export function Tagline() {
  return (
    <Section>
      <div className="grid gap-500 split:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] split:items-end">
        <ScrubbedTagline lines={tagline.lines} />
        <div>
          <p className="max-w-[46ch] text-base leading-relaxed text-ink-soft">{tagline.body}</p>
          <p className="mt-200 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
            {tagline.attribution}
          </p>
        </div>
      </div>
    </Section>
  );
}

export function Capabilities() {
  return (
    <>
      {capabilities.map((c) => (
        <Section key={c.id} id={c.id} labelledBy={`${c.id}-h`}>
          <Reveal>
            <div
              className={cn(
                'grid items-center gap-500 split:grid-cols-2 split:gap-700',
                c.reverse && 'split:[&>*:first-child]:order-2',
              )}
            >
              <div>
                <Eyebrow>{c.eyebrow}</Eyebrow>
                <h2
                  id={`${c.id}-h`}
                  className="mt-200 max-w-[18ch] text-3xl font-semibold leading-tight tracking-tight"
                >
                  {c.heading}
                </h2>
                <p className="mt-300 max-w-[52ch] text-base leading-relaxed text-ink-soft">
                  {c.body}
                </p>
                <ul className="mt-400 flex flex-col gap-200 border-t border-rule pt-300">
                  {c.points.map((p) => (
                    <li key={p} className="flex gap-200 text-base text-ink-soft">
                      <span
                        aria-hidden="true"
                        className="mt-[9px] size-[5px] shrink-0 rounded-pill bg-signal-ui"
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* The ring section shows the live mock, because a still image
                  cannot show a ring breathing. The rest take real captures. */}
              {c.id === 'attention' ? (
                <CmuxWindow
                  label={heroWindow.label}
                  workspaces={heroWindow.workspaces}
                  panes={heroWindow.panes}
                />
              ) : (
                <ShotFrame id={c.shot} />
              )}
            </div>
          </Reveal>
        </Section>
      ))}
    </>
  );
}

export function Programmable() {
  return (
    <Section id="program" labelledBy="program-h">
      <Reveal>
        <div className="grid gap-500 split:grid-cols-2 split:gap-700">
          <div>
            <Eyebrow>{programmable.eyebrow}</Eyebrow>
            <h2
              id="program-h"
              className="mt-200 max-w-[18ch] text-3xl font-semibold leading-tight tracking-tight"
            >
              {programmable.heading}
            </h2>
            <p className="mt-300 max-w-[52ch] text-base leading-relaxed text-ink-soft">
              {programmable.body}
            </p>
            <dl className="mt-400 flex flex-col gap-200 border-t border-rule pt-300">
              {programmable.cli.map((c) => (
                <div key={c.cmd} className="flex flex-col gap-25">
                  <dt>
                    <code className="font-mono text-sm text-ink">{c.cmd}</code>
                  </dt>
                  <dd className="text-sm text-ink-muted">{c.note}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Live code, not a screenshot: selectable, searchable, weightless. */}
          <div className="flex flex-col gap-300">
            <div className="overflow-hidden rounded-card bg-sheet-sunken shadow-(--shadow-pressed)">
              <div className="px-300 pb-100 pt-300 font-mono text-xs uppercase tracking-[0.12em] text-ink-muted">
                cmux.json
              </div>
            <pre className="overflow-x-auto p-300 font-mono text-sm/[1.7] text-ink">
                <code>{programmable.config}</code>
              </pre>
            </div>

            {/* The payoff for the config above: that command, in the palette. */}
            <CommandPalette query={palette.query} rows={palette.rows} />
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

export function Shortcuts() {
  return (
    <Section labelledBy="shortcuts-h">
      <Reveal>
        <div className="max-w-[var(--container-measure)]">
          <Eyebrow>{shortcuts.eyebrow}</Eyebrow>
          <h2
            id="shortcuts-h"
            className="mt-200 text-3xl font-semibold leading-tight tracking-tight"
          >
            {shortcuts.heading}
          </h2>
          <p className="mt-300 text-base leading-relaxed text-ink-soft">{shortcuts.body}</p>
        </div>

        <div className="mt-500 grid gap-500 prose:grid-cols-3 prose:gap-400">
          {shortcuts.groups.map((g) => (
            <div key={g.name} className="rounded-card bg-sheet p-300 shadow-(--shadow-raised-sm)">
              <p className="border-b border-rule pb-100 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
                {g.name}
              </p>
              <ul className="flex flex-col">
                {g.items.map((it) => (
                  <li
                    key={it.label}
                    className="flex items-baseline justify-between gap-200 border-b border-rule py-200"
                  >
                    <span className="text-base text-ink-soft">{it.label}</span>
                    <Kbd keys={it.keys} className="shrink-0" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

export function Foundation() {
  return (
    <Section labelledBy="foundation-h" className="relative isolate overflow-hidden">
      {/* A GPU drawn, cursor reactive canvas, in the section about GPU drawn
          rendering. It inherits its colour from this token, so both themes
          work without the canvas knowing a theme exists.

          This wrapper must stay hit testable. The grid takes its stage from
          canvas.parentElement and attaches the pointer listeners there, so
          pointer-events-none here silently kills the cursor response and
          leaves the dots merely breathing. The canvas sets pointerEvents none
          on itself, which is what keeps clicks passing through. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 text-rule-strong">
        <DotGridBackground />
      </div>
      <Reveal>
        <div className="grid gap-500 split:grid-cols-2 split:gap-700">
          <div>
            <Eyebrow>{foundation.eyebrow}</Eyebrow>
            <h2
              id="foundation-h"
              className="mt-200 max-w-[20ch] text-3xl font-semibold leading-tight tracking-tight"
            >
              {foundation.heading}
            </h2>
            <p className="mt-300 max-w-[52ch] text-base leading-relaxed text-ink-soft">
              {foundation.body}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-300 self-start">
            {foundation.facts.map((f) => (
              <div
                key={f.k}
                className="rounded-card bg-sheet p-300 shadow-(--shadow-raised-sm)"
              >
                <dt className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted">
                  {f.k}
                </dt>
                <dd className="mt-75 text-base font-medium text-ink">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </Section>
  );
}

export function Platforms() {
  return (
    <Section labelledBy="platforms-h">
      <Reveal>
        <h2 id="platforms-h" className="text-3xl font-semibold leading-tight tracking-tight">
          {platforms.heading}
        </h2>
        <ul className="mt-400 flex flex-col gap-200">
          {platforms.rows.map((r) => (
            <li
              key={r.name}
              className="flex flex-wrap items-baseline gap-x-300 gap-y-75 rounded-card bg-sheet px-300 py-300 shadow-(--shadow-raised-sm)"
            >
              <span className="min-w-[10rem] text-base font-medium text-ink">{r.name}</span>
              <span className="rounded-pill border border-rule-strong px-75 py-0 font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                {r.state}
              </span>
              <span className="text-sm text-ink-muted">{r.note}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}

export function Install() {
  return (
    <Section labelledBy="install-h">
      <Reveal>
        <div className="grid gap-500 split:grid-cols-2 split:gap-700">
          <div>
            <Eyebrow>{install.eyebrow}</Eyebrow>
            <h2
              id="install-h"
              className="mt-200 text-3xl font-semibold leading-tight tracking-tight"
            >
              {install.heading}
            </h2>
            <p className="mt-300 max-w-[46ch] text-base leading-relaxed text-ink-soft">
              {install.dmg}
            </p>
            <div className="mt-400">
              <Button href={site.download}>Download for Mac</Button>
            </div>
          </div>
          <div className="self-center">
            <p className="mb-200 font-mono text-xs uppercase tracking-[0.12em] text-ink-muted">
              Or with Homebrew
            </p>
            <CopyCommand command={install.brew} />
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

export function OpenSource() {
  return (
    <Section id="open-source" labelledBy="os-h">
      <Reveal>
        <div className="max-w-[var(--container-measure)]">
          <Eyebrow>{openSource.eyebrow}</Eyebrow>
          <h2 id="os-h" className="mt-200 text-3xl font-semibold leading-tight tracking-tight">
            {openSource.heading}
          </h2>
          <p className="mt-300 text-lg leading-relaxed text-ink-soft">{openSource.body}</p>
          <div className="mt-400 flex flex-wrap gap-100">
            <Button href={site.repo} variant="quiet">
              Read the source
              <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
            </Button>
            <Button href={site.discord} variant="quiet">
              Join the Discord
              <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

export function Faq() {
  return (
    <Section id="faq" labelledBy="faq-h">
      <h2 id="faq-h" className="text-3xl font-semibold leading-tight tracking-tight">
        Questions
      </h2>
      <div className="mt-400">
        {faq.map((f) => (
          <details key={f.q} className="group border-t border-rule">
            <summary className="flex cursor-pointer list-none items-baseline gap-200 py-300 text-lg font-medium text-ink [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden="true"
                className="mt-[2px] font-mono text-ink-muted transition-transform duration-180 ease-out group-open:rotate-45"
              >
                +
              </span>
              {f.q}
            </summary>
            <p className="max-w-[62ch] pb-300 ps-[1.6rem] text-base leading-relaxed text-ink-soft">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function FinalCta() {
  return (
    <Section labelledBy="cta-h">
      <div className="flex flex-col items-start gap-300">
        <h2 id="cta-h" className="text-4xl font-semibold leading-[1.05] tracking-tight split:text-5xl">
          {finalCta.heading}
        </h2>
        <p className="text-lg text-ink-soft">{finalCta.body}</p>
        <div className="mt-200 flex flex-wrap gap-100">
          <InteractiveCta href={hero.primary.href}>{hero.primary.label}</InteractiveCta>
          <Button href={hero.secondary.href} variant="quiet">
            {hero.secondary.label}
            <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-rule px-400 py-600 split:px-700">
      <div className="mx-auto flex w-full max-w-[var(--container-page)] flex-col gap-400">
        <div className="flex flex-wrap gap-x-600 gap-y-300">
          <nav aria-label="Sections" className="flex flex-wrap gap-x-400 gap-y-100">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="text-sm text-ink-soft hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Elsewhere" className="flex flex-wrap gap-x-400 gap-y-100">
            <a href={site.repo} className="text-sm text-ink-soft hover:text-ink">
              GitHub
            </a>
            <a href={site.docs} className="text-sm text-ink-soft hover:text-ink">
              Docs
            </a>
            <a href={site.discord} className="text-sm text-ink-soft hover:text-ink">
              Discord
            </a>
            <a href={`mailto:${site.email}`} className="text-sm text-ink-soft hover:text-ink">
              Email
            </a>
          </nav>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-400 gap-y-100">
            <a href="/privacy" className="text-sm text-ink-soft hover:text-ink">
              Privacy
            </a>
            <a href="/terms" className="text-sm text-ink-soft hover:text-ink">
              Terms
            </a>
          </nav>
        </div>

        {/* Honest about what this is, quietly. */}
        <p className="border-t border-rule pt-300 font-mono text-xs leading-relaxed text-ink-muted">
          {credit.text}{' '}
          <a href={credit.href} className="text-ink-soft underline underline-offset-2">
            {credit.author}
          </a>
        </p>
      </div>
    </footer>
  );
}
