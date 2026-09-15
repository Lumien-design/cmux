import SwiftUI

/// Menu-bar commands for the sidebar. Menu items make every shortcut
/// discoverable, and their key equivalents work wherever focus is.
public struct SidebarCommands: Commands {
    private let store: SidebarStore

    public init(store: SidebarStore) {
        self.store = store
    }

    public var body: some Commands {
        CommandGroup(after: .sidebar) {
            Button(store.isCollapsed ? "Expand Sidebar" : "Collapse Sidebar") {
                store.toggleCollapsed()
            }
            .keyboardShortcut("b")
            SortAndDensityPickers(store: store)
            Divider()
        }

        CommandMenu("Workspaces") {
            Button("Filter Workspaces…") { store.requestFilterFocus() }
                .keyboardShortcut("k")

            Divider()

            Button("Next Workspace Needing You") { store.selectNextBlocked() }
                .keyboardShortcut(.tab, modifiers: .option)
                .disabled(store.blockedCount == 0)
            Button("Previous Workspace Needing You") { store.selectNextBlocked(reverse: true) }
                .keyboardShortcut(.tab, modifiers: [.option, .shift])
                .disabled(store.blockedCount == 0)
            Button("Show Everything Needing You") { store.showAttentionList() }
                .disabled(store.blockedCount == 0)

            Divider()

            ForEach(1...9, id: \.self) { number in
                let target = store.shortcutTarget(number)
                Button(target?.name ?? "Workspace \(number)") { store.jump(toShortcut: number) }
                    .keyboardShortcut(KeyEquivalent(Character(String(number))), modifiers: .command)
                    .disabled(target == nil)
            }

            Divider()

            Button("Move Up") { store.moveFocusedInTriage(by: -1) }
                .keyboardShortcut(.upArrow, modifiers: [.command, .option])
                .disabled(store.sortMode != .triage)
            Button("Move Down") { store.moveFocusedInTriage(by: 1) }
                .keyboardShortcut(.downArrow, modifiers: [.command, .option])
                .disabled(store.sortMode != .triage)
            Button("Rename Workspace…") { store.beginRenameFocused() }
                .disabled((store.focusedID ?? store.selectedID) == nil)
            Button(pinTitle) { store.togglePinFocused() }
                .keyboardShortcut("p", modifiers: [.command, .control])
                .disabled((store.focusedID ?? store.selectedID) == nil)
        }
    }

    private var pinTitle: String {
        guard let target = store.workspace(store.focusedID ?? store.selectedID) else { return "Pin Above the Sort" }
        return target.isPinned ? "Unpin \(target.name)" : "Pin \(target.name) Above the Sort"
    }
}
