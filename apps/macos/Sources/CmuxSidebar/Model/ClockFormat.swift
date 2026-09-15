import Foundation

/// The trailing clock on every row.
///
/// Live states count up — `47s`, `4m12s`, `2h05m` — because the question the
/// column answers is *which one has been stuck longest*. Ended states switch
/// to relative time: `6m ago`.
public enum ClockFormat {
    public static func elapsed(_ interval: TimeInterval) -> String {
        let seconds = max(0, Int(interval))
        switch seconds {
        case ..<60: return "\(seconds)s"
        case ..<3600: return "\(seconds / 60)m" + twoDigits(seconds % 60) + "s"
        default: return "\(seconds / 3600)h" + twoDigits(seconds % 3600 / 60) + "m"
        }
    }

    public static func ago(_ interval: TimeInterval) -> String {
        let seconds = max(0, Int(interval))
        switch seconds {
        case ..<60: return "now"
        case ..<3600: return "\(seconds / 60)m ago"
        default: return "\(seconds / 3600)h ago"
        }
    }

    /// The clock for a state, or `nil` for a state that has none.
    public static func clock(for state: AgentState, at now: Date) -> String? {
        switch state {
        case .idle:
            return nil
        case .running(let since), .needsInput(let since):
            return elapsed(now.timeIntervalSince(since))
        case .finished(let at), .failed(let at, _):
            return ago(now.timeIntervalSince(at))
        }
    }

    private static func twoDigits(_ value: Int) -> String {
        value < 10 ? "0\(value)" : "\(value)"
    }
}
