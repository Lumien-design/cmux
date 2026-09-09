import { proofFallback } from '@/content/site';

/**
 * The only proof number on the page, so it has to be real.
 *
 * Fetched at build time and revalidated daily. A hardcoded count goes stale on
 * a page someone may open weeks from now, which reads exactly like the invented
 * metrics the copy rules ban. If GitHub is unreachable the checked in floor is
 * used instead, and it is a number that was genuinely verified on the date
 * recorded beside it.
 */
export async function getStars(): Promise<number> {
  try {
    const res = await fetch('https://api.github.com/repos/manaflow-ai/cmux', {
      next: { revalidate: 86_400 },
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return proofFallback.stars;
    const data: unknown = await res.json();
    const count =
      typeof data === 'object' && data !== null && 'stargazers_count' in data
        ? (data as { stargazers_count: unknown }).stargazers_count
        : null;
    return typeof count === 'number' && count > 0 ? count : proofFallback.stars;
  } catch {
    return proofFallback.stars;
  }
}
