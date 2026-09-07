# cmux

Frontier developer tools, designed end to end across every surface a developer
actually works on.

| Surface | Scope |
|---|---|
| `macos` | cmux for macOS — native, the reference implementation of the interaction model |
| `tui` | cmux TUI — the terminal surface |
| `desktop` | cmux for Windows and Linux |
| `ios` | cmux for iOS |
| `cloud` | cmux Cloud |
| `web` | cmux.com |
| `chatmux` | chatmux |
| `shared` | design system, motion, tokens — the layer that keeps the surfaces one product |

---

## Getting started

```bash
./scripts/gitflow.sh init
```

Enables versioned git hooks, the commit template, and rebase-by-default. Run it
once per clone — git will not pick up `.githooks/` otherwise.

```bash
./scripts/gitflow.sh status
```

## Working

```bash
./scripts/gitflow.sh feature macos split-pane-session-switcher
./scripts/gitflow.sh design  tui   pane-focus-affordance
./scripts/gitflow.sh spike         inline-diff-gutter
./scripts/gitflow.sh publish
```

`./scripts/gitflow.sh help` lists everything.

## Repository layout

```
apps/            one directory per surface
packages/        design-system, motion, tokens — shared across surfaces
docs/            GITFLOW.md and friends
scripts/         gitflow.sh
.githooks/       versioned commit-msg and pre-push hooks
.github/         PR + issue templates, CI
```

`apps/` and `packages/` are the intended shape; surfaces get created as they start.

## Branching

`main` is production. `develop` is integration and the default PR target. Work
happens on `feature/` `fix/` `design/` `spike/` branches; releases go out through
`release/` and `hotfix/`.

Read [`docs/GITFLOW.md`](docs/GITFLOW.md) before your first PR — it is short, and
it is enforced by hooks and CI.

## Contributing

[`CONTRIBUTING.md`](CONTRIBUTING.md). The short version: branch off `develop`,
follow the commit convention, and **attach a before/after visual to anything a user
can see** — a recording if it moves.
