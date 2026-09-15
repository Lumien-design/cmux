import Foundation

/// What the agent in a workspace or pane is doing.
///
/// Every case except `idle` carries the moment it began. Every clock and every
/// sort in the sidebar is computed from that timestamp, which is why a row only
/// moves when its state changes, never because time passed.
public enum AgentState: Hashable, Sendable {
    /// No agent attached.
    case idle
    case running(since: Date)
    /// Blocked on the user — the only state allowed to be blue.
    case needsInput(since: Date)
    case finished(at: Date)
    case failed(at: Date, reason: String? = nil)

    public var isBlocked: Bool {
        if case .needsInput = self { return true }
        return false
    }

    public var isRunning: Bool {
        if case .running = self { return true }
        return false
    }

    /// When a finished or failed state was reached, `nil` otherwise.
    var endedAt: Date? {
        switch self {
        case .finished(let at), .failed(let at, _): return at
        default: return nil
        }
    }

    var spokenDescription: String {
        switch self {
        case .idle: return "idle"
        case .running: return "running"
        case .needsInput: return "needs input"
        case .finished: return "finished"
        case .failed(_, let reason): return reason.map { "failed, \($0)" } ?? "failed"
        }
    }
}

public struct DiffStat: Hashable, Sendable {
    public var added: Int
    public var removed: Int

    public init(added: Int, removed: Int) {
        self.added = added
        self.removed = removed
    }
}

public struct Pane: Identifiable, Hashable, Sendable {
    public let id: String
    public var agent: String
    public var state: AgentState

    public init(id: String, agent: String, state: AgentState) {
        self.id = id
        self.agent = agent
        self.state = state
    }
}

public struct Workspace: Identifiable, Hashable, Sendable {
    public let id: String
    public var name: String
    /// Shown only at the expanded density — it is already in the title bar.
    public var path: String
    /// The agent driving the workspace. Shown on every row; nothing else says it.
    public var agent: String?
    public var branch: String?
    /// Uncommitted changes on `branch`.
    public var isDirty: Bool
    public var diff: DiffStat?
    public var port: Int?
    /// The remote host the workspace runs on, `nil` for this Mac.
    public var host: String?
    public var panes: [Pane]
    public var state: AgentState
    /// Pinned workspaces sit above the sort and never move.
    public var isPinned: Bool

    public init(
        id: String,
        name: String,
        path: String,
        agent: String? = nil,
        branch: String? = nil,
        isDirty: Bool = false,
        diff: DiffStat? = nil,
        port: Int? = nil,
        host: String? = nil,
        panes: [Pane] = [],
        state: AgentState = .idle,
        isPinned: Bool = false
    ) {
        self.id = id
        self.name = name
        self.path = path
        self.agent = agent
        self.branch = branch
        self.isDirty = isDirty
        self.diff = diff
        self.port = port
        self.host = host
        self.panes = panes
        self.state = state
        self.isPinned = isPinned
    }

    public var waitingPaneCount: Int {
        panes.filter { $0.state.isBlocked }.count
    }

    /// One sentence for VoiceOver. The clock is left out on purpose — it would
    /// otherwise be recited every second.
    var accessibilityLabel: String {
        var parts = [name, state.spokenDescription]
        if let agent { parts.append(agent) }
        if let host { parts.append("on \(host)") }
        if let branch { parts.append("branch \(branch)" + (isDirty ? ", uncommitted changes" : "")) }
        if panes.count > 1 {
            parts.append("\(panes.count) panes" + (waitingPaneCount > 0 ? ", \(waitingPaneCount) waiting" : ""))
        }
        if let diff { parts.append("\(diff.added) added, \(diff.removed) removed") }
        if let port { parts.append("port \(port)") }
        if isPinned { parts.append("pinned") }
        return parts.joined(separator: ", ")
    }
}
