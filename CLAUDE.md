# cmux — working notes for Claude

## What this is

A multi-surface developer-tools monorepo: macOS, TUI, Windows/Linux, iOS, Cloud,
cmux.com and chatmux. Design engineering is the centre of gravity — the interaction
model *is* the product, so visual and motion changes are first-class work, not
polish applied afterwards.

## Before changing anything

Read [`docs/GITFLOW.md`](docs/GITFLOW.md). Branch names, commit format and PR
targets are enforced by `.githooks/` and by the `conventions` job in CI — work that
ignores them fails at push, not at review.

- Branch off `develop`, never commit to `main` or `develop` directly.
- `feature|fix|design/<surface>/<slug>`, or `spike/<slug>` for prototypes.
- Commits: `<type>(<surface>): <subject>`.
- Surfaces: `macos` `tui` `desktop` `ios` `cloud` `web` `chatmux` `shared` `repo`.

Use `./scripts/gitflow.sh` rather than raw git for branch creation and releases —
it handles the base branch, the back-merges and the tagging.

## Design work

`design` and `motion` are real commit types here. Use them. A change to easing,
duration, type scale, spacing or colour tokens is a tracked product change, and
tokens are API for every surface — treat a visible token change as a MINOR bump.

Any user-visible change needs a before/after visual in the PR. Anything that moves
needs a recording.

Do not ship a state you have not checked: default, hover, focus, active, disabled,
loading, empty, error — in light and dark, with a keyboard, and under
`prefers-reduced-motion`.

## Skills

A local library of vendored design and motion skills sits in `.claude/skills/`,
gitignored on purpose. It is third-party MIT work by five authors and says nothing
about this repo, so it stays out of the history while remaining available to any
agent working here. Reach for it rather than improvising: `animate` and
`animation-vocabulary` for motion, `apple-design` for native feel,
`better-typography` / `better-colors` / `better-layout` for the 1px layer, and the
MengTo web-design entries as visual reference.

Do not commit that directory, and do not edit an upstream skill in place — a
refresh overwrites local changes.

## Housekeeping

- Never commit `.env`, `*.pem`, `*.key`, `*.mobileprovision` — CI fails the build.
- Files over 10MB fail CI. Use Git LFS.
- `spike/` branches are exempt from CI and commit-format checks by design.
