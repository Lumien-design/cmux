import Link from 'next/link';
import { site } from '@/content/site';

export default function NotFound() {
  return (
    <div className="p-200 split:p-300">
      <div className="mx-auto min-h-[80svh] rounded-sheet bg-sheet px-400 py-900 split:px-700">
        <div className="mx-auto w-full max-w-[var(--container-page)]">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
            Error 404
          </p>
          <h1 className="mt-200 max-w-[16ch] text-4xl font-semibold leading-[1.05] tracking-tight split:text-6xl">
            No pane here.
          </h1>
          <p className="mt-300 max-w-[46ch] text-lg leading-relaxed text-ink-soft">
            That address does not resolve. The page you wanted may have moved, or it may never
            have existed.
          </p>
          <div className="mt-500 flex flex-wrap gap-100">
            <Link
              href="/"
              className="inline-flex items-center rounded-control bg-ink px-100 py-75 text-base font-semibold text-ink-inverse transition-transform duration-180 ease-out active:scale-[0.98]"
            >
              Back to the start
            </Link>
            <a
              href={site.repo}
              className="inline-flex items-center rounded-control border border-rule-strong px-100 py-75 text-base font-semibold text-ink transition-colors duration-180 ease-out hover:bg-hover"
            >
              View source
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
