import SwiftUI

/// The blank space under the last row or pip. A double-click there opens a new
/// workspace, as a double-click on an empty tab bar opens a tab.
struct EmptySpace: View {
    let height: CGFloat
    let onDoubleClick: (() -> Void)?

    var body: some View {
        Color.clear
            .frame(maxWidth: .infinity)
            .frame(height: height)
            .newWorkspaceOnDoubleClick(onDoubleClick)
            .accessibilityHidden(true)
    }
}

extension View {
    /// The whole frame, blank or not, answers a double-click. There is no
    /// single-click action, so the double-click never waits to rule one out.
    func newWorkspaceOnDoubleClick(_ action: (() -> Void)?) -> some View {
        modifier(NewWorkspaceOnDoubleClick(action: action))
    }
}

private struct NewWorkspaceOnDoubleClick: ViewModifier {
    let action: (() -> Void)?

    func body(content: Content) -> some View {
        if let action {
            content
                .contentShape(Rectangle())
                .onTapGesture(count: 2, perform: action)
                .help("Double-click for a new workspace")
        } else {
            content
        }
    }
}
