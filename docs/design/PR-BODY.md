## What changed

An independent concept redesign of cmux.com as a single landing page, built in the "paper technical" direction: warm paper held inside a dark shell, so the terminal becomes the darkest object on the page instead of dissolving into it like it does on every other terminal site.

Three directions were built as rendered comparisons first, and only the chosen one was implemented.

## Surface

`web`

## Visual proof

| Before | After |
|--------|-------|
| The current cmux.com (light, conventional SaaS structure) | This branch, running locally |

Direction study, all three rendered side by side: [`docs/design/direction-study.html`](docs/design/direction-study.html) — open it in a browser. The reasoning behind the choice is in [`docs/design/cmux-web-rationale.md`](docs/design/cmux-web-rationale.md).

## Design notes

- **Tokens touched:** a new two tier layer in `packages/tokens`. Primitives generate no utilities; semantics live in `@theme inline` and resolve through the runtime primitive, so one declaration themes both modes.
- **Motion:** three sanctioned curves only. Interaction motion 120 to 240ms on `ease-out`; explanatory motion 700 to 900ms on `ease-drawer`. No GSAP, no smooth scroll, no scroll listeners.
- **States covered:** default, hover, focus visible, active, and both themes.

Two decisions worth reviewing:

1. **Light is the default**, rather than following `prefers-color-scheme`. Paper is the argument, and most developers run a dark system, so honouring the OS preference would mean nobody sees the design. A full dark theme exists behind the toggle.
2. **The tagline's dormant words are a token, not an opacity.** The spec asks for 25 to 35 per cent, which measures about 2.6:1 and fails even the large text floor. It is `--color-ink-muted` at 4.8:1 instead.

## Checklist

- [x] Branch name matches `docs/GITFLOW.md` §2 and targets `develop`
- [x] Commits follow Conventional Commits with a surface scope
- [x] Visual proof attached
- [x] Keyboard path works; focus is visible and ordered
- [x] Light and dark both checked
- [x] Respects `prefers-reduced-motion`
- [x] Contrast meets WCAG AA — 125 elements audited per theme, 0 failures
- [x] No secrets, tokens or `.env` values in the diff

## Verification

`lint`, `typecheck`, `test` and `build` all clean at the repo root, which is what CI runs. The test suite is 16 design rule gates (banned typefaces, italics, weight 900, `transition-all`, raw scroll listeners, off ladder durations, background gradients, components reaching past semantic tokens, banned clichés, placeholder text, hyphens in prose, invented round numbers, missing alt text). Verified by injecting four violations and confirming all four were caught.

## Known gaps

Nine image slots are declared at final dimensions with a shot list and composed empty states. Two are filled by a CSS mock of the cmux window, captioned as a mock, because a still image cannot show a notification ring breathing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
