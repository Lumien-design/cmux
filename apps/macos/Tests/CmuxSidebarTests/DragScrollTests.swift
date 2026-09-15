import CoreGraphics
import Testing
@testable import CmuxSidebar

struct DragScrollTests {
    @Test(arguments: zip(
        [-50, 300, 700] as [CGFloat],
        [0, 300, 600] as [CGFloat]
    ))
    func clampsToTheScrollableRange(_ offset: CGFloat, _ expected: CGFloat) {
        #expect(DragScroll.clamp(offset, contentHeight: 1000, containerHeight: 400) == expected)
    }

    @Test func shortContentDoesNotScroll() {
        #expect(DragScroll.clamp(50, contentHeight: 200, containerHeight: 400) == 0)
    }

    @Test func insetsExtendTheRange() {
        #expect(DragScroll.clamp(-20, contentHeight: 1000, containerHeight: 400, topInset: 10) == -10)
        #expect(DragScroll.clamp(900, contentHeight: 1000, containerHeight: 400, bottomInset: 6) == 606)
    }
}
