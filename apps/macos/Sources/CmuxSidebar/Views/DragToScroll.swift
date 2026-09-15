import AppKit
import SwiftUI

enum DragScroll {
    /// Clamps a target offset to the scrollable range, so a drag or a flick
    /// stops at the ends instead of pulling the content off screen.
    static func clamp(
        _ offset: CGFloat,
        contentHeight: CGFloat,
        containerHeight: CGFloat,
        topInset: CGFloat = 0,
        bottomInset: CGFloat = 0
    ) -> CGFloat {
        let top = -topInset
        let bottom = max(top, contentHeight - containerHeight + bottomInset)
        return min(max(offset, top), bottom)
    }
}

/// Click-and-drag scrolling: grab the list and move it; let go mid-flick and
/// it coasts. Clicks still land, because the drag only starts once the pointer
/// has moved a few points, and `isDragging` lets the release skip selection.
struct DragToScroll: ViewModifier {
    @Binding var isDragging: Bool
    var isEnabled = true
    @State private var position = ScrollPosition(edge: .top)
    @State private var geometry: ScrollGeometry?
    @State private var startOffset: CGFloat?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .scrollPosition($position)
            .onScrollGeometryChange(for: ScrollGeometry.self, of: { $0 }) { _, new in
                geometry = new
            }
            .simultaneousGesture(drag, including: isEnabled ? .all : .subviews)
    }

    private var drag: some Gesture {
        DragGesture(minimumDistance: 4)
            .onChanged { value in
                guard let geometry else { return }
                let start = startOffset ?? geometry.contentOffset.y
                if startOffset == nil {
                    startOffset = start
                    isDragging = true
                    NSCursor.closedHand.push()
                }
                position.scrollTo(y: clamped(start - value.translation.height, in: geometry))
            }
            .onEnded { value in
                guard let start = startOffset else { return }
                if let geometry, !reduceMotion {
                    let target = clamped(start - value.predictedEndTranslation.height, in: geometry)
                    withAnimation(.timingCurve(0.23, 1, 0.32, 1, duration: 0.45)) { // --curve-out
                        position.scrollTo(y: target)
                    }
                }
                NSCursor.pop()
                startOffset = nil
                // The mouse-up that ends a drag is not a click on the row under it.
                Task {
                    try? await Task.sleep(for: .milliseconds(50))
                    isDragging = false
                }
            }
    }

    private func clamped(_ offset: CGFloat, in geometry: ScrollGeometry) -> CGFloat {
        DragScroll.clamp(
            offset,
            contentHeight: geometry.contentSize.height,
            containerHeight: geometry.containerSize.height,
            topInset: geometry.contentInsets.top,
            bottomInset: geometry.contentInsets.bottom
        )
    }
}
