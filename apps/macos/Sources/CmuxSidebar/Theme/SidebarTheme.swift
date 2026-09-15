import AppKit
import SwiftUI

/// Colour values from the redesign spec (redesign — Anatomy, Main, States).
///
/// The sidebar lives inside the terminal window, which is dark in both themes,
/// so nothing here inverts. Where a spec value measured under 4.5:1 against the
/// ground it actually sits on, it has been lifted to the nearest passing value
/// and the spec value is kept in the comment.
enum Palette {
    // Surfaces
    static let rail = Color(hex: 0x17181A)
    static let hover = Color(hex: 0x202226)
    static let selected = Color(hex: 0x2B2E33)
    static let border = Color(hex: 0x2E3033)
    static let borderOnSelected = Color(hex: 0x44474D) // spec #2E3033 vanishes on #2B2E33
    static let paneCurrent = Color(hex: 0x232629)
    static let field = Color(hex: 0x111213)
    static let fieldBorder = Color(hex: 0x26282B)
    static let chip = Color(hex: 0x1F2124)
    static let groupRule = Color(hex: 0x232528)
    static let footerRule = Color(hex: 0x202225)

    // Ink
    static let nameText = Color(hex: 0xD6D7D9)
    static let nameSelected = Color(hex: 0xF2F2F2)
    static let meta = Color(hex: 0x8A8B8D) // 5.2:1 on rail, 4.6:1 on hover
    static let metaOnSelected = Color(hex: 0x96979A) // spec #8A8B8D: 3.9:1 on #2B2E33
    static let agent = Color(hex: 0x9A9B9D)
    static let muted = Color(hex: 0x808285) // spec #76787B / #6E7073 / #64666A: 3.0–3.9:1 on rail
    static let separator = Color(hex: 0x5A5C5F) // decorative
    static let selectionBar = Color(hex: 0xE8E8E8) // 11.1:1 on the selected surface

    // State. Blue means a pane is blocked on you — nothing else.
    static let signal = Color(hex: 0x5AA9FF)
    static let good = Color(hex: 0x4EC9A0)
    static let bad = Color(hex: 0xF4796F) // the spec's proposed --t-bad; not yet in packages/tokens
    static let dirty = Color(hex: 0xC8A24A)
    static let running = Color(hex: 0x9A9B9D)
    static let idleRing = Color(hex: 0x76787B) // spec #63656A: 3.0:1 on rail, 2.4:1 selected
    static let ring = Color(hex: 0x0A84FF) // --color-ring, the pulse glow
    static let onSignal = Color(hex: 0x06182C)
    static let focus = signal // 7.2:1 on the rail
}

enum Metrics {
    static let sidebarWidth: CGFloat = 296
    static let railWidth: CGFloat = 44
    static let rowInset: CGFloat = 6
    static let rowRadius: CGFloat = 6
    static let glyph: CGFloat = 9
    /// Line two indents to sit under the name.
    static let contextIndent: CGFloat = 15
}

/// The sanctioned curves from packages/tokens. Nothing else ships.
@MainActor
enum Motion {
    /// --curve-out: rows settling after a state change, panes opening.
    static let settle = Animation.timingCurve(0.23, 1, 0.32, 1, duration: 0.22)
    /// --curve-drawer: collapsing to the rail and back.
    static let drawer = Animation.timingCurve(0.32, 0.72, 0, 1, duration: 0.32)
    /// One half of --animate-ring (2600ms on --curve-out).
    static let pulseHalf = Animation.timingCurve(0.23, 1, 0.32, 1, duration: 1.3)
}

@MainActor
enum SidebarFont {
    private static let families = Set(NSFontManager.shared.availableFontFamilies)

    /// Google Sans Code when installed, SF Mono otherwise.
    static func mono(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        families.contains("Google Sans Code")
            ? .custom("Google Sans Code", size: size).weight(weight)
            : .system(size: size, weight: weight, design: .monospaced)
    }

    /// Google Sans Flex when installed, SF Pro otherwise.
    static func sans(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        families.contains("Google Sans Flex")
            ? .custom("Google Sans Flex", size: size).weight(weight)
            : .system(size: size, weight: weight)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

public enum SidebarRenderMode: Equatable, Sendable {
    case live
    /// A static render for `ImageRenderer`: no scroll views, no AppKit-backed
    /// controls, and every clock frozen at `now`.
    case snapshot(now: Date)

    var frozenNow: Date? {
        if case .snapshot(let now) = self { return now }
        return nil
    }
}

private struct SidebarRenderModeKey: EnvironmentKey {
    static let defaultValue = SidebarRenderMode.live
}

extension EnvironmentValues {
    public var sidebarRenderMode: SidebarRenderMode {
        get { self[SidebarRenderModeKey.self] }
        set { self[SidebarRenderModeKey.self] = newValue }
    }
}
