import AppKit
import CmuxSidebar
import SwiftUI

@main
enum Entry {
    @MainActor
    static func main() {
        let arguments = CommandLine.arguments
        guard let flag = arguments.firstIndex(of: "--snapshot") else {
            DemoApp.main()
            return
        }
        let path = arguments.indices.contains(flag + 1) ? arguments[flag + 1] : "snapshots"
        let directory = URL(filePath: path, relativeTo: .currentDirectory()).absoluteURL
        do {
            _ = NSApplication.shared // SF Symbols and font lookup need AppKit up.
            try Snapshots.render(to: directory)
            print("Wrote snapshots to \(directory.path)")
        } catch {
            FileHandle.standardError.write(Data("snapshot failed: \(error)\n".utf8))
            exit(1)
        }
    }
}

struct DemoApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var store = SidebarStore(
        workspaces: Scenario.main.workspaces(now: .now),
        selectedID: Scenario.main.initialSelection
    )
    @State private var isSimulating = false

    var body: some Scene {
        Window("cmux", id: "main") {
            DemoWindow(store: store)
                .task(id: isSimulating) {
                    guard isSimulating else { return }
                    await Simulation.run(store)
                }
        }
        .defaultSize(width: 1100, height: 720)
        .commands {
            SidebarCommands(store: store)
            CommandMenu("Demo") {
                ForEach(Scenario.allCases) { scenario in
                    Button(scenario.title) {
                        store.replaceAll(scenario.workspaces(now: .now), selecting: scenario.initialSelection)
                    }
                }
                Divider()
                Toggle("Simulate Activity", isOn: $isSimulating)
                    .keyboardShortcut("r", modifiers: [.command, .option])
            }
        }
    }
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // `swift run` launches a bare executable rather than an app bundle, which
        // starts in the background unless told otherwise.
        NSApp.setActivationPolicy(.regular)
        NSApp.activate()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }
}

struct DemoWindow: View {
    let store: SidebarStore

    var body: some View {
        HStack(spacing: 0) {
            SidebarView(store: store, onNewWorkspace: addWorkspace)
                .zIndex(1) // the rail's name flash overlaps the content
            TerminalPlaceholder(workspace: store.selected)
        }
        .background(Color(white: 30 / 255))
        .navigationTitle(store.selected?.name ?? "cmux")
        .navigationSubtitle(store.selected?.path ?? "")
        .preferredColorScheme(.dark)
        .frame(minWidth: 640, minHeight: 420)
    }

    private func addWorkspace() {
        let number = store.workspaces.count + 1
        store.insert(Workspace(id: UUID().uuidString, name: "workspace-\(number)", path: "~"))
    }
}

/// Stands in for the terminal surface, which this prototype leaves out.
struct TerminalPlaceholder: View {
    let workspace: Workspace?

    var body: some View {
        VStack(spacing: 6) {
            if let workspace {
                Text(workspace.name)
                    .font(.system(size: 13, weight: .medium, design: .monospaced))
                    .foregroundStyle(Color(white: 0.85))
            }
            Text("Terminal surface — not part of this prototype")
                .font(.system(size: 11, design: .monospaced))
                .foregroundStyle(Color(white: 0.55))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// Moves agents between states every few seconds, so reordering, the pulse and
/// the VoiceOver announcement can be checked without real agents.
@MainActor
enum Simulation {
    static func run(_ store: SidebarStore) async {
        while !Task.isCancelled {
            try? await Task.sleep(for: .seconds(4))
            guard !Task.isCancelled else { return }
            step(store)
        }
    }

    private static func step(_ store: SidebarStore) {
        let now = Date.now
        let active = store.workspaces.filter { $0.state != .idle }
        guard let target = active.randomElement() else { return }
        switch target.state {
        case .running:
            store.setState(Bool.random() ? .needsInput(since: now) : .finished(at: now), for: target.id)
        case .needsInput where target.id != store.selectedID:
            store.setState(.running(since: now), for: target.id)
        case .finished, .failed:
            store.setState(.running(since: now), for: target.id)
        default:
            break
        }
    }
}
