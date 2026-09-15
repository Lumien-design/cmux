import CoreGraphics
import Testing
@testable import CmuxSidebar

/// Four 44pt rows with a 1pt gap: a at 0, b at 45, c at 90, d at 135.
struct TriageDragTests {
    let ids = ["a", "b", "c", "d"]
    let frames: [String: CGRect] = [
        "a": CGRect(x: 0, y: 0, width: 280, height: 44),
        "b": CGRect(x: 0, y: 45, width: 280, height: 44),
        "c": CGRect(x: 0, y: 90, width: 280, height: 44),
        "d": CGRect(x: 0, y: 135, width: 280, height: 44),
    ]

    @Test func draggingDownScootsTheRowsItPassesUp() throws {
        let plan = try #require(TriageDrag.plan(ids: ids, frames: frames, dragged: "b", translation: 60))
        #expect(plan.insertion == 2)
        #expect(plan.offsets == ["a": 0, "c": -45, "d": 0])
        #expect(plan.landing == 45)
    }

    @Test func draggingUpScootsTheRowsItPassesDown() throws {
        let plan = try #require(TriageDrag.plan(ids: ids, frames: frames, dragged: "d", translation: -100))
        #expect(plan.insertion == 1)
        #expect(plan.offsets == ["a": 0, "b": 45, "c": 45])
        #expect(plan.landing == -90)
    }

    @Test func aSmallNudgeStaysPut() throws {
        let plan = try #require(TriageDrag.plan(ids: ids, frames: frames, dragged: "b", translation: 15))
        #expect(plan.insertion == 1)
        #expect(plan.offsets.values.allSatisfy { $0 == 0 })
        #expect(plan.landing == 0)
    }

    @Test func draggingPastTheEndLandsLast() throws {
        let plan = try #require(TriageDrag.plan(ids: ids, frames: frames, dragged: "a", translation: 400))
        #expect(plan.insertion == 3)
        #expect(plan.offsets == ["b": -45, "c": -45, "d": -45])
        #expect(plan.landing == 135)
    }

    @Test func aMissingFrameMeansNoPlan() {
        var partial = frames
        partial["c"] = nil
        #expect(TriageDrag.plan(ids: ids, frames: partial, dragged: "b", translation: 60) == nil)
    }
}
