# Contributing to cmux

## Once per clone

```bash
./scripts/gitflow.sh init
```

Enables the versioned hooks, the commit template, and rebase-by-default. Without
it the hooks in `.githooks/` are inert — git does not read that directory on its own.

## The loop

```bash
./scripts/gitflow.sh feature macos split-pane-session-switcher
# ... work, commit ...
./scripts/gitflow.sh publish
```

Branches come off `develop`. PRs go back into `develop`. Only `release/*` and
`hotfix/*` ever touch `main`.

| Doing | Branch |
|---|---|
| New capability | `feature/<surface>/<slug>` |
| Bug fix | `fix/<surface>/<slug>` |
| Visual, interaction or motion change | `design/<surface>/<slug>` |
| Throwaway prototype | `spike/<slug>` |

Surfaces: `macos` `tui` `desktop` `ios` `cloud` `web` `chatmux` `shared` `repo`

Full model: [`docs/GITFLOW.md`](docs/GITFLOW.md).

## Commits

```
<type>(<surface>): <subject>
```

`feat` `fix` `design` `motion` `perf` `a11y` `refactor` `docs` `test` `build` `ci`
`chore` `revert` — enforced by `.githooks/commit-msg`.

`design` and `motion` exist because on this product the interaction model *is* the
product. An easing-curve change is not a `chore`.

## What a reviewable PR looks like

The one rule worth repeating: **any user-visible change carries a before/after
visual.** Screenshot for static work, screen recording for anything that moves. A
motion change described in words cannot be reviewed, and reviewing it by pulling
the branch does not scale.

Beyond that, the PR template's checklist is the bar: keyboard path, focus order,
light and dark, reduced motion, WCAG AA contrast, and the loading/empty/error
states — not just the happy path.

## Prototypes

`spike/` branches are exempt from CI, commit-format checks and review. That is
deliberate: a prototype that has to argue with tooling is a prototype that does not
get built. When a spike has answered its question, rewrite it as a `feature/` or
`design/` branch, or delete it. Spikes never merge as-is, and `./scripts/gitflow.sh prune`
flags any older than 30 days.

## Skills

`.claude/skills/` may hold a local library of vendored design and motion skills for
agents working in this repo. It is gitignored: third-party work, useful locally,
not part of this project's history. Never commit it.
