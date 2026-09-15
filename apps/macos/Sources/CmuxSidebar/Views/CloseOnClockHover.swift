import SwiftUI

/// A row's ✕. It takes the clock's place only while the pointer is on or near
/// the clock, so a pass down the list never lights up a column of ✕s. Apply it
/// after the row's taps: the ✕ then sits outside them, and closing a row never
/// also selects it, while a click beside the ✕ still does.
struct CloseOnClockHover: ViewModifier {
    let id: Workspace.ID
    let name: String
    let store: SidebarStore
    let isEnabled: Bool
    let onClose: () -> Void
    @State private var width: CGFloat = 0

    /// Measured from the row's trailing edge: the widest clock (18m04s), the
    /// row's insets, and a little slack.
    private static let zoneWidth: CGFloat = 64
    /// The scan line and the padding either side of it.
    private static let zoneHeight: CGFloat = 28

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .topTrailing) {
                if isEnabled, store.hoveredClockID == id {
                    Button(action: onClose) {
                        Image(systemName: "xmark").font(.system(size: 8.5, weight: .semibold))
                    }
                    .buttonStyle(CloseButtonStyle())
                    .help("Close \(name)")
                    .accessibilityLabel("Close \(name)")
                    // Centred on the scan line, the glyph ending where the clock ends.
                    .padding(.top, 6)
                    .padding(.trailing, 9)
                }
            }
            // After the overlay, so pointing at the ✕ itself still counts as near.
            .onGeometryChange(for: CGFloat.self, of: { $0.size.width }) { width = $0 }
            .onContinuousHover { phase in
                let isNear: Bool
                switch phase {
                case .active(let location):
                    isNear = isEnabled && location.x >= width - Self.zoneWidth && location.y <= Self.zoneHeight
                case .ended:
                    isNear = false
                }
                if isNear, store.hoveredClockID != id {
                    store.hoveredClockID = id
                } else if !isNear, store.hoveredClockID == id {
                    store.hoveredClockID = nil
                }
            }
    }
}

private struct CloseButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        CloseButtonChrome(configuration: configuration)
    }
}

/// Its own chrome rather than `IconButtonStyle`, whose hover fill is the
/// hovered row's own colour and would vanish into it.
private struct CloseButtonChrome: View {
    let configuration: ButtonStyleConfiguration
    @State private var isHovered = false

    var body: some View {
        let isLit = isHovered || configuration.isPressed
        configuration.label
            .foregroundStyle(isLit ? Palette.nameSelected : Palette.meta)
            .frame(width: 16, height: 16)
            .background(isLit ? Palette.borderOnSelected : .clear, in: RoundedRectangle(cornerRadius: 4))
            .contentShape(Rectangle())
            .onHover { isHovered = $0 }
    }
}
