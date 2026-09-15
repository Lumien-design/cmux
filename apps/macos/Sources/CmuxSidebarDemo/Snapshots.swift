import AppKit
import CmuxSidebar
import SwiftUI

/// `cmux-sidebar-demo --snapshot <dir>` renders each state the redesign
/// specifies to PNG with the clocks frozen, for before/after visuals and for
/// checking against the mockups without screen-recording permission.
@MainActor
enum Snapshots {
    enum Failure: Error {
        case render(String)
    }

    static func render(to directory: URL) throws {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let now = Date(timeIntervalSinceReferenceDate: 800_000_000)

        func shot(
            _ name: String,
            _ scenario: Scenario,
            width: CGFloat? = nil,
            height: CGFloat,
            configure: (SidebarStore) -> Void = { _ in }
        ) throws {
            let store = SidebarStore(
                workspaces: scenario.workspaces(now: now),
                selectedID: scenario.initialSelection,
                now: now,
                announce: { _ in }
            )
            configure(store)
            // A width wider than the sidebar shows what spills past it, on the
            // window's content colour.
            // A close handler, so the ✕ can draw; nothing else shows it.
            let view = SidebarView(store: store, onCloseWorkspace: { _ in })
                .frame(width: width, height: height, alignment: .leading)
                .background(Color(white: 30 / 255))
                .environment(\.sidebarRenderMode, .snapshot(now: now))
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            guard let image = renderer.cgImage,
                  let png = NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])
            else { throw Failure.render(name) }
            try png.write(to: directory.appending(path: "\(name).png"))
        }

        try shot("main", .main, height: 760) { $0.isCommandHeld = true }
        try shot("stress", .stress, height: 940)
        try shot("density-compact", .main, height: 470) { $0.density = .compact }
        try shot("density-expanded", .main, height: 470) { $0.density = .expanded }
        try shot("states", .main, height: 620) { store in
            store.hoveredID = "docs-api"
            store.moveFocus(by: 4) // cursor on `train`, selection stays on `cmux-tui`
        }
        try shot("pinned", .main, height: 620) { $0.togglePin("chatmux") }
        try shot("host", .stress, height: 940) { $0.sortMode = .host }
        try shot("attention-list", .stress, height: 620) { $0.showAttentionList() }
        try shot("triage", .main, height: 620) { store in
            store.sortMode = .triage
            store.moveTriage("perf-bench", before: "cmux-tui")
        }
        try shot("filtered", .stress, height: 470) { $0.filter = "gpu" }
        try shot("no-matches", .main, height: 300) { $0.filter = "zzz" }
        try shot("empty", .empty, height: 300)
        try shot("collapsed", .main, height: 470) { $0.setCollapsed(true) }
        try shot("focus-on-selected", .main, height: 300) { $0.moveFocus(by: 0) }
        try shot("rename", .main, height: 300) { $0.beginRename("fix-ssh") }
        try shot("close-hover", .main, height: 300) { store in
            store.hoveredID = "fix-ssh"
            store.hoveredClockID = "fix-ssh" // pointer on its clock
        }
        try shot("collapsed-hover", .main, width: 240, height: 470) { store in
            store.setCollapsed(true)
            store.hoveredID = "docs-api"
        }
        try shot("collapsed-focus", .main, width: 240, height: 470) { store in
            store.setCollapsed(true)
            store.moveFocus(by: 3) // cursor on `api-migrate`, selection stays on `cmux-tui`
        }
    }
}
