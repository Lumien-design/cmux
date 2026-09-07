# cmux — Branching Model

A gitflow adapted for a **multi-surface design-engineering monorepo**. cmux ships
macOS, TUI, Windows/Linux, iOS, Cloud, cmux.com and chatmux out of one tree, so the
model has to answer two questions at once: *what is releasable* and *which surface
does this touch*.

---

## 1. Long-lived branches

| Branch    | Meaning                                     | Protected | Accepts               |
|-----------|---------------------------------------------|-----------|-----------------------|
| `main`    | Production. Every commit is shippable and tagged. | Yes   | `release/*`, `hotfix/*` |
| `develop` | Integration. Default PR target. Always green.     | Yes   | everything else       |

`main` never receives a direct commit. `develop` never receives a direct push —
it moves only through reviewed pull requests.

---

## 2. Short-lived branches

```
feature/<surface>/<slug>     new capability                    → develop
fix/<surface>/<slug>         bug fix                           → develop
design/<surface>/<slug>      visual / interaction / motion     → develop
spike/<slug>                 throwaway prototype, time-boxed   → develop or deleted
release/<version>            stabilise a release               → main, back-merge develop
hotfix/<version>             urgent production fix             → main, back-merge develop
```

### Surfaces

`macos` · `tui` · `desktop` (Windows/Linux) · `ios` · `cloud` · `web` (cmux.com) ·
`chatmux` · `shared` (cross-surface code) · `repo` (tooling, CI, docs)

### Slug rules

Lowercase, hyphenated, describes the outcome — not the implementation.

```
good   feature/macos/split-pane-session-switcher
good   design/tui/pane-focus-affordance
good   fix/ios/keyboard-inset-jump
bad    feature/macos/colley-wip
bad    fix/stuff
```

### `spike/` — the design-engineering escape hatch

Prototypes are how this team thinks. A `spike/` branch is explicitly allowed to be
messy: no CI gate, no review requirement, no conventional-commit enforcement. It
exists to answer a question. When it has an answer, you either **rewrite it** as a
`feature/` or `design/` branch, or you **delete it**. Spikes never merge to
`develop` as-is, and any spike older than 30 days gets pruned.

---

## 3. The everyday loop

```bash
./scripts/gitflow.sh feature macos split-pane-session-switcher   # branch from develop
# ... commit ...
./scripts/gitflow.sh publish                                     # push + open PR
```

Manually, that is:

```bash
git checkout develop && git pull --ff-only
git checkout -b feature/macos/split-pane-session-switcher
git push -u origin feature/macos/split-pane-session-switcher
```

**Integrating `develop` while you work:** rebase, do not merge.

```bash
git fetch origin
git rebase origin/develop
```

Rebasing keeps the branch a clean, reviewable stack. Once a branch has been
reviewed by someone else, stop rebasing and use merge commits instead — rewriting
history under a reviewer is how review comments get orphaned.

**Merging into `develop`:** squash merge. One branch becomes one commit, and
`develop`'s history stays a readable list of changes rather than a list of
keystrokes.

---

## 4. Releases

Releases cut from `develop`, stabilise in isolation, then land on `main`. Feature
work continues on `develop` throughout — that is the whole point of a release
branch.

```bash
./scripts/gitflow.sh release start 1.4.0
```

On the release branch you may only: fix bugs, update the changelog, bump versions,
and update release docs. **No new features.** If a feature is not ready, it ships
next release.

```bash
./scripts/gitflow.sh release finish 1.4.0
```

which merges to `main`, tags it, and back-merges into `develop` so stabilisation
fixes are never lost.

### Versioning

SemVer, `MAJOR.MINOR.PATCH`.

- **Coordinated release** (surfaces ship together): tag `v1.4.0`.
- **Single-surface release**: tag `macos-v1.4.0`, `ios-v2.0.1`, `tui-v0.9.3`.

Surfaces version independently by default. A coordinated tag is reserved for
moments when the surfaces genuinely move as one product.

For design work, treat a visible change in **type scale, spacing scale, color
tokens, or motion curves** as a MINOR bump at minimum — those are API for everyone
building on the system, even though no function signature changed.

---

## 5. Hotfixes

Production is broken. Branch from `main`, not `develop`.

```bash
./scripts/gitflow.sh hotfix start 1.3.1
# ... fix, minimally ...
./scripts/gitflow.sh hotfix finish 1.3.1
```

This merges to `main`, tags, and back-merges into `develop`. The back-merge is not
optional — a hotfix that only lands on `main` gets silently reverted by the next
release.

Scope discipline: a hotfix fixes the incident and nothing else. Cleanups you spot
along the way go in a follow-up `fix/` branch against `develop`.

---

## 6. Commits

[Conventional Commits](https://www.conventionalcommits.org), with a surface as the
scope. Enforced by `.githooks/commit-msg`.

```
<type>(<surface>): <subject>
```

Types: `feat` `fix` `design` `motion` `perf` `a11y` `refactor` `docs` `test`
`build` `ci` `chore` `revert`

`design` and `motion` are non-standard additions and they are deliberate. On a
product where the interaction model *is* the product, "changed the easing curve on
the session switcher" is not a `chore` and it is not a `style` — it deserves to be
findable in the log.

```
feat(macos): add split-pane session switcher
motion(tui): ease pane transitions with 180ms cubic-bezier
design(web): tighten hero type scale to 1.25 ratio
a11y(ios): raise tap targets to 44pt minimum
fix(cloud): retry session handshake on 503
```

Breaking changes get a `!` and a footer:

```
feat(shared)!: rename session token field

BREAKING CHANGE: `sessionId` is now `sessionToken` across all surfaces.
```

---

## 7. Pull requests

- Target `develop` (or `main` only for `release/*` and `hotfix/*`).
- Title follows the commit convention — it becomes the squashed commit subject.
- **Any user-visible change carries a before/after visual.** Screenshot for static
  changes, screen recording for anything that moves. A motion change described in
  prose is not reviewable.
- Green CI, one approval. Two approvals for `release/*` and `hotfix/*`.
- Delete the branch on merge.

---

## 8. Enabling the hooks

Hooks live in `.githooks/` so they are versioned and reviewable. Git does not use
them until you point it there — once per clone:

```bash
git config core.hooksPath .githooks
```

`./scripts/gitflow.sh init` does this for you, along with the commit template.

`commit-msg` validates the conventional-commit format. `pre-push` blocks direct
pushes to `main`/`develop` and rejects non-conforming branch names. Both are
bypassable with `--no-verify` — deliberately. They are guardrails against slips,
not a permission system.
