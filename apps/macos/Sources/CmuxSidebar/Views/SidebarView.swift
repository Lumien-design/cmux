import AppKit
import Combine
import SwiftUI

/// The workspace sidebar: an attention-sorted list that collapses to a 44pt rail.
///
/// Install `SidebarCommands` in the app's `.commands` for ⌘1–9, ⌥⇥, ⌘K, ⌘B,
/// ⌘⌃P, ⌥⌘↑↓, and ⌥⌘1–3 / ⌃⌘1–3 for sort and density. ↑↓ ← → ↵ ⎋ and
/// type-ahead are handled here, on the focused list. With `onNewWorkspace`
/// set, a double-click on the empty space under the rows calls it too.
public struct SidebarView: View {
    @Bindable private var store: SidebarStore
    private let onNewWorkspace: (() -> Void)?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.sidebarRenderMode) private var renderMode
    @State private var modifierMonitor: Any?

    public init(store: SidebarStore, onNewWorkspace: (() -> Void)? = nil) {
        _store = Bindable(store)
        self.onNewWorkspace = onNewWorkspace
    }

    public var body: some View {
        ZStack(alignment: .topLeading) {
            if store.isCollapsed {
                CollapsedRail(store: store, onNewWorkspace: onNewWorkspace)
                    .transition(.opacity)
            } else {
                ExpandedSidebar(store: store, onNewWorkspace: onNewWorkspace)
                    .transition(.opacity)
            }
        }
        .frame(width: store.isCollapsed ? Metrics.railWidth : Metrics.sidebarWidth)
        .frame(maxHeight: .infinity, alignment: .top)
        .clipped()
        // After the clip, because the rail's name flash draws past the trailing
        // edge — give the sidebar a higher zIndex than the content beside it.
        .overlayPreferenceValue(PipBoundsKey.self) { anchors in
            if store.isCollapsed {
                RailNameFlash(store: store, anchors: anchors)
            }
        }
        .background(Palette.rail)
        .overlay(alignment: .trailing) {
            Rectangle().fill(Palette.border).frame(width: 1)
        }
        .environment(\.colorScheme, .dark)
        .animation(reduceMotion ? nil : Motion.drawer, value: store.isCollapsed)
        .onAppear(perform: startWatchingModifiers)
        .onDisappear(perform: stopWatchingModifiers)
        .onReceive(NotificationCenter.default.publisher(for: NSApplication.didResignActiveNotification)) { _ in
            store.isCommandHeld = false
        }
        .task(id: renderMode) {
            // Ageing needs minute resolution at most; the clocks tick on their own.
            guard renderMode == .live else { return }
            while !Task.isCancelled {
                store.now = .now
                try? await Task.sleep(for: .seconds(30))
            }
        }
    }

    /// Keycaps show only while ⌘ is held, so watch the modifier flags.
    private func startWatchingModifiers() {
        guard renderMode == .live, modifierMonitor == nil else { return }
        let store = store
        modifierMonitor = NSEvent.addLocalMonitorForEvents(matching: .flagsChanged) { event in
            let isHeld = event.modifierFlags.contains(.command)
            MainActor.assumeIsolated { store.isCommandHeld = isHeld }
            return event
        }
    }

    private func stopWatchingModifiers() {
        if let modifierMonitor { NSEvent.removeMonitor(modifierMonitor) }
        modifierMonitor = nil
    }
}

enum SidebarFocus: Hashable {
    case filter, list
}

struct ExpandedSidebar: View {
    @Bindable var store: SidebarStore
    let onNewWorkspace: (() -> Void)?
    @FocusState private var focus: SidebarFocus?
    @State private var isDragScrolling = false
    /// Each row's frame in triage, so a pick-up can plan the scoot.
    @State private var rowFrames: [Workspace.ID: CGRect] = [:]
    @State private var reorder: TriageReorder?
    /// The list's visible height and its rows' height; the gap is empty space.
    @State private var viewportHeight: CGFloat = 0
    @State private var rowsHeight: CGFloat = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.sidebarRenderMode) private var renderMode

    private static let triageSpace = "triage"

    var body: some View {
        VStack(spacing: 0) {
            SidebarToolbar(store: store, onNewWorkspace: onNewWorkspace)
            FilterField(store: store, focus: $focus)
            SortBar(store: store)
            if store.workspaces.isEmpty {
                VStack(spacing: 0) {
                    EmptyState(
                        title: "No workspaces yet.",
                        detail: Text("Open a folder with \(key("⌘O")), or run \(key("cmux .")) in any repo.")
                    )
                    Spacer(minLength: 0)
                }
                .newWorkspaceOnDoubleClick(newWorkspaceFromEmptySpace)
            } else if store.visibleWorkspaces.isEmpty {
                EmptyState(
                    title: "Nothing matches “\(store.filter)”.",
                    detail: Text("\(key("Esc")) clears the filter.")
                )
                Spacer(minLength: 0)
            } else {
                list
            }
            if !store.workspaces.isEmpty {
                SidebarFooter(store: store)
            }
        }
        .onChange(of: store.filterFocusRequest) { focus = .filter }
        // A finished rename hands the keyboard back to the list, unless the
        // click that ended it already put focus somewhere else.
        .onChange(of: store.renamingID) { _, id in
            if id == nil, focus == nil, renderMode == .live { focus = .list }
        }
        // A row held mid-drag has nowhere to go once the sort changes.
        .onChange(of: store.sortMode) { reorder = nil }
        .onAppear {
            if renderMode == .live, focus == nil { focus = .list }
        }
        // Snapshots can't draw a popover, so the bell's list is drawn in place.
        .overlay(alignment: .topLeading) {
            if renderMode != .live, store.isAttentionListShown {
                AttentionList(store: store)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Palette.border, lineWidth: 1))
                    // One shadow for the whole panel; without the group each opaque
                    // child casts its own onto the panel beside it.
                    .compositingGroup()
                    .shadow(color: .black.opacity(0.5), radius: 14, y: 6)
                    .offset(x: 8, y: 38)
            }
        }
    }

    private func key(_ text: String) -> Text {
        Text(text).font(SidebarFont.mono(10.5)).foregroundStyle(Palette.nameText)
    }

    private func showsRing(_ id: Workspace.ID) -> Bool {
        store.isFocusVisible && store.focusedID == id && (focus == .list || renderMode != .live)
    }

    @ViewBuilder
    private var list: some View {
        let sections = store.sections
        let order = sections.flatMap { $0.workspaces.map(\.id) }
        let shortcuts = Dictionary(uniqueKeysWithValues: order.prefix(9).enumerated().map { ($0.element, $0.offset + 1) })
        Group {
            if renderMode == .live {
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(spacing: 0) {
                            Group {
                                if store.sortMode == .triage {
                                    // Not lazy: a pick-up needs every row's frame to plan the scoot.
                                    VStack(alignment: .leading, spacing: 1) {
                                        rows(sections, shortcuts: shortcuts)
                                    }
                                    .coordinateSpace(.named(Self.triageSpace))
                                    .padding(.bottom, 6)
                                } else {
                                    LazyVStack(alignment: .leading, spacing: 1, pinnedViews: .sectionHeaders) {
                                        rows(sections, shortcuts: shortcuts)
                                    }
                                    .padding(.bottom, 6)
                                }
                            }
                            .onGeometryChange(for: CGFloat.self, of: { $0.size.height }) { rowsHeight = $0 }
                            EmptySpace(
                                height: max(viewportHeight - rowsHeight, 0),
                                onDoubleClick: newWorkspaceFromEmptySpace
                            )
                        }
                    }
                    .onScrollGeometryChange(for: CGFloat.self, of: { $0.containerSize.height }) { _, height in
                        viewportHeight = height
                    }
                    // A lifted row suspends the scroll rather than disabling it, so the
                    // gestures under the pointer aren't rebuilt mid-drag.
                    .modifier(DragToScroll(
                        isDragging: $isDragScrolling,
                        isEnabled: store.renamingID == nil,
                        isSuspended: reorder != nil
                    ))
                    .onChange(of: store.focusedID) { _, id in
                        if let id { proxy.scrollTo(id) }
                    }
                }
            } else {
                // Clear takes the offered height and the overlay clips the rows
                // to it, as the scroll view would, instead of growing the sidebar.
                Color.clear
                    .overlay(alignment: .top) {
                        VStack(alignment: .leading, spacing: 1) {
                            rows(sections, shortcuts: shortcuts)
                        }
                    }
                    .clipped()
            }
        }
        .focusable(renderMode == .live)
        .focused($focus, equals: .list)
        .focusEffectDisabled()
        .modifier(WorkspaceKeyboard(store: store))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Workspaces")
        .animation(reduceMotion ? nil : Motion.settle, value: order)
        .animation(reduceMotion ? nil : Motion.settle, value: store.expandedIDs)
    }

    @ViewBuilder
    private func rows(_ sections: [SidebarSection], shortcuts: [Workspace.ID: Int]) -> some View {
        ForEach(sections) { section in
            Section {
                ForEach(section.workspaces) { workspace in
                    block(workspace, shortcut: shortcuts[workspace.id])
                }
            } header: {
                // Triage has one untitled section: no groups to head.
                if !section.title.isEmpty {
                    GroupHeader(title: section.title, count: section.workspaces.count)
                }
            }
        }
    }

    /// A workspace row and its panes, which move together.
    @ViewBuilder
    private func block(_ workspace: Workspace, shortcut: Int?) -> some View {
        let stack = VStack(alignment: .leading, spacing: 1) {
            row(workspace, shortcut: shortcut)
            if store.expandedIDs.contains(workspace.id) {
                panes(workspace)
            }
        }
        .id(workspace.id)
        if store.sortMode == .triage, renderMode == .live {
            stack.modifier(TriageReorderable(
                id: workspace.id,
                store: store,
                reorder: $reorder,
                frames: $rowFrames,
                coordinateSpace: Self.triageSpace,
                isEnabled: store.renamingID == nil
            ))
        } else {
            stack
        }
    }

    @ViewBuilder
    private func row(_ workspace: Workspace, shortcut: Int?) -> some View {
        let isSelected = workspace.id == store.selectedID
        let isRenaming = workspace.id == store.renamingID
        // While renaming, clicks belong to the text field.
        let rowGestures: GestureMask = isRenaming ? .subviews : .all
        WorkspaceRow(
            workspace: workspace,
            density: store.density,
            isSelected: isSelected,
            isHovered: workspace.id == store.hoveredID && reorder == nil,
            showsFocusRing: showsRing(workspace.id) && !isRenaming,
            shortcut: store.isCommandHeld ? shortcut : nil,
            isRenaming: isRenaming,
            onRename: { store.commitRename($0) },
            onCancelRename: { store.cancelRename() }
        )
        .onHover { inside in
            // Hover isn't drawn while a row is lifted, so crossing rows mid-drag
            // shouldn't redraw the list either.
            guard reorder == nil else { return }
            if inside {
                store.hoveredID = workspace.id
            } else if store.hoveredID == workspace.id {
                store.hoveredID = nil
            }
        }
        // Double-click renames. The single click stays immediate because it runs
        // alongside, rather than waiting to rule out a second click.
        .gesture(TapGesture(count: 2).onEnded { store.beginRename(workspace.id) }, including: rowGestures)
        .simultaneousGesture(TapGesture().onEnded { click(workspace.id) }, including: rowGestures)
        .contextMenu {
            Button("Rename…") { store.beginRename(workspace.id) }
            Button(workspace.isPinned ? "Unpin" : "Pin Above the Sort") {
                store.togglePin(workspace.id)
            }
        }
        .accessibilityElement(children: isRenaming ? .contain : .ignore)
        .accessibilityLabel(workspace.accessibilityLabel)
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
        .accessibilityAction { store.select(workspace.id) }
        .accessibilityAction(named: "Rename") { store.beginRename(workspace.id) }
        .accessibilityActions {
            if store.sortMode == .triage {
                Button("Move Up") { store.moveInTriage(workspace.id, by: -1) }
                Button("Move Down") { store.moveInTriage(workspace.id, by: 1) }
            }
        }
    }

    private func panes(_ workspace: Workspace) -> some View {
        ForEach(workspace.panes) { pane in
            PaneRow(pane: pane, isCurrent: pane.id == store.currentPaneID(in: workspace))
                .onTapGesture {
                    guard !isDragScrolling, reorder == nil else { return }
                    store.selectPane(pane.id, in: workspace.id)
                    focus = .list
                }
                .accessibilityAction { store.selectPane(pane.id, in: workspace.id) }
                .transition(.opacity)
        }
    }

    /// A click that ends a drag, a scroll or a reorder is not a selection.
    private func click(_ id: Workspace.ID) {
        guard !isDragScrolling, reorder == nil else { return }
        store.select(id)
        focus = .list
    }

    /// What a double-click on empty space does: the +, unless the clicks belong
    /// to a drag, a lifted row or a rename. `nil` when the host offers no +.
    private var newWorkspaceFromEmptySpace: (() -> Void)? {
        guard let onNewWorkspace else { return nil }
        return {
            guard !isDragScrolling, reorder == nil, store.renamingID == nil else { return }
            onNewWorkspace()
            if renderMode == .live { focus = .list }
        }
    }
}

// MARK: - Chrome

struct SidebarToolbar: View {
    @Bindable var store: SidebarStore
    let onNewWorkspace: (() -> Void)?

    var body: some View {
        HStack(spacing: 6) {
            IconButton(symbol: "sidebar.left", label: "Collapse sidebar", shortcutHint: "⌘B", isOn: true) {
                store.setCollapsed(true)
            }
            AttentionBell(store: store)
                .disabled(store.blockedCount == 0)
            Spacer(minLength: 0)
            ViewOptionsMenu(store: store)
            IconButton(symbol: "plus", label: "New workspace") {
                onNewWorkspace?()
            }
            .disabled(onNewWorkspace == nil)
        }
        .padding(EdgeInsets(top: 10, leading: 12, bottom: 6, trailing: 10))
    }
}

struct IconButton: View {
    let symbol: String
    let label: String
    var shortcutHint: String?
    var isOn = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: symbol).font(.system(size: 11))
        }
        .buttonStyle(IconButtonStyle(isOn: isOn))
        .help(shortcutHint.map { "\(label)  \($0)" } ?? label)
        .accessibilityLabel(label)
    }
}

struct IconButtonStyle: ButtonStyle {
    var isOn = false
    var size: CGFloat = 22
    var radius: CGFloat = 5

    func makeBody(configuration: Configuration) -> some View {
        IconButtonChrome(configuration: configuration, isOn: isOn, size: size, radius: radius)
    }
}

private struct IconButtonChrome: View {
    let configuration: ButtonStyleConfiguration
    let isOn: Bool
    let size: CGFloat
    let radius: CGFloat
    @Environment(\.isEnabled) private var isEnabled
    @State private var isHovered = false

    var body: some View {
        configuration.label
            .foregroundStyle(isOn || configuration.isPressed ? Palette.nameSelected : Palette.meta)
            .frame(width: size, height: size)
            .background(fill, in: RoundedRectangle(cornerRadius: radius))
            .opacity(isEnabled ? 1 : 0.4)
            .contentShape(Rectangle())
            .onHover { isHovered = $0 }
    }

    private var fill: Color {
        if isOn || configuration.isPressed { return Palette.selected }
        return isHovered && isEnabled ? Palette.hover : .clear
    }
}

struct SortAndDensityPickers: View {
    @Bindable var store: SidebarStore

    var body: some View {
        Picker("Sort", selection: $store.sortMode) {
            ForEach(SortMode.allCases) { Text($0.title).tag($0) }
        }
        Picker("Density", selection: $store.density) {
            ForEach(Density.allCases) { Text($0.title).tag($0) }
        }
    }
}

struct ViewOptionsMenu: View {
    @Bindable var store: SidebarStore
    @Environment(\.sidebarRenderMode) private var renderMode

    var body: some View {
        let icon = Image(systemName: "line.3.horizontal.decrease").font(.system(size: 11))
        if renderMode == .live {
            Menu {
                SortAndDensityPickers(store: store).pickerStyle(.inline)
            } label: {
                icon
            }
            .menuStyle(.button)
            .buttonStyle(IconButtonStyle())
            .menuIndicator(.hidden)
            .fixedSize()
            .help("Sort and density  ⌥⌘1–3 · ⌃⌘1–3")
            .accessibilityLabel("Sort and density")
        } else {
            icon.foregroundStyle(Palette.meta).frame(width: 22, height: 22)
        }
    }
}

struct FilterField: View {
    @Bindable var store: SidebarStore
    var focus: FocusState<SidebarFocus?>.Binding
    @Environment(\.sidebarRenderMode) private var renderMode

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 10))
                .foregroundStyle(Palette.meta)
                .accessibilityHidden(true)
            if renderMode == .live {
                TextField("Filter workspaces", text: $store.filter, prompt: Text("Filter workspaces").foregroundStyle(Palette.muted))
                    .textFieldStyle(.plain)
                    .focused(focus, equals: .filter)
                    .onSubmit(commitTopMatch)
                    .onExitCommand(perform: clearOrLeave)
                    .onKeyPress(.downArrow) {
                        focus.wrappedValue = .list
                        store.focusFirst()
                        return .handled
                    }
            } else {
                Text(store.filter.isEmpty ? "Filter workspaces" : store.filter)
                    .foregroundStyle(store.filter.isEmpty ? Palette.muted : Palette.nameText)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            if store.filter.isEmpty {
                Keycap(label: "⌘K", size: 9.5)
            } else {
                Button { store.filter = "" } label: {
                    Image(systemName: "xmark.circle.fill").font(.system(size: 10))
                }
                .buttonStyle(.plain)
                .foregroundStyle(Palette.meta)
                .accessibilityLabel("Clear filter")
            }
        }
        .font(SidebarFont.mono(11.5))
        .foregroundStyle(Palette.nameText)
        .padding(.horizontal, 8)
        .frame(height: 26)
        .background(Palette.field, in: RoundedRectangle(cornerRadius: 6))
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .strokeBorder(focus.wrappedValue == .filter ? Palette.focus : Palette.fieldBorder, lineWidth: 1)
        )
        .padding(EdgeInsets(top: 2, leading: 8, bottom: 6, trailing: 8))
    }

    /// ↵ switches to the top match and hands the keyboard back to the list.
    private func commitTopMatch() {
        if let first = store.visibleWorkspaces.first { store.select(first.id) }
        store.filter = ""
        focus.wrappedValue = .list
    }

    private func clearOrLeave() {
        if store.filter.isEmpty {
            focus.wrappedValue = .list
        } else {
            store.filter = ""
        }
    }
}

struct SortBar: View {
    @Bindable var store: SidebarStore
    @Environment(\.sidebarRenderMode) private var renderMode

    var body: some View {
        HStack(spacing: 6) {
            if renderMode == .live {
                Menu {
                    Picker("Sort", selection: $store.sortMode) {
                        ForEach(SortMode.allCases) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                } label: {
                    chipLabel
                }
                .menuStyle(.button)
                .buttonStyle(ChipButtonStyle())
                .menuIndicator(.hidden)
                .fixedSize()
                .help("Sort  ⌥⌘1–3")
                .accessibilityLabel("Sort: \(store.sortMode.title)")
            } else {
                chipLabel.modifier(ChipChrome())
            }
            Spacer(minLength: 0)
            Text(countLabel).monospacedDigit()
        }
        .font(SidebarFont.mono(10.5))
        .foregroundStyle(Palette.meta)
        .padding(EdgeInsets(top: 0, leading: 12, bottom: 8, trailing: 12))
    }

    private var chipLabel: some View {
        HStack(spacing: 4) {
            Image(systemName: "line.3.horizontal.decrease").font(.system(size: 8.5))
            Text(store.sortMode.title)
        }
    }

    private var countLabel: String {
        let total = store.liveCount
        guard store.filter.isEmpty else { return "\(store.visibleWorkspaces.count) of \(total)" }
        // In triage the count gives way to the one thing the mode needs you to know.
        if store.sortMode == .triage { return "Hold a row to move it" }
        return total == 1 ? "1 workspace" : "\(total) workspaces"
    }
}

struct ChipButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.modifier(ChipChrome(isPressed: configuration.isPressed))
    }
}

struct ChipChrome: ViewModifier {
    var isPressed = false

    func body(content: Content) -> some View {
        content
            .font(SidebarFont.mono(10))
            .kerning(0.2)
            .foregroundStyle(Palette.agent)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(isPressed ? Palette.selected : Palette.chip, in: RoundedRectangle(cornerRadius: 4))
    }
}

struct SidebarFooter: View {
    let store: SidebarStore

    var body: some View {
        HStack(spacing: 8) {
            if store.blockedCount > 0 {
                Text("\(store.blockedCount) \(store.blockedCount == 1 ? "needs" : "need") you")
                    .foregroundStyle(Palette.signal)
                SeparatorDot()
            }
            Text("\(store.runningCount) running")
            Spacer(minLength: 0)
            if store.blockedCount > 0 {
                Text("⌥⇥ next").accessibilityHidden(true)
            }
        }
        .font(SidebarFont.mono(10))
        .foregroundStyle(Palette.muted)
        .monospacedDigit()
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .overlay(alignment: .top) {
            Rectangle().fill(Palette.footerRule).frame(height: 1)
        }
    }
}

/// The one place in the sidebar where a sentence earns its space.
struct EmptyState: View {
    let title: String
    let detail: Text

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(title)
                .font(SidebarFont.sans(11.5))
                .foregroundStyle(Palette.agent)
            detail
                .font(SidebarFont.sans(10.5))
                .foregroundStyle(Palette.meta)
                .lineSpacing(3)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 20)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
