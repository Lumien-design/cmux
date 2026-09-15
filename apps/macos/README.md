# cmux for macOS — workspace sidebar

A native SwiftUI implementation of the attention-first sidebar from the redesign
mockups (`redesign`: Main, Anatomy, States, Density, RailKeys, Stress).
It runs on sample data; the terminal surface is out of scope.

Written from the mockups alone. No code comes from `manaflow-ai/cmux`, which is
GPL-3.0-or-later.

## Run

Needs Swift 6 and macOS 15 (drag-to-scroll uses `ScrollPosition`). The Command Line Tools are enough; Xcode is not required.

```bash
cd apps/macos
swift run cmux-sidebar-demo                       # the prototype
swift run cmux-sidebar-demo --snapshot snapshots  # every state as a PNG, clocks frozen
swift test
```

With only the Command Line Tools, Swift Testing is installed but off the default
search paths, so point `swift test` at it:

```bash
CLT=/Library/Developer/CommandLineTools/Library/Developer
swift test -Xswiftc -F -Xswiftc $CLT/Frameworks \
  -Xlinker -rpath -Xlinker $CLT/Frameworks -Xlinker -rpath -Xlinker $CLT/usr/lib
```

The **Demo** menu switches between the Main and Stress mockup sessions, three
workspaces, and none, and **Simulate Activity** (⌥⌘R) moves agents between states
so reordering, the rail pulse and the VoiceOver announcement can be checked.

## Keyboard

| Keys | Action |
|---|---|
| ⌘1–9 | Jump to the Nth visible row. Hold ⌘ to reveal the index caps. |
| ⌥⇥ / ⌥⇧⇥ | Next / previous workspace blocked on you, longest wait first. |
| ⌘K | Filter by name, branch, path, agent, host or port. ↵ takes the top match. |
| ↑ ↓ | Move the cursor without switching. ↵ commits, ⎋ restores. |
| → ← | Expand / collapse a workspace into its panes. |
| ⌘B | Collapse to the 44pt rail. |
| ⌘⌃P | Pin a workspace above the sort. |
| ⌥⌘↑ / ⌥⌘↓ | In triage, move a workspace up or down. |
| ⌥⌘1–3 | Sort: attention first, triage, by host. |
| ⌃⌘1–3 | Density: compact, comfortable, expanded. |

Both sets sit in **View › Sort** and **View › Density**, with the current choice
checked, and a change is announced to VoiceOver.

**Triage.** A sort option with no sorting: your order, no groups, and nothing
moves or ages out on its own. Click and hold a row, then drag; the rows it passes
scoot out of the way and it settles into the gap. Dragging without holding still
scrolls.

**Bell.** A click jumps to the workspace that has waited longest. Hold it for
0.3s for a list of everything needing you, longest wait first, whatever the
filter or sort: ↑↓ move, ↵ switches, Esc closes.

**Mouse.** Double-click a name to rename it in place: ↵ or clicking away keeps it,
⎋ reverts, and an empty name is refused. Rename is also in the context menu and
the Workspaces menu. Click and drag anywhere in the list or rail to scroll; let go
mid-flick and it coasts. Double-click the empty space under the last row, or under
the last pip in the rail, for a new workspace, as the + does. Point at a row's
clock and a ✕ takes its place; click it to close the workspace, and the row below
takes its place on screen. Close is also in the context menu.

While collapsed, the rail has no names, so one shows beside the pip. Pointing
at a pip shows its name for as long as the pointer stays; a keyboard landing
shows it for 0.8s, then fades. A new name always replaces the old one at once.

## Where it departs from the mockups

- **Contrast.** Several mockup greys measure under 4.5:1 on the surface they sit
  on: group headers and footer `#76787B` (3.9:1), counts `#64666A` (3.0:1),
  keycaps, placeholder and path `#6E7073` (3.5:1), and the context line on a
  selected row `#8A8B8D` on `#2B2E33` (3.9:1). These are lifted to `#808285` and
  `#96979A`. The idle ring `#63656A` (3.0:1, 2.4:1 when selected) becomes
  `#76787B`. The original values are noted in `Theme/SidebarTheme.swift`.
- **Empty state.** The mockup sets `⌘O` and `cmux .` in `#FFB454`. The token rule
  allows two hues inside the window, so they are set in bright ink instead.
- **Failure red.** `#F4796F` is used as the mockups propose, but `--t-bad` is not
  yet in `packages/tokens`.
- **Durations.** The tokens define curves but no durations. Rows settle over
  220ms on `--curve-out`; the rail collapses over 320ms on `--curve-drawer`.
- **Focus ring.** Drawn inside the row and pip rather than at the mockup's 1pt
  outset, which the opaque group headers clipped.
- **Font.** Google Sans Code when installed, SF Mono otherwise.
