# cmux.com — design rationale

An independent concept redesign of cmux.com. Not affiliated with cmux.

---

## The brief I set myself

cmux.com already exists and works. A redesign that only repaints it would prove
nothing, so I looked for an argument the current site does not make.

The product's own philosophy is the sharpest thing about it: *"cmux is a
primitive, not a solution."* Meanwhile the nearest competitor, Warp, has moved
to "open infrastructure for cloud software factories" — enterprise, platform
shaped, a lot of surface area. That contrast is free, real, and the page should
use it. cmux is local, native, unopinionated, and you can read all of it.

Three constraints followed from the fact that this goes to the team who built
the thing:

1. **Nothing invented.** Every number, feature name, shortcut and URL on the
   page is verifiable. One fabricated statistic discredits the whole piece, and
   the people reviewing it know the product better than I do.
2. **Familiar structure, unfamiliar surface.** A developer should be able to
   scan the page without learning it. The distinctiveness belongs in the visual
   system, not in making people hunt for the download button.
3. **The 1px layer is the argument.** Tokens, type, motion and states are the
   deliverable as much as the page is.

---

## Two things the app screenshot changed

**The in-app tagline beats the website's.** The app's welcome screen says *"the
open source terminal built for coding agents."* The site says *"The terminal
built for multitasking, organization, and programmability."* The first names an
audience; the second lists features. The page leads with the first.

**Blue is functional, not decorative.** In the app, the selected workspace row
and the notification rings are the same blue. So on the site blue means exactly
one thing — *a pane needs you* — and takes no other job. That is why the token
is called `--color-ring` rather than `--color-accent`: it is named for its
meaning, and a component that wants "a nice blue" has nowhere to reach.

---

## Three directions, and why C

I built all three as rendered comparisons rather than descriptions, because a
direction you cannot look at is a paragraph, not a choice. They are in this
repo at [`direction-study.html`](direction-study.html); open it in a browser.

| | A · Diagnostic | B · Documentary | C · Paper |
|---|---|---|---|
| Density | High | Low | Medium |
| Hierarchy from | Brightness and line weight | Scale contrast | Figure and ground |
| Product reads as | Diagram | Artefact | Specimen |
| Differentiation | Moderate | Highest | High |
| Execution risk | Low | High | Medium |

**C won on a structural argument, not a stylistic one.** Every terminal product
site is dark, showing dark screenshots, where the screenshot dissolves into the
page and the product stops being an object. Putting warm paper inside a dark
shell inverts figure and ground: the terminal becomes the darkest thing on
screen and cannot be looked away from. It also keeps continuity with cmux's
existing light brand, so it reads as a considered redesign rather than a
repaint.

A was the safe answer and lives near Linear and Vercel — fluency, not taste. B
was the most memorable and the most likely to miss: it is built for
photography-led agency sites, and its compressed display face would have forced
an exception to the font rules for a reason that is about voice rather than
need.

---

## Where the skills disagreed

The repo carries a vendored library of design skills, and on the central
question they contradict each other. `landing-page-design` mandates Tailwind
with Framer Motion and IntersectionObserver, and bans raw scroll listeners.
`build-awwwards-quality-sites` mandates GSAP as the primary animation system
plus one smooth-scroll engine. `cinematic-gsap-lenis-motion-system` hard
requires GSAP with Lenis and ScrollTrigger. You cannot follow all three.

**I took the `landing-page-design` lane.** Reasons, in order: it is the skill the
repo's own index designates for cmux.com; smooth-scroll hijacking on a developer
tool site is a taste liability, since developers navigate with keyboards and
anchors; and `no-ai-design-slop` independently lists smooth scroll inside its
"motion theater" cluster. I kept the validation discipline from
`build-awwwards-quality-sites` — asset provenance, a complete first frame
without JavaScript, reduced motion, a production build gate — and dropped its
GSAP mandate. Stating that deviation is the point; hiding it would be the
problem.

Two smaller conflicts resolved the same way:

- **Fonts.** Geist and Geist Mono. Mono is functionally justified for a terminal
  product, but the slop catalogue warns that "tiny monospaced labels make
  ordinary content pretend to be technical", so mono is confined to terminal
  content, shell commands, config and metadata. Never marketing copy.
- **Backgrounds.** Flat, no gradients, and the dark values come only from the
  sanctioned set. `#131209` — the one warm value in that set — became the shell,
  which is the reason this direction can exist inside the rules at all.

---

## The token system

Two tiers, and the separation is load bearing.

**Primitives** are plain custom properties. They generate no utilities, so
nothing can reach them by accident. The neutral ramp inverts by name between
themes, which means every semantic token is written exactly once and both themes
stay in sync structurally rather than by discipline.

**Semantics** live in `@theme inline`, so they generate utilities *and* resolve
through the runtime primitive. `bg-sheet` compiles to `var(--n-050)`, which is
paper in light and `#181818` in dark, from a single declaration.

Names were chosen so the call site reads as English — `bg-sheet`, `text-ink`,
`border-rule`. A token whose utility reads `bg-bg-sheet` has been named twice.
"Ink on sheet" is also the vocabulary the direction is built from, so the code
and the design describe the same object.

Three decisions worth calling out:

**The spacing ladder is enforced structurally, not by lint.** `--spacing:
initial` deletes Tailwind's dynamic scale, so `p-5`, `gap-9` and `w-11` stop
compiling. Off-ladder spacing is impossible rather than discouraged. The side
effect is that `translate-*` and `size-*` take ladder names too, so
`translate-y-700` is 64px.

**Overriding `--ease-out` is the highest-leverage line in the file.** Tailwind's
built-in `ease-out` is `cubic-bezier(0, 0, 0.2, 1)`, which is too weak.
Redefining it in `@theme` means every `ease-out` anyone writes is the correct
curve, and the wrong one becomes unreachable rather than merely discouraged.

**I added no line-height tokens, deliberately.** `better-typography` wants
headings near 1.1; `landing-page-design` requires snapping to Tailwind's default
scale and forbids custom line heights alongside it. Tailwind's pairing already
lands inside the target for body text, so the correct move was to add nothing.
"I wrote no tokens here, and here is why" is the harder call than adding them.

### Motion, reconciled by tier

`landing-page-design` mandates 700ms transitions. `animate` caps UI motion at
300ms. They are not actually in conflict once you split by role, and `animate`
says so itself: marketing and explanatory motion may run longer.

| Beat | Duration | Curve | Used for |
|---|---|---|---|
| press | 120ms | ease-out | button feedback |
| hover | 180ms | ease-out | colour and small state |
| overlay | 240ms | ease-out | nav overlay, hamburger morph |
| reveal | 700ms | ease-drawer | the mandated marketing transition |
| scroll | 900ms | ease-drawer | section entrance |

Both skills name `cubic-bezier(0.32, 0.72, 0, 1)` as the right curve for the
long beats, so they agree about more than they appear to. And where
`landing-page-design` writes `transition-all duration-700`, I took its curve and
`animate`'s property discipline: `transition-[translate,opacity,filter]`. Both
intents survive.

---

## Accessibility, where it changed the design

Three places where measuring changed a decision rather than confirming it.

**The tagline's dormant state.** The spec asks for words at 25 to 35 per cent
opacity before they resolve. White at 30 per cent on this ground computes to
about **2.6:1** — failing even the 3:1 large-text floor. Worse, someone who
never scrolls the section past its trigger only ever sees that state. So the
dormant state is a **token** (`--color-ink-muted`, **4.8:1**) rather than a raw
opacity. The effect is visually near identical and the floor passes. The
accessibility rule outranks the literal value.

**The signal blue is split by ground.** `#0A84FF` measures 2.72:1 on the sunken
paper surface, below the 3:1 needed for a UI mark. Rather than change the hue —
which would have cost the "this is the product's real colour" argument — the
light theme steps one notch darker to `#0A74E0` (3.41:1). Contrast is fixed by
moving lightness, not hue. The ring itself stays `#0A84FF`, because it only ever
appears inside the terminal window, which is dark in both themes and measures
5.05:1 there.

**The shell had to leave the ramp.** The neutral ramp inverts by name between
themes, which is what lets every semantic token be written once. That works for
every surface except the frame: inverting `--n-950` made the shell white in dark
mode, so the page gained a white border and the nav overlay put dark text on it.
The shell is not a step on a ramp, it is "the darkest thing on screen" in both
themes, so it and its text sit outside the inversion as their own primitives. I
found this by auditing contrast in both themes rather than by looking at it,
which is the argument for auditing.

**Light is the default, and that is a deliberate call.** Paper is the whole
argument, and most developers run a dark system, so honouring
`prefers-color-scheme` here would mean almost nobody ever sees the design. A
complete dark theme exists, the toggle is in the nav, and an explicit choice is
remembered and always wins.

Everything else is table stakes and was built in rather than retrofitted: a skip
link as the first focusable node, visible focus rings, DOM order matching visual
order even in reversed layouts, native `<details>` for the FAQ instead of a div
with ARIA, and no positive `tabindex` anywhere.

### The scroll reveal failure nobody tests for

Server-rendered markup is fully visible; the hidden state is applied after
mount. So if JavaScript never runs, the page reads normally instead of being
blank.

That is the usual advice, and it is not sufficient. While building this I hit
the real failure: in a throttled or unpainted tab, `IntersectionObserver`
callbacks never fire, and every revealed section stays at `opacity: 0`
permanently. The observer had not crashed — it simply had not been called.

So each reveal carries a three-second failsafe that shows the content
regardless, elements already on screen at mount never arm at all, and the
threshold is `0` rather than a fraction, because a section taller than the
viewport can never satisfy a fractional threshold against a shrunken root.
Nothing on this page can stay invisible because an observer did not fire.

---

## What is deliberately absent

- **No logo wall.** No verified partnership exists. Five agent names set as text
  is honest specificity; borrowed logos would be borrowed credibility.
- **No testimonials.** I have no real quote, and inventing one is disqualifying.
  The social-proof slot is occupied by the licence and the public repository,
  which is the actual proof for an open-source tool.
- **No pricing table.** The product is free. A section that exists only to make
  a page feel complete is the definition of filler.
- **No fake terminal cursor, no pulsing status dots, no decorative browser
  chrome.** These are the exact reflexes a terminal site reaches for, and the
  slop catalogue names every one of them.

The only figure on the page is the GitHub star count, fetched at build time and
revalidated daily, with a dated fallback checked into the repo. A hardcoded
number goes stale on a page someone opens weeks later, which reads exactly like
the invented metrics the rules ban.

---

## On 21st.dev

Five components on this page started life in the 21st.dev catalogue or were
handed to me as exports. None of them were pasted, and that is the interesting
part rather than a caveat.

A typical registry component assumes a different system to this one. Between
the five, they arrived carrying Inter, Lucide icons, `bg-primary` and
`bg-background`, transitions that animate every property, durations off the
ladder, and `w-32`, which does not compile here at all because the spacing
scale was deleted. Pasting any of them would have failed the design rules test
on the first run. So each was taken apart and the good half kept:

| Source | Kept | Replaced |
|---|---|---|
| `tom_ui/kbd` | The ⌘ ⌃ ⌥ ⇧ symbol map, and keycaps sized in `em` so they scale with surrounding text | `react-hotkeys-hook`, which captured real key presses; the transition |
| `rafa-porto/command-palette` | The layout: query line, grouped rows, source on the right | 35 Lucide icons, framer-motion, command history, category filters |
| `magic-text` | Scroll-scrubbed word opacity, which is better than what I had | `opacity-20` for dormant words, at roughly 2.2:1 |
| Dot grid jig | All of it. DPR clamp, ResizeObserver, pointer smoothing, reduced-motion freeze | Nothing; added off-screen pausing and token-driven colour |
| Interactive hover button | The flood mechanic | Lucide, shadcn tokens, `w-32`, 300ms, animate-everything |

Two of those swaps were accessibility, not taste. The magic-text dormant word
at 20% opacity measures about 2.2:1 and fails even the large-text floor, and a
reader who never scrolls the section into range sees only that state; it is a
token here, measured 5.93:1 at 60px. The hover button expanded a coloured disc,
which on this page would have meant blue doing a second job — so the flood is
paper instead, and blue keeps meaning that a pane needs you.

Each also had to earn a place rather than be dropped somewhere. The dot grid
sits behind the section about GPU accelerated rendering, where a cursor
reactive canvas demonstrates the claim; anywhere else it would be the
decorative grid the slop catalogue warns about. The palette sits directly
beside the `cmux.json` whose command it is showing, closing a gap where the
section described something and then showed nothing.

### What the audit caught afterwards

Adding them surfaced three contrast failures I had already shipped, which is
the argument for auditing rather than looking:

- The palette meta text and the terminal mock greys ran 2.5 to 3.6:1.
- White on the bright blue selected row was 3.65:1. The fill now steps darker
  while the notification ring keeps the product blue, since a ring is a
  graphical object needing 3:1 and a filled row carrying text needs 4.5:1.

The reason these survived the first pass is worth recording: my original audit
selected semantic elements — `p`, `li`, `h2`, `code` — and both mocks are built
from `div`s, so it walked straight past them and reported a clean sweep. It now
checks every leaf node carrying text, including the ones marked `aria-hidden`,
because a sighted reader sees those whether or not a screen reader announces
them. 211 elements per theme, zero failures in both.

A gate that only inspects the parts you remembered to name is not a gate.

## What is not finished

**The screenshots.** Nine image slots are declared at final dimensions with a
shot list, and the frame owns the aspect ratio, so real captures drop in without
touching layout. Until they exist, each slot renders a composed empty state
naming what belongs there — never a grey box, never stock imagery.

Two slots are filled today by a **CSS mock of the cmux window**, captioned as a
mock on the page. That is not a placeholder standing in for a screenshot: a
still image cannot show a notification ring breathing, which is the one
behaviour the product is named for. The most valuable capture would be a real
ring firing while an agent waits.

**The design-rules test suite is the part I would keep.** Sixteen checks turn
the parts of the guide that are mechanically verifiable into failing builds:
banned typefaces, italics, weight 900, `transition-all`, raw scroll listeners,
off-ladder durations, background gradients, components reaching past semantic
tokens into primitives, banned marketing clichés, placeholder text, hyphens in
prose, round invented numbers, and missing alt text. I verified it by injecting
four violations and confirming it caught all four with file and offender named.

A style guide nobody can run is a document that drifts.
