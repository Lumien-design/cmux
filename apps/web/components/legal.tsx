import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { credit } from '@/content/site';

export function LegalPage({
  title,
  body,
  realHref,
  realLabel,
}: {
  title: string;
  body: string;
  realHref: string;
  realLabel: string;
}) {
  return (
    <div className="p-200 split:p-300">
      <div className="paper-grain mx-auto min-h-[80svh] rounded-sheet bg-sheet px-400 py-900 split:px-700">
        <main className="mx-auto w-full max-w-[var(--container-page)]">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted hover:text-ink"
          >
            cmux
          </Link>
          <h1 className="mt-300 text-4xl font-semibold leading-[1.05] tracking-tight">{title}</h1>
          <p className="mt-300 max-w-[62ch] text-lg leading-relaxed text-ink-soft">{body}</p>
          <p className="mt-400">
            <a
              href={realHref}
              className="inline-flex items-center gap-50 text-[15px] font-medium text-signal-text underline underline-offset-4"
            >
              {realLabel}
              <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
            </a>
          </p>
          <p className="mt-600 border-t border-rule pt-300 font-mono text-[11px] leading-relaxed text-ink-muted">
            {credit.text}{' '}
            <a href={credit.href} className="text-ink-soft underline underline-offset-2">
              {credit.author}
            </a>
          </p>
        </main>
      </div>
    </div>
  );
}
