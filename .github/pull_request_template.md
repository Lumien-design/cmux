<!-- Title must follow: <type>(<surface>): <subject>  — it becomes the squashed commit. -->

## What changed

<!-- One paragraph. What does this do, and why now? -->

## Surface

<!-- Delete what does not apply. -->
`macos` · `tui` · `desktop` · `ios` · `cloud` · `web` · `chatmux` · `shared` · `repo`

## Visual proof

<!--
REQUIRED for any user-visible change.
- Static change  → before / after screenshots
- Anything that moves → screen recording (a described easing curve is not reviewable)
- No user-visible change → write "n/a — internal only"
-->

| Before | After |
|--------|-------|
|        |       |

## Design notes

<!-- Only for design / motion PRs; delete otherwise. -->
- **Tokens touched:** <!-- spacing, type scale, color, radius, elevation -->
- **Motion:** <!-- duration, easing, what triggers it, what interrupts it -->
- **States covered:** <!-- default, hover, focus, active, disabled, loading, empty, error -->

## Checklist

- [ ] Branch name matches `docs/GITFLOW.md` §2 and targets `develop`
- [ ] Commits follow Conventional Commits with a surface scope
- [ ] Visual proof attached (or explicitly marked n/a)
- [ ] Keyboard path works; focus is visible and ordered
- [ ] Light and dark both checked
- [ ] Respects `prefers-reduced-motion` (if anything animates)
- [ ] Contrast meets WCAG AA
- [ ] No secrets, tokens or `.env` values in the diff

## Related

<!-- Closes #123 / Refs #456 -->
