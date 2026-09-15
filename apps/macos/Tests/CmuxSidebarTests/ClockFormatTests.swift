import Foundation
import Testing
@testable import CmuxSidebar

struct ClockFormatTests {
    @Test(arguments: zip(
        [0, 47, 63, 252, 1084, 3900] as [TimeInterval],
        ["0s", "47s", "1m03s", "4m12s", "18m04s", "1h05m"]
    ))
    func elapsed(_ interval: TimeInterval, _ expected: String) {
        #expect(ClockFormat.elapsed(interval) == expected)
    }

    @Test(arguments: zip(
        [30, 360, 660, 7200] as [TimeInterval],
        ["now", "6m ago", "11m ago", "2h ago"]
    ))
    func ago(_ interval: TimeInterval, _ expected: String) {
        #expect(ClockFormat.ago(interval) == expected)
    }

    @Test func negativeIntervalsClampToZero() {
        #expect(ClockFormat.elapsed(-5) == "0s")
    }

    @Test func idleHasNoClock() {
        #expect(ClockFormat.clock(for: .idle, at: .now) == nil)
    }
}
