import SwiftUI

/// The 44pt rail. Collapsing costs metadata, not awareness: one pip per
/// workspace in sort order, with the same glyph and colour as the full row,
/// and the same keyboard model as the list.
struct CollapsedRail: View {
    @Bindable var store: SidebarStore
    var onNewWorkspace: (() -> Void)?
    @FocusState private var isFocused: Bool
    @State private var isDragScrolling = false
    /// The rail's visible height and its pips' height; the gap is empty space.
    @State private var viewportHeight: CGFloat = 0
    @State private var pipsHeight: CGFloat = 0
    @Environment(\.sidebarRenderMode) private var renderMode

    var body: some View {
        VStack(spacing: 3) {
            Button { store.setCollapsed(false) } label: {
                Image(systemName: "sidebar.left").font(.system(size: 11))
            }
            .buttonStyle(IconButtonStyle(isOn: true, size: 24, radius: 6))
            .help("Expand sidebar  ⌘B")
            .accessibilityLabel("Expand sidebar")

            Rectangle()
                .fill(Palette.groupRule)
                .frame(width: 22, height: 1)
                .padding(.vertical, 5)

            pips
                .focusable(renderMode == .live)
                .focused($isFocused)
                .focusEffectDisabled()
                .modifier(WorkspaceKeyboard(store: store, handlesDisclosure: false))
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Workspaces")

            Spacer(minLength: 0)

            // How many are blocked, so the count survives the collapse.
            if store.blockedCount > 0 {
                Text("\(store.blockedCount)")
                    .font(SidebarFont.mono(9))
                    .monospacedDigit()
                    .foregroundStyle(Palette.signal)
                    .accessibilityLabel("\(store.blockedCount) need you")
            }
        }
        .padding(.vertical, 10)
        .frame(width: Metrics.railWidth)
        .frame(maxHeight: .infinity, alignment: .top)
        // The list that held focus is gone once collapsed; take it over.
        .onAppear {
            if renderMode == .live { isFocused = true }
        }
    }

    @ViewBuilder
    private var pips: some View {
        let rows = store.visibleWorkspaces
        if renderMode == .live {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 0) {
                        pipStack(rows)
                            .onGeometryChange(for: CGFloat.self, of: { $0.size.height }) { pipsHeight = $0 }
                        EmptySpace(
                            height: max(viewportHeight - pipsHeight, 0),
                            onDoubleClick: newWorkspaceFromEmptySpace
                        )
                    }
                }
                .onScrollGeometryChange(for: CGFloat.self, of: { $0.containerSize.height }) { _, height in
                    viewportHeight = height
                }
                .scrollIndicators(.never)
                .modifier(DragToScroll(isDragging: $isDragScrolling))
                .onChange(of: store.focusedID) { _, id in
                    if let id { proxy.scrollTo(id) }
                }
            }
        } else {
            pipStack(rows)
        }
    }

    /// The same double-click as the list's empty space, minus the drag's release.
    private var newWorkspaceFromEmptySpace: (() -> Void)? {
        guard let onNewWorkspace else { return nil }
        return {
            guard !isDragScrolling else { return }
            onNewWorkspace()
            isFocused = true
        }
    }

    private func pipStack(_ rows: [Workspace]) -> some View {
        VStack(spacing: 3) {
            ForEach(rows) { workspace in
                pip(workspace)
            }
        }
    }

    private func pip(_ workspace: Workspace) -> some View {
        let isSelected = workspace.id == store.selectedID
        return RailPip(
            workspace: workspace,
            isSelected: isSelected,
            isHovered: workspace.id == store.hoveredID,
            showsFocusRing: store.isFocusVisible
                && store.focusedID == workspace.id
                && (isFocused || renderMode != .live)
        )
        .id(workspace.id)
        // Where the name flash lines up when the keyboard lands here.
        .anchorPreference(key: PipBoundsKey.self, value: .bounds) { [workspace.id: $0] }
        .onTapGesture {
            guard !isDragScrolling else { return }
            store.select(workspace.id)
            isFocused = true
        }
        .onHover { inside in
            if inside {
                store.hoveredID = workspace.id
            } else if store.hoveredID == workspace.id {
                store.hoveredID = nil
            }
        }
        // No `.help` tooltip: hovering shows the name tag instead.
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(workspace.accessibilityLabel)
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
        .accessibilityAction { store.select(workspace.id) }
    }
}

struct RailPip: View {
    let workspace: Workspace
    let isSelected: Bool
    let isHovered: Bool
    let showsFocusRing: Bool

    var body: some View {
        StatusGlyph(state: workspace.state)
            .modifier(AttentionPulse(isActive: workspace.state.isBlocked))
            .frame(width: 32, height: 32)
            .background(surface, in: RoundedRectangle(cornerRadius: 7))
            .overlay {
                // Same ring as the row, drawn inside so nothing clips it.
                if showsFocusRing {
                    RoundedRectangle(cornerRadius: 7)
                        .strokeBorder(Palette.focus, lineWidth: 2)
                }
            }
            .overlay(alignment: .leading) {
                // Selection keeps its neutral bar in the rail.
                if isSelected {
                    RoundedRectangle(cornerRadius: 1)
                        .fill(Palette.selectionBar)
                        .frame(width: 2, height: 14)
                        .offset(x: -5)
                }
            }
            .contentShape(Rectangle())
    }

    private var surface: Color {
        if isSelected { return Palette.selected }
        return isHovered ? Palette.hover : .clear
    }
}
