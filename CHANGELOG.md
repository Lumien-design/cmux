# Changelog

All notable changes to cmux are recorded here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [SemVer](https://semver.org/spec/v2.0.0.html) — see
[`docs/GITFLOW.md`](docs/GITFLOW.md) §4 for how surfaces version independently.

## [Unreleased]

## [0.1.0] - 2026-09-09

### Added
- Gitflow branching model, hooks, PR/issue templates and CI conventions gate.
- Landing page for cmux.com: hero, tool strip, five state panel carousel,
  testimonials, shortcuts, platforms, install, open source, FAQ and footer.
- Lucide marks on the panel points, one per claim.
- Testimonials as a single rotating quote, sourced from the real attributed
  quotes and pausing on hover and focus.

### Changed
- The hero takes the first screen on its own, with the window mock below it.
- The problem section names the cost of not knowing which agent is waiting.

### Fixed
- The dot grid background answers the cursor again. It listened on an element
  that sits behind `main`, so the events never reached it.
- The download button's hover fill covers its corners instead of leaving
  slivers of the face behind.
- Arbitrary media variants no longer emit CSS that Turbopack rejects, which
  had made the dev server fail to compile.
