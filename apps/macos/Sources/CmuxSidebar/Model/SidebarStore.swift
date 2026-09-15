import Foundation
import Observation
import SwiftUI

public enum SortMode: String, CaseIterable, Identifiable, Sendable {
    /// Blocked first, longest wait at the top, then running, finished, idle.
    case attention
    /// Your order: nothing is sorted and nothing moves on its own. Hold a row
    /// and drag it, or use ⌥⌘↑ ⌥⌘↓, to move it.
    case triage
    /// Grouping by host is a sort mode, not a shape change — the rows are identical.
    case host

    public var id: Self { self }

    public var title: String {
        switch self {
        case .attention: return "Attention first"
        case .triage: return "Triage"
        case .host: return "By host"
        }
    }
}

public enum Density: String, CaseIterable, Identifiable, Sendable {
    /// Name, state, clock. Nothing else.
    case compact
    /// Adds the context line. The default.
    case comfortable
    /// Adds the path. For two or three workspaces.
    case expanded

    public var id: Self { self }
    public var title: String { rawValue.capitalized }

    public var rowHeight: CGFloat {
        switch self {
        case .compact: return 30
        case .comfortable: return 44
        case .expanded: return 60
        }
    }
}

/// Rows under one header.
public struct SidebarSection: Identifiable, Equatable, Sendable {
    public let id: String
    public let title: String
    public let workspaces: [Workspace]
}

enum AttentionGroup: Int, CaseIterable {
    case pinned, needsYou, running, finished, idle

    var title: String {
        switch self {
        case .pinned: return "Pinned"
        case .needsYou: return "Needs you"
        case .running: return "Running"
        case .finished: return "Finished"
        case .idle: return "Idle"
        }
    }

    init(_ workspace: Workspace) {
        if workspace.isPinned {
            self = .pinned
            return
        }
        switch workspace.state {
        case .needsInput: self = .needsYou
        case .running: self = .running
        case .finished, .failed: self = .finished
        case .idle: self = .idle
        }
    }
}

/// One keyboard landing on a workspace. The serial makes a repeat landing on
/// the same workspace a new value, so its name shows again.
public struct KeyboardFlash: Equatable, Sendable {
    public let id: Workspace.ID
    let serial: Int
}

/// Everything the sidebar shows and every command it answers to.
///
/// Workspaces are held in the order they were opened; display order is always
/// derived, so there is no second copy of the list to fall out of sync.
@MainActor
@Observable
public final class SidebarStore {
    public private(set) var workspaces: [Workspace]
    public var sortMode: SortMode = .attention
    public var density: Density = .comfortable
    public var filter = ""
    /// Collapsed to the 44pt rail. State survives — the pips keep reporting.
    public private(set) var isCollapsed = false
    /// The workspace on screen.
    public private(set) var selectedID: Workspace.ID?
    /// The keyboard cursor. ↑↓ move it without switching; ↵ commits, ⎋ restores.
    public private(set) var focusedID: Workspace.ID?
    /// True while focus is driven from the keyboard — the native `:focus-visible`.
    /// The focus ring only draws while this holds.
    public private(set) var isFocusVisible = false
    public var hoveredID: Workspace.ID?
    public private(set) var expandedIDs: Set<Workspace.ID> = []
    /// Index keycaps are visible only while ⌘ is held.
    public var isCommandHeld = false
    /// Drives ageing. The per-second clocks tick in their own views.
    public var now: Date
    /// Bumped by ⌘K; the filter field takes focus when it changes.
    public private(set) var filterFocusRequest = 0
    /// The workspace the keyboard last landed on. The collapsed rail flashes its
    /// name, since the rail has none of its own. Mouse selection never sets it.
    public private(set) var keyboardFlash: KeyboardFlash?
    /// The workspace whose name is open for editing.
    public private(set) var renamingID: Workspace.ID?
    /// Your order in triage. Starts as the order the workspaces were opened;
    /// new ones join at the bottom. Kept while other sorts are showing.
    public private(set) var triageOrder: [Workspace.ID] = []
    /// The bell's list of everything needing you.
    public var isAttentionListShown = false

    private var currentPaneIDs: [Workspace.ID: Pane.ID] = [:]
    @ObservationIgnored private var flashSerial = 0
    private let announce: @MainActor (String) -> Void
    @ObservationIgnored private var typeAheadBuffer = ""
    @ObservationIgnored private var typeAheadAt = Date.distantPast

    /// Finished workspaces age out after an hour. Failures stay until dealt with.
    public static let finishedLifetime: TimeInterval = 60 * 60

    public init(
        workspaces: [Workspace] = [],
        selectedID: Workspace.ID? = nil,
        now: Date = .now,
        announce: @escaping @MainActor (String) -> Void = SidebarStore.postAnnouncement
    ) {
        self.workspaces = workspaces
        self.triageOrder = workspaces.map(\.id)
        self.now = now
        self.announce = announce
        if let selectedID { select(selectedID) }
    }

    // MARK: - Reading

    public var selected: Workspace? { workspace(selectedID) }

    public func workspace(_ id: Workspace.ID?) -> Workspace? {
        guard let id else { return nil }
        return workspaces.first { $0.id == id }
    }

    public var sections: [SidebarSection] {
        let rows = workspaces.enumerated().filter { isLive($0.element) && matchesFilter($0.element) }
        switch sortMode {
        case .attention:
            return AttentionGroup.allCases.compactMap { group in
                let members = rows.filter { AttentionGroup($0.element) == group }
                guard !members.isEmpty else { return nil }
                return SidebarSection(
                    id: "group.\(group)",
                    title: group.title,
                    workspaces: members.sorted(by: Self.precedes).map { $0.element }
                )
            }
        case .triage:
            // Your order, and everything stays: no groups, no pins, no ageing.
            let rank = Dictionary(uniqueKeysWithValues: triageOrder.enumerated().map { ($0.element, $0.offset) })
            let members = workspaces.enumerated()
                .filter { matchesFilter($0.element) }
                .sorted { (rank[$0.element.id] ?? Int.max, $0.offset) < (rank[$1.element.id] ?? Int.max, $1.offset) }
                .map { $0.element }
            return members.isEmpty ? [] : [SidebarSection(id: "triage", title: "", workspaces: members)]
        case .host:
            let hosts = Set(rows.map { $0.element.host }).sorted { ($0 ?? "") < ($1 ?? "") }
            return hosts.map { host in
                SidebarSection(
                    id: "host.\(host ?? "")",
                    title: host ?? "This Mac",
                    workspaces: rows.filter { $0.element.host == host }.sorted(by: Self.precedes).map { $0.element }
                )
            }
        }
    }

    /// Rows in display order — the order ↑↓, ⌘1–9 and the collapsed rail use.
    public var visibleWorkspaces: [Workspace] {
        sections.flatMap(\.workspaces)
    }

    /// Workspaces that have not aged out, ignoring the filter.
    public var liveCount: Int { workspaces.filter { isLive($0) }.count }
    public var blockedCount: Int { workspaces.filter { $0.state.isBlocked }.count }

    /// Every workspace blocked on you, longest wait first, whatever the filter
    /// or sort — the bell's list answers "what's waiting", not "what's showing".
    public var blockedWorkspaces: [Workspace] {
        workspaces
            .compactMap { workspace -> (workspace: Workspace, since: Date)? in
                guard case .needsInput(let since) = workspace.state else { return nil }
                return (workspace, since)
            }
            .sorted { $0.since < $1.since }
            .map { $0.workspace }
    }
    public var runningCount: Int { workspaces.filter { $0.state.isRunning }.count }

    /// The workspace ⌘`number` jumps to: the Nth *visible* row.
    public func shortcutTarget(_ number: Int) -> Workspace? {
        guard (1...9).contains(number) else { return nil }
        let rows = visibleWorkspaces
        return number <= rows.count ? rows[number - 1] : nil
    }

    /// The pane that has the workspace's attention: the one last chosen, else
    /// the first blocked pane, else the first pane.
    public func currentPaneID(in workspace: Workspace) -> Pane.ID? {
        currentPaneIDs[workspace.id]
            ?? workspace.panes.first { $0.state.isBlocked }?.id
            ?? workspace.panes.first?.id
    }

    private typealias Ranked = (offset: Int, element: Workspace)

    /// Blocked: longest wait first. Running: most recent start first. Finished:
    /// most recent first. Pinned and idle: the order they were opened. Every key
    /// is a fixed timestamp, so the list holds still while the clocks run.
    private nonisolated static func precedes(_ a: Ranked, _ b: Ranked) -> Bool {
        let groupA = AttentionGroup(a.element)
        let groupB = AttentionGroup(b.element)
        if groupA != groupB { return groupA.rawValue < groupB.rawValue }
        if groupA != .pinned {
            switch (a.element.state, b.element.state) {
            case let (.needsInput(x), .needsInput(y)) where x != y:
                return x < y
            case let (.running(x), .running(y)) where x != y:
                return x > y
            default:
                if let x = a.element.state.endedAt, let y = b.element.state.endedAt, x != y {
                    return x > y
                }
            }
        }
        return a.offset < b.offset
    }

    private func isLive(_ workspace: Workspace) -> Bool {
        guard case .finished(let at) = workspace.state, !workspace.isPinned, workspace.id != selectedID else {
            return true
        }
        return now.timeIntervalSince(at) <= Self.finishedLifetime
    }

    /// Matches name, branch, path, agent, host and port.
    private func matchesFilter(_ workspace: Workspace) -> Bool {
        let query = filter.trimmingCharacters(in: .whitespaces)
        guard !query.isEmpty else { return true }
        let portQuery = query.hasPrefix(":") ? String(query.dropFirst()) : query
        if let port = workspace.port, !portQuery.isEmpty, String(port).hasPrefix(portQuery) {
            return true
        }
        let fields = [workspace.name, workspace.path, workspace.branch, workspace.agent, workspace.host]
            .compactMap { $0 } + workspace.panes.map(\.agent)
        return fields.contains { $0.localizedCaseInsensitiveContains(query) }
    }

    // MARK: - Selection and focus

    /// Switches to a workspace, as a click does: moves the cursor with it and
    /// hides the focus ring. A multi-pane workspace opens into its panes.
    public func select(_ id: Workspace.ID) {
        guard let target = workspace(id) else { return }
        selectedID = id
        focusedID = id
        isFocusVisible = false
        expandedIDs = target.panes.count > 1 ? [id] : []
    }

    public func moveFocus(by offset: Int) {
        let rows = visibleWorkspaces
        guard !rows.isEmpty else { return }
        isFocusVisible = true
        if let current = focusedID ?? selectedID,
           let index = rows.firstIndex(where: { $0.id == current }) {
            focusedID = rows[min(max(index + offset, 0), rows.count - 1)].id
        } else {
            focusedID = offset < 0 ? rows.last?.id : rows.first?.id
        }
        flash(focusedID)
    }

    public func focusFirst() {
        isFocusVisible = true
        focusedID = visibleWorkspaces.first?.id
        flash(focusedID)
    }

    public func commitFocus() {
        guard let focusedID else { return }
        select(focusedID)
        isFocusVisible = true
        flash(focusedID)
    }

    public func restoreFocus() {
        focusedID = selectedID
        flash(focusedID)
    }

    public func jump(toShortcut number: Int) {
        guard let target = shortcutTarget(number) else { return }
        select(target.id)
        flash(target.id)
    }

    /// ⌥⇥: the next workspace blocked on you, longest wait first, wrapping.
    public func selectNextBlocked(reverse: Bool = false) {
        let blocked = visibleWorkspaces
            .compactMap { workspace -> (id: Workspace.ID, since: Date)? in
                guard case .needsInput(let since) = workspace.state else { return nil }
                return (workspace.id, since)
            }
            .sorted { $0.since < $1.since }
            .map { $0.id }
        guard !blocked.isEmpty else { return }
        let next: Int
        if let current = selectedID.flatMap({ blocked.firstIndex(of: $0) }) {
            next = (current + (reverse ? -1 : 1) + blocked.count) % blocked.count
        } else {
            next = reverse ? blocked.count - 1 : 0
        }
        select(blocked[next])
        flash(blocked[next])
    }

    /// Type-ahead on the list: moves the cursor to the first name with the
    /// typed prefix. The buffer resets after a second of quiet.
    public func typeAhead(_ character: Character, at time: Date = .now) {
        if time.timeIntervalSince(typeAheadAt) > 1 { typeAheadBuffer = "" }
        typeAheadAt = time
        typeAheadBuffer.append(character)
        let prefix = typeAheadBuffer.lowercased()
        guard let match = visibleWorkspaces.first(where: { $0.name.lowercased().hasPrefix(prefix) }) else { return }
        focusedID = match.id
        isFocusVisible = true
        flash(match.id)
    }

    private func flash(_ id: Workspace.ID?) {
        guard let id else { return }
        flashSerial += 1
        keyboardFlash = KeyboardFlash(id: id, serial: flashSerial)
    }

    // MARK: - Rename

    /// Opens the name for editing in place. Renaming while collapsed reopens
    /// the sidebar, since the rail has no names to edit.
    public func beginRename(_ id: Workspace.ID) {
        guard workspace(id) != nil else { return }
        if isCollapsed { isCollapsed = false }
        if selectedID != id { select(id) }
        renamingID = id
    }

    public func beginRenameFocused() {
        if let id = focusedID ?? selectedID { beginRename(id) }
    }

    /// Keeps the new name, trimmed. An empty name is refused and the old one kept.
    public func commitRename(_ name: String) {
        guard let id = renamingID else { return }
        renamingID = nil
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        update(id) { $0.name = trimmed }
    }

    public func cancelRename() {
        renamingID = nil
    }

    // MARK: - Attention list

    /// Opens the bell's list. It reopens a collapsed sidebar, since the list
    /// hangs off the bell.
    public func showAttentionList() {
        guard blockedCount > 0 else { return }
        if isCollapsed { setCollapsed(false) }
        isAttentionListShown = true
    }

    /// Switches to a workspace from the list and closes it, clearing a filter
    /// that would otherwise hide the row just chosen.
    public func chooseFromAttentionList(_ id: Workspace.ID) {
        isAttentionListShown = false
        select(id)
        if !visibleWorkspaces.contains(where: { $0.id == id }) { filter = "" }
    }

    /// Closes the list without switching anywhere — the ✕ in its header.
    public func closeAttentionList() {
        isAttentionListShown = false
    }

    // MARK: - Triage

    /// Places a workspace just before another in your triage order. Placement
    /// is relative, so it stays right while a filter hides some rows.
    public func moveTriage(_ id: Workspace.ID, before target: Workspace.ID) {
        place(id, beside: target, after: false)
    }

    public func moveTriage(_ id: Workspace.ID, after target: Workspace.ID) {
        place(id, beside: target, after: true)
    }

    /// ⌥⌘↑ / ⌥⌘↓: moves a workspace past its visible neighbour, and says where
    /// it landed, since the move is otherwise silent to VoiceOver.
    public func moveInTriage(_ id: Workspace.ID, by offset: Int) {
        guard sortMode == .triage, offset != 0 else { return }
        let rows = visibleWorkspaces.map(\.id)
        guard let index = rows.firstIndex(of: id), rows.indices.contains(index + offset) else { return }
        place(id, beside: rows[index + offset], after: offset > 0)
        if let position = visibleWorkspaces.firstIndex(where: { $0.id == id }), let name = workspace(id)?.name {
            announce("\(name), \(position + 1) of \(rows.count).")
        }
    }

    public func moveFocusedInTriage(by offset: Int) {
        if let id = focusedID ?? selectedID { moveInTriage(id, by: offset) }
    }

    private func place(_ id: Workspace.ID, beside target: Workspace.ID, after: Bool) {
        guard id != target, triageOrder.contains(id) else { return }
        triageOrder.removeAll { $0 == id }
        guard let index = triageOrder.firstIndex(of: target) else {
            triageOrder.append(id)
            return
        }
        triageOrder.insert(id, at: after ? index + 1 : index)
    }

    // MARK: - Panes, pins, collapse

    public func expandFocused() {
        guard let id = focusedID, let target = workspace(id), !target.panes.isEmpty else { return }
        expandedIDs.insert(id)
    }

    public func collapseFocused() {
        if let id = focusedID { expandedIDs.remove(id) }
    }

    public func selectPane(_ paneID: Pane.ID, in id: Workspace.ID) {
        if selectedID != id { select(id) }
        currentPaneIDs[id] = paneID
    }

    public func togglePin(_ id: Workspace.ID) {
        update(id) { $0.isPinned.toggle() }
    }

    public func togglePinFocused() {
        if let id = focusedID ?? selectedID { togglePin(id) }
    }

    public func setCollapsed(_ collapsed: Bool) {
        isCollapsed = collapsed
        // The pointer isn't over whatever it was over before the layout changed.
        hoveredID = nil
        // The rail has nowhere to show a filter, so a live one would hide pips
        // silently, and no names to edit.
        if collapsed {
            filter = ""
            renamingID = nil
            isAttentionListShown = false
        }
    }

    public func toggleCollapsed() {
        setCollapsed(!isCollapsed)
    }

    public func requestFilterFocus() {
        setCollapsed(false)
        filterFocusRequest += 1
    }

    // MARK: - Updates

    /// Applies a change and announces the one transition worth announcing: a
    /// workspace entering needs-input.
    public func update(_ id: Workspace.ID, _ change: (inout Workspace) -> Void) {
        guard let index = workspaces.firstIndex(where: { $0.id == id }) else { return }
        let wasBlocked = workspaces[index].state.isBlocked
        change(&workspaces[index])
        let updated = workspaces[index]
        if updated.state.isBlocked, !wasBlocked {
            announce("\(updated.name) needs input.")
        }
    }

    public func setState(_ state: AgentState, for id: Workspace.ID) {
        update(id) { $0.state = state }
    }

    public func insert(_ workspace: Workspace, select shouldSelect: Bool = true) {
        workspaces.append(workspace)
        triageOrder.append(workspace.id)
        if shouldSelect { select(workspace.id) }
    }

    public func replaceAll(_ workspaces: [Workspace], selecting id: Workspace.ID? = nil) {
        self.workspaces = workspaces
        triageOrder = workspaces.map(\.id)
        selectedID = nil
        focusedID = nil
        hoveredID = nil
        expandedIDs = []
        currentPaneIDs = [:]
        filter = ""
        renamingID = nil
        if let id { select(id) }
    }

    public static func postAnnouncement(_ message: String) {
        AccessibilityNotification.Announcement(message).post()
    }
}
