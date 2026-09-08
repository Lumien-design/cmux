## What changed

An independent concept redesign of cmux.com as a single landing page, built in the "paper technical" direction: warm paper held inside a dark shell, so the terminal becomes the darkest object on the page instead of dissolving into it like it does on every other terminal site.

Three directions were built as rendered comparisons first, and only the chosen one was implemented.

## Surface

`web`

## Visual proof

Shot from two local builds running side by side — the previous revision and this one — at identical viewports, so the only difference is the code. Full page strips are at half raster, since what they show is length.

| | Before | After |
|---|---|---|
| Desktop, 1440 by 900 | [10,695px · 11.88 viewports](shots/desktop-light-before.jpg) | [7,818px · 8.69 viewports](shots/desktop-light-after.jpg) |
| Desktop, dark | [before](shots/desktop-dark-before.jpg) | [after](shots/desktop-dark-after.jpg) |
| Mobile, 390 by 844 | [16,218px · 19.22 viewports](shots/mobile-light-before.jpg) | [10,982px · 13.01 viewports](shots/mobile-light-after.jpg) |
| Mobile, dark | [before](shots/mobile-dark-before.jpg) | [after](shots/mobile-dark-after.jpg) |

**A quarter shorter on desktop, a third shorter on a phone**, with more of the product shown rather than less.

Details, at full resolution:

| | |
|---|---|
| Hero | [light](shots/hero-light.png) · [dark](shots/hero-dark.png) |
| The carousel in place | [light](shots/carousel-light.png) · [dark](shots/carousel-dark.png) |
| Panel: attention | [light](shots/panel-attention-light.png) · [dark](shots/panel-attention-dark.png) |
| Panel: programmability | [light](shots/panel-program-light.png) |
| Panel: foundation | [light](shots/panel-foundation-light.png) |
| Questions, two columns | [light](shots/questions-light.png) |

Direction study, all three rendered side by side: [`docs/design/direction-study.html`](direction-study.html) — open it in a browser. The reasoning behind the choice is in [`docs/design/cmux-web-rationale.md`](cmux-web-rationale.md).

## Design notes

- **Tokens touched:** a new two tier layer in `packages/tokens`. Primitives generate no utilities; semantics live in `@theme inline` and resolve through the runtime primitive, so one declaration themes both modes.
- **Motion:** three sanctioned curves only. Interaction motion 120 to 240ms on `ease-out`; explanatory motion 700 to 900ms on `ease-drawer`. No GSAP, no smooth scroll, no scroll listeners.
- **States covered:** default, hover, focus visible, active, disabled, and both themes.
- **Six feature sections are now one horizontal band.** Native scroll snap, no slider library and no scroll listener; the active dot is an IntersectionObserver rooted on the track. One app mock renders all six states, and nothing inside a panel is focusable, so the band has exactly nine tab stops.
- **No section eyebrows.** Seven sections were announcing themselves in small monospace capitals before saying anything. The two that were doing real work moved: the agent strip's label is now the marquee's accessible name, and the mock disclosure is now each window's accessible name.

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
- [x] Contrast meets WCAG AA — audited at 1440, 760 and 390 in both themes; 514, 503 and 465 text carrying elements, 0 failures
- [x] No secrets, tokens or `.env` values in the diff

## Verification

`lint`, `typecheck`, `test` and `build` all clean at the repo root, which is what CI runs. The test suite is 16 design rule gates (banned typefaces, italics, weight 900, `transition-all`, raw scroll listeners, off ladder durations, background gradients, components reaching past semantic tokens, banned clichés, placeholder text, hyphens in prose, invented round numbers, missing alt text). Verified by injecting four violations and confirming all four were caught.

## Known gaps

Every product surface is a CSS mock. The visible caption saying so was removed at the client's request, so the disclosure now lives only in each window's accessible name. That is a real reduction in how plainly the page states it, and it should be a conscious call rather than an oversight. The shot list in `lib/shots.ts` remains as the brief for the real captures that would replace the mocks.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
