import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { AppShell } from '@/components/app-shell';
import { PanelCarousel } from '@/components/panel-carousel';
import { Reveal, CopyCommand } from '@/components/interactive';
import { Kbd } from '@/components/kbd';
import { ScrubbedTagline, InteractiveCta } from '@/components/magic-cta';
import { LogoLoop } from '@/components/logo-loop';
import { TestimonialWall } from '@/components/testimonial-wall';
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
  panels,
  platforms,
  problem,
  programmable,
  shortcuts,
  site,
  tagline,
} from '@/content/site';
import { heroShell, panelShells } from '@/content/shell';
import { testimonialSection } from '@/content/testimonials';

/* ── primitives ─────────────────────────────────────────────────────────── */

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


/* ── sections ───────────────────────────────────────────────────────────── */

export function Hero({ stars }: { stars: number }) {
  return (
    <section id="top" className="px-400 pb-800 pt-900 split:px-700">
      <div className="mx-auto w-full max-w-[var(--container-page)]">
        <div className="grid items-center gap-600 split:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] split:gap-700">
          <div>
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

          <AppShell state={heroShell} className="text-ink-muted" />
        </div>
      </div>
    </section>
  );
}

export function ToolStrip() {
  return (
    <div className="px-400 py-500 split:px-700">
      <div
        className="mx-auto w-full max-w-[var(--container-page)]"
        role="group"
        aria-label={agents.label}
      >
        <LogoLoop markHeight={1.62} gap={72} speed={40} />
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
        </div>
      </div>
    </Section>
  );
}


/**
 * One panel: the claim on the left, the window in that state on the right.
 *
 * Dark in both themes, and a step lighter than the window it holds, so the
 * stack reads sheet, then stage, then terminal. The heading is an h3 under the
 * section's h2, which keeps the outline honest now that five sections have
 * become five panels.
 */
function Panel({
  id,
  eyebrow,
  heading,
  points,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  points: readonly string[];
}) {
  const state = panelShells[id];
  if (!state) return null;
  return (
    <div className="flex h-full flex-col gap-300 rounded-card border border-stage-rule bg-stage p-300 prose:gap-400 prose:p-500 split:gap-500 split:p-600">
      <div className="split:grid split:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] split:items-end split:gap-600">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-stage-ink-muted split:col-span-2">
          {eyebrow}
        </p>
        <h3 className="mt-100 max-w-[18ch] text-xl font-semibold leading-tight tracking-tight text-stage-ink prose:mt-200 prose:text-2xl split:text-3xl">
          {heading}
        </h3>
        <ul className="mt-200 flex flex-col gap-100 border-t border-stage-rule pt-200 prose:mt-300 prose:gap-200 prose:pt-300 split:mt-0 split:border-0 split:pt-0">
          {points.map((pt) => (
            <li key={pt} className="flex gap-100 text-sm text-stage-ink-soft prose:gap-200 prose:text-base">
              <span
                aria-hidden="true"
                className="mt-[8px] size-[5px] shrink-0 rounded-pill bg-ring prose:mt-[9px]"
              />
              {pt}
            </li>
          ))}
        </ul>
      </div>

      {/* The caption is suppressed per panel and stated once under the whole
          carousel instead. Five copies of the same disclaimer is noise; one is
          the disclosure. */}
      <AppShell state={{ ...state, caption: false }} />
    </div>
  );
}

/**
 * Five feature sections, collapsed into one band.
 *
 * They used to be five full height stacked sections, three of which rendered
 * an empty placeholder and one of which repeated the hero's window verbatim.
 * Sideways, they cost one screen instead of five, every one of them shows real
 * interface, and the features that were previously only named in a bullet have
 * somewhere to actually appear.
 */
export function Panels() {
  const items = [
    ...capabilities.map((c) => ({
      id: c.id,
      heading: c.heading,
      content: <Panel id={c.id} eyebrow={c.eyebrow} heading={c.heading} points={c.points} />,
    })),
    {
      id: 'program',
      heading: programmable.heading,
      content: (
        <Panel
          id="program"
          eyebrow={programmable.eyebrow}
          heading={programmable.heading}
          points={programmable.points}
        />
      ),
    },
    {
      id: 'foundation',
      heading: foundation.heading,
      content: (
        <Panel
          id="foundation"
          eyebrow={foundation.eyebrow}
          heading={foundation.heading}
          points={foundation.facts.map((f) => f.v)}
        />
      ),
    },
  ];

  return (
    <Section labelledBy="panels-h">
      <Reveal>
        <div className="max-w-[var(--container-measure)]">
          <h2
            id="panels-h"
            className="mt-200 text-3xl font-semibold leading-tight tracking-tight"
          >
            {panels.heading}
          </h2>
          <p className="mt-200 text-base text-ink-muted">{panels.body}</p>
        </div>
      </Reveal>

      <PanelCarousel items={items} label={panels.label} />
    </Section>
  );
}

export function Testimonials() {
  return (
    <Section labelledBy="testimonials-h">
      <div className="max-w-[var(--container-measure)]">
        <h2
          id="testimonials-h"
          className="mt-200 text-3xl font-semibold leading-tight tracking-tight"
        >
          {testimonialSection.heading}
        </h2>
        <p className="mt-200 text-base text-ink-muted">{testimonialSection.note}</p>
      </div>
      {/* Fixed height, as the component expects: the wall is a window onto a
          plane, not a block that grows with its content. */}
      <div className="mt-500 h-[600px]">
        <TestimonialWall />
      </div>
    </Section>
  );
}


export function Shortcuts() {
  return (
    <Section id="shortcuts" labelledBy="shortcuts-h">
      <Reveal>
        <div className="max-w-[var(--container-measure)]">
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
            <div key={g.name} className="rounded-card bg-panel p-300">
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
              className="flex flex-wrap items-baseline gap-x-300 gap-y-75 rounded-card bg-panel px-300 py-300"
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
        <div className="mx-auto max-w-[var(--container-measure)] text-center">
          <h2 id="os-h" className="text-3xl font-semibold leading-tight tracking-tight">
            {openSource.heading}
          </h2>
          <p className="mt-300 text-lg leading-relaxed text-ink-soft">{openSource.body}</p>
          <div className="mt-400 flex flex-wrap justify-center gap-100">
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
      <div className="mt-400 grid gap-x-600 prose:grid-cols-2">
        {faq.map((f) => (
          <details key={f.q} className="group h-fit border-t border-rule">
            <summary className="flex cursor-pointer list-none items-baseline gap-200 py-300 text-lg font-medium text-ink [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden="true"
                className="mt-[2px] font-mono text-ink-muted transition-transform duration-180 ease-out group-open:rotate-45"
              >
                +
              </span>
              {f.q}
            </summary>
            <p className="pb-300 ps-[1.6rem] text-base leading-relaxed text-ink-soft">
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
      <div className="flex flex-col items-center gap-300 text-center">
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
