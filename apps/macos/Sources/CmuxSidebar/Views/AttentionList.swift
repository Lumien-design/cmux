import SwiftUI

/// The bell. A click jumps to the workspace that has waited longest, as ⌥⇥
/// does; holding it for 0.3s opens the list of everything needing you.
struct AttentionBell: View {
    @Bindable var store: SidebarStore
    @Environment(\.isEnabled) private var isEnabled
    @State private var isPressed = false
    @State private var isHovered = false

    private static let holdToOpen = 0.3

    var body: some View {
        let isOpen = store.isAttentionListShown
        Image(systemName: isOpen ? "bell.fill" : "bell")
            .font(.system(size: 11))
            .foregroundStyle(isPressed || isOpen ? Palette.nameSelected : Palette.meta)
            .frame(width: 22, height: 22)
            .background(fill, in: RoundedRectangle(cornerRadius: 5))
            .opacity(isEnabled ? 1 : 0.4)
            .overlay(alignment: .topTrailing) {
                if store.blockedCount > 0 {
                    CountBadge(count: store.blockedCount)
                        .offset(x: 3, y: -2)
                        .allowsHitTesting(false)
                }
            }
            .contentShape(Rectangle())
            .onHover { isHovered = $0 }
            // The hold is attached first so it outranks the click: a press that
            // lasts 0.3s opens the list and never also jumps.
            .onLongPressGesture(minimumDuration: Self.holdToOpen, maximumDistance: 6) {
                store.showAttentionList()
            } onPressingChanged: { pressing in
                isPressed = pressing
            }
            .onTapGesture { store.selectNextBlocked() }
            .popover(isPresented: $store.isAttentionListShown, arrowEdge: .bottom) {
                AttentionList(store: store)
                    .presentationBackground(Palette.rail)
            }
            .help(label + "  ⌥⇥ · hold for the full list")
            .accessibilityElement()
            .accessibilityLabel(label)
            .accessibilityAddTraits(.isButton)
            .accessibilityAction { store.selectNextBlocked() }
            .accessibilityAction(named: "Show everything needing you") { store.showAttentionList() }
    }

    private var fill: Color {
        if isPressed || store.isAttentionListShown { return Palette.selected }
        return isHovered && isEnabled ? Palette.hover : .clear
    }

    private var label: String {
        switch store.blockedCount {
        case 0: return "Nothing needs you"
        case 1: return "Next workspace needing you (1)"
        case let count: return "Next workspace needing you (\(count))"
        }
    }
}

/// Everything needing you, longest wait first, in the sidebar's own rows. The
/// longest wait starts highlighted, so ↵ right away takes it.
struct AttentionList: View {
    @Bindable var store: SidebarStore
    @State private var highlighted: Workspace.ID?
    @FocusState private var isFocused: Bool
    @Environment(\.sidebarRenderMode) private var renderMode

    var body: some View {
        let rows = store.blockedWorkspaces
        let current = rows.first(where: { $0.id == highlighted })?.id ?? rows.first?.id
        VStack(alignment: .leading, spacing: 1) {
            GroupHeader(title: "Needs you", count: rows.count)
            if rows.isEmpty {
                Text("Nothing needs you right now.")
                    .font(SidebarFont.sans(11.5))
                    .foregroundStyle(Palette.meta)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
            }
            ForEach(rows) { workspace in
                WorkspaceRow(
                    workspace: workspace,
                    density: .comfortable,
                    isSelected: workspace.id == store.selectedID,
                    isHovered: workspace.id == current,
                    showsFocusRing: false,
                    shortcut: nil
                )
                .onHover { inside in
                    if inside { highlighted = workspace.id }
                }
                .onTapGesture { store.chooseFromAttentionList(workspace.id) }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(workspace.accessibilityLabel)
                .accessibilityAddTraits(.isButton)
                .accessibilityAction { store.chooseFromAttentionList(workspace.id) }
            }
            HStack(spacing: 8) {
                Text("↵ switch")
                SeparatorDot()
                Text("esc close")
            }
            .font(SidebarFont.mono(10))
            .foregroundStyle(Palette.muted)
            .padding(.horizontal, 12)
            .padding(.top, 7)
            .accessibilityHidden(true)
        }
        .padding(.bottom, 8)
        .frame(width: 280, alignment: .leading)
        .background(Palette.rail)
        .environment(\.colorScheme, .dark)
        .focusable(renderMode == .live)
        .focused($isFocused)
        .focusEffectDisabled()
        .onKeyPress(.upArrow) { step(-1, in: rows, from: current); return .handled }
        .onKeyPress(.downArrow) { step(1, in: rows, from: current); return .handled }
        .onKeyPress(.return) {
            if let current { store.chooseFromAttentionList(current) }
            return .handled
        }
        .onAppear {
            if renderMode == .live { isFocused = true }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Workspaces needing you")
    }

    private func step(_ offset: Int, in rows: [Workspace], from current: Workspace.ID?) {
        guard !rows.isEmpty else { return }
        let index = rows.firstIndex { $0.id == current } ?? 0
        highlighted = rows[min(max(index + offset, 0), rows.count - 1)].id
    }
}
