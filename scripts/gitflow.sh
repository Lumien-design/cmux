#!/usr/bin/env bash
# cmux gitflow helper.  See docs/GITFLOW.md
set -euo pipefail

SURFACES="macos tui desktop ios cloud web chatmux shared repo"
DEV=develop
MAIN=main

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GRN=$'\033[32m'
YEL=$'\033[33m'; CYN=$'\033[36m'; OFF=$'\033[0m'

ok()  { printf '  %s\n' "${GRN}OK${OFF}  $1"; }
say() { printf '  %s\n' "$1"; }
no()  { printf '\n  %sFAIL%s  %s\n\n' "$RED" "$OFF" "$1" >&2; exit 1; }

need_clean() {
  git diff-index --quiet HEAD -- 2>/dev/null \
    || no "Working tree is dirty. Commit or stash first."
}

valid_surface() {
  for s in $SURFACES; do
    [ "$s" = "$1" ] && return 0
  done
  no "Unknown surface '$1'. One of: ${SURFACES// /, }"
}

valid_version() {
  printf '%s' "$1" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$' \
    || no "Version must be MAJOR.MINOR.PATCH (got '$1')."
}

sync_refs() {
  git fetch origin --prune --tags >/dev/null 2>&1 || say "${DIM}(offline - using local refs)${OFF}"
}

start_from() { # $1=base  $2=new branch
  need_clean
  sync_refs
  git show-ref --verify --quiet "refs/heads/$1" || no "Base branch '$1' does not exist."
  git checkout "$1" >/dev/null 2>&1
  git merge --ff-only "origin/$1" >/dev/null 2>&1 || true
  git checkout -b "$2"
  ok "Created ${CYN}${2}${OFF}  (from $1)"
  say "${DIM}Publish with: ./scripts/gitflow.sh publish${OFF}"
}

cmd_init() {
  git config core.hooksPath .githooks
  git config commit.template .gitmessage
  git config pull.ff only
  git config branch.autosetuprebase always
  chmod +x .githooks/* scripts/*.sh 2>/dev/null || true
  ok "Hooks enabled (core.hooksPath = .githooks)"
  ok "Commit template set (.gitmessage)"
  ok "pull.ff=only, rebase-by-default on new branches"
}

cmd_feature() {
  [ $# -ge 2 ] || no "usage: gitflow.sh feature <surface> <slug>"
  valid_surface "$1"
  start_from "$DEV" "feature/$1/$2"
}

cmd_fix() {
  [ $# -ge 2 ] || no "usage: gitflow.sh fix <surface> <slug>"
  valid_surface "$1"
  start_from "$DEV" "fix/$1/$2"
}

cmd_design() {
  [ $# -ge 2 ] || no "usage: gitflow.sh design <surface> <slug>"
  valid_surface "$1"
  start_from "$DEV" "design/$1/$2"
}

cmd_spike() {
  [ $# -ge 1 ] || no "usage: gitflow.sh spike <slug>"
  start_from "$DEV" "spike/$1"
  say ""
  say "${YEL}Spike: no CI gate, no commit-format check.${OFF}"
  say "${YEL}Rewrite as feature/ or design/ before merging - or delete it.${OFF}"
}

cmd_publish() {
  BR=$(git rev-parse --abbrev-ref HEAD)
  case "$BR" in
    "$MAIN"|"$DEV") no "Refusing to publish '$BR' directly." ;;
  esac
  git push -u origin "$BR"
  ok "Pushed $BR"
  if command -v gh >/dev/null 2>&1; then
    TARGET="$DEV"
    case "$BR" in release/*|hotfix/*) TARGET="$MAIN" ;; esac
    say "Opening PR -> $TARGET"
    gh pr create --base "$TARGET" --head "$BR" --fill --web || true
  else
    say "${DIM}Install the GitHub CLI (gh) to open the PR from here.${OFF}"
  fi
}

cmd_release() {
  ACTION="${1:-}"; V="${2:-}"
  case "$ACTION" in
    start)
      valid_version "$V"
      start_from "$DEV" "release/$V"
      say ""
      say "On this branch: bug fixes, CHANGELOG, version bumps only."
      say "No new features - see docs/GITFLOW.md section 4."
      ;;
    finish)
      valid_version "$V"; need_clean; sync_refs
      BR="release/$V"
      git show-ref --verify --quiet "refs/heads/$BR" || no "No branch '$BR'."
      git checkout "$MAIN"
      git merge --no-ff "$BR" -m "chore(repo): release v$V"
      git tag -a "v$V" -m "cmux v$V"
      ok "Merged into $MAIN and tagged v$V"
      git checkout "$DEV"
      git merge --no-ff "$MAIN" -m "chore(repo): back-merge v$V into develop"
      ok "Back-merged into $DEV"
      git branch -d "$BR"
      say ""
      say "Push it:  git push origin $MAIN $DEV --tags"
      ;;
    *) no "usage: gitflow.sh release start|finish <version>" ;;
  esac
}

cmd_hotfix() {
  ACTION="${1:-}"; V="${2:-}"
  case "$ACTION" in
    start)
      valid_version "$V"
      start_from "$MAIN" "hotfix/$V"
      say ""
      say "Fix the incident and nothing else - docs/GITFLOW.md section 5."
      ;;
    finish)
      valid_version "$V"; need_clean; sync_refs
      BR="hotfix/$V"
      git show-ref --verify --quiet "refs/heads/$BR" || no "No branch '$BR'."
      git checkout "$MAIN"
      git merge --no-ff "$BR" -m "fix(repo): hotfix v$V"
      git tag -a "v$V" -m "cmux v$V (hotfix)"
      ok "Merged into $MAIN and tagged v$V"
      git checkout "$DEV"
      git merge --no-ff "$MAIN" -m "chore(repo): back-merge hotfix v$V into develop"
      ok "Back-merged into $DEV"
      git branch -d "$BR"
      say ""
      say "Push it:  git push origin $MAIN $DEV --tags"
      ;;
    *) no "usage: gitflow.sh hotfix start|finish <version>" ;;
  esac
}

cmd_status() {
  HOOKS=$(git config core.hooksPath 2>/dev/null || true)
  [ -n "$HOOKS" ] || HOOKS="${RED}not set - run ./scripts/gitflow.sh init${OFF}"
  DIRTY=$(git diff-index --quiet HEAD -- 2>/dev/null && echo "no" || echo "${YEL}yes${OFF}")
  printf '\n  %scmux repo status%s\n\n' "$BOLD" "$OFF"
  printf '  branch    %s\n' "${CYN}$(git rev-parse --abbrev-ref HEAD)${OFF}"
  printf '  hooks     %s\n' "$HOOKS"
  printf '  upstream  %s\n' "$(git rev-parse --abbrev-ref '@{u}' 2>/dev/null || echo 'none')"
  printf '  dirty     %s\n' "$DIRTY"
  printf '  last tag  %s\n\n' "$(git describe --tags --abbrev=0 2>/dev/null || echo 'none')"
  printf '  %sactive branches%s\n' "$BOLD" "$OFF"
  git for-each-ref --sort=-committerdate refs/heads \
    --format="    ${CYN}%(refname:short)${OFF}  ${DIM}%(committerdate:relative)${OFF}" | head -12
  printf '\n'
}

cmd_prune() {
  sync_refs
  git branch --merged "$DEV" 2>/dev/null \
    | grep -vE "^\*|^\s*(${MAIN}|${DEV})$" \
    | xargs -r git branch -d 2>/dev/null || true
  ok "Deleted local branches already merged into $DEV"
  CUTOFF=$(( $(date +%s) - 2592000 ))
  STALE=$(git for-each-ref --format='%(refname:short) %(committerdate:unix)' refs/heads/spike 2>/dev/null \
    | awk -v cut="$CUTOFF" '$2 < cut {print $1}')
  if [ -n "$STALE" ]; then
    printf '\n  %sSpikes older than 30 days:%s\n' "$YEL" "$OFF"
    printf '    %s\n' $STALE
    printf '\n  Delete with: git branch -D %s\n\n' "$(echo $STALE | tr '\n' ' ')"
  fi
}

usage() {
  printf '\n  %scmux gitflow%s\n\n' "$BOLD" "$OFF"
  printf '  %ssetup%s\n' "$BOLD" "$OFF"
  printf '    init                            enable hooks, template, rebase defaults\n\n'
  printf '  %sstart work%s  %s(branches from develop)%s\n' "$BOLD" "$OFF" "$DIM" "$OFF"
  printf '    feature <surface> <slug>        new capability\n'
  printf '    fix     <surface> <slug>        bug fix\n'
  printf '    design  <surface> <slug>        visual / interaction / motion\n'
  printf '    spike   <slug>                  throwaway prototype, no gates\n\n'
  printf '  %sship%s\n' "$BOLD" "$OFF"
  printf '    publish                         push branch + open PR\n'
  printf '    release start|finish <version>  stabilise, tag, back-merge\n'
  printf '    hotfix  start|finish <version>  urgent fix from main\n\n'
  printf '  %shousekeeping%s\n' "$BOLD" "$OFF"
  printf '    status                          branch, hooks, tags at a glance\n'
  printf '    prune                           delete merged branches, flag stale spikes\n\n'
  printf '  %ssurfaces:%s %s\n' "$DIM" "$OFF" "${SURFACES// /, }"
  printf '  %sdocs:%s     docs/GITFLOW.md\n\n' "$DIM" "$OFF"
}

CMD="${1:-}"; shift || true
case "$CMD" in
  init)              cmd_init "$@" ;;
  feature)           cmd_feature "$@" ;;
  fix)               cmd_fix "$@" ;;
  design)            cmd_design "$@" ;;
  spike)             cmd_spike "$@" ;;
  publish)           cmd_publish "$@" ;;
  release)           cmd_release "$@" ;;
  hotfix)            cmd_hotfix "$@" ;;
  status)            cmd_status "$@" ;;
  prune)             cmd_prune "$@" ;;
  ""|-h|--help|help) usage ;;
  *)                 no "Unknown command '$CMD'. Try: ./scripts/gitflow.sh help" ;;
esac
