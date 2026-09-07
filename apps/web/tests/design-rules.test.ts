import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The design rules, as CI gates.
 *
 * A style guide nobody can run is a document that drifts. These turn the parts
 * of the guide that are mechanically checkable into failing builds, so the
 * rules survive contact with a deadline. The parts that need judgement — is the
 * hierarchy right, does the motion mean anything — are not in here, because a
 * regex cannot hold an opinion.
 */

const ROOT = join(import.meta.dirname, '..');
const SOURCE_DIRS = ['app', 'components', 'lib', 'content'];
const CODE_EXT = new Set(['.ts', '.tsx', '.css']);

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (CODE_EXT.has(extname(entry))) acc.push(full);
  }
  return acc;
}

const files = SOURCE_DIRS.flatMap((d) => walk(join(ROOT, d)));
const sources = files.map((f) => ({ file: f.replace(ROOT, '').replace(/\\/g, '/'), text: readFileSync(f, 'utf8') }));

/** Report every offender at once, rather than failing on the first. */
function offenders(pattern: RegExp, skip?: (file: string) => boolean) {
  return sources
    .filter((s) => !skip?.(s.file))
    .flatMap((s) => {
      const hits = s.text.match(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'));
      return hits ? [`${s.file}: ${[...new Set(hits)].join(', ')}`] : [];
    });
}

describe('typography', () => {
  it('uses no banned typeface', () => {
    expect(offenders(/\b(Inter|Roboto|Helvetica|Open Sans)\b/)).toEqual([]);
  });

  it('sets nothing in italic', () => {
    expect(offenders(/\bitalic\b|font-style:\s*italic/)).toEqual([]);
  });

  it('never reaches weight 900', () => {
    expect(offenders(/\bfont-black\b|font-weight:\s*900|font-\[900\]/)).toEqual([]);
  });
});

describe('motion', () => {
  it('never uses transition-all', () => {
    expect(offenders(/\btransition-all\b|transition:\s*all\b/)).toEqual([]);
  });

  it('never listens to raw scroll events', () => {
    // IntersectionObserver or nothing. A scroll listener on the main thread is
    // the single most common cause of janky marketing pages.
    expect(offenders(/addEventListener\(\s*['"]scroll['"]/)).toEqual([]);
  });

  it('keeps every duration on the ladder', () => {
    const ladder = new Set(['120', '180', '240', '700', '900']);
    const bad = sources.flatMap((s) => {
      const hits = s.text.match(/\bduration-(\d+)\b/g) ?? [];
      const off = [...new Set(hits)].filter((h) => !ladder.has(h.replace('duration-', '')));
      return off.length ? [`${s.file}: ${off.join(', ')}`] : [];
    });
    expect(bad).toEqual([]);
  });

  it('uses only the three sanctioned curves', () => {
    // Any bezier written inline is by definition not one of the three tokens.
    expect(offenders(/cubic-bezier\(/, (f) => f.includes('/tokens'))).toEqual([]);
  });
});

describe('surfaces', () => {
  it('puts no gradient in a background', () => {
    // The one sanctioned gradient is on hero text, and this direction does not
    // use even that. Backgrounds are flat.
    expect(offenders(/\bbg-gradient|bg-\[linear-gradient/)).toEqual([]);
  });

  it('references semantic tokens, never raw primitives', () => {
    // A component naming --n-500 has borrowed a value instead of a meaning.
    expect(offenders(/var\(--n-\d{3}\)|var\(--azure-\d{3}\)/, (f) => f.includes('/tokens'))).toEqual(
      [],
    );
  });
});

describe('copy', () => {
  const content = readFileSync(join(ROOT, 'content/site.ts'), 'utf8');

  it('contains no banned marketing cliché', () => {
    const banned = /\b(Elevate|Seamless|Unleash|Next Gen|Game changer|Delve|Tapestry|In the world of)\b/gi;
    expect(content.match(banned)).toBeNull();
  });

  it('contains no placeholder text', () => {
    expect(content.match(/lorem ipsum|John Doe|Acme|TODO|FIXME/gi)).toBeNull();
  });

  it('uses no hyphen inside prose', () => {
    // Rewrite the phrase instead. URLs, shell commands and config keys are
    // exempt, since a hyphen there is part of an identifier and not writing.
    const proseLines = content
      .split('\n')
      .filter((l) => /^\s*(headline|sub|body|heading|note|a|q|text|label):/.test(l))
      .filter((l) => !/https?:\/\/|brew |cmux |~\/|--/.test(l));
    const bad = proseLines.filter((l) => /\w-\w/.test(l));
    expect(bad).toEqual([]);
  });

  it('states no number that is not verifiable', () => {
    // Round marketing numbers are the tell of invented proof. The only figure
    // on this page is the live star count, with a dated fallback.
    const rounded = content.match(/\b(\d{1,3}(,000)+|\d+00%|99\.9+%)\b/g);
    expect(rounded).toBeNull();
  });
});

describe('accessibility', () => {
  it('never removes an outline without replacing it', () => {
    const bad = sources.flatMap((s) => {
      const hits = s.text.match(/outline-none|outline:\s*none/g);
      if (!hits) return [];
      return /outline\s*:\s*\d|outline-\[|focus-visible/.test(s.text) ? [] : [s.file];
    });
    expect(bad).toEqual([]);
  });

  it('gives every image an alt attribute', () => {
    expect(offenders(/<img(?![^>]*\balt=)[^>]*>/)).toEqual([]);
  });

  it('ships a skip link', () => {
    const page = sources.find((s) => s.file.endsWith('app/page.tsx'));
    expect(page?.text).toMatch(/Skip to content/);
  });
});
