import SwiftUI

/// Pip bounds by workspace, so the name flash can line up with its pip.
struct PipBoundsKey: PreferenceKey {
    static var defaultValue: [Workspace.ID: Anchor<CGRect>] { [:] }

    static func reduce(value: inout [Workspace.ID: Anchor<CGRect>], nextValue: () -> [Workspace.ID: Anchor<CGRect>]) {
        value.merge(nextValue()) { $1 }
    }
}

/// The collapsed rail has no names, so a workspace's name shows beside its pip
/// in two cases. Pointing at a pip shows it for as long as the pointer stays. A
/// keyboard landing — ↑↓, ⌥⇥, ⌘1–9, type-ahead — shows it for a moment, then
/// fades, and wins over the hover until it does. Either way a new name replaces
/// the old one at once, so moving quickly never leaves a trail of fading names.
struct RailNameFlash: View {
    let store: SidebarStore
    let anchors: [Workspace.ID: Anchor<CGRect>]
    /// The keyboard landing still inside its hold.
    @State private var flash: KeyboardFlash?
    @State private var shownID: Workspace.ID?
    @State private var isFading = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.sidebarRenderMode) private var renderMode

    private static let hold = Duration.milliseconds(800)
    private static let fade = Duration.milliseconds(220) // Motion.settle

    var body: some View {
        let current = renderMode == .live ? shownID : (store.keyboardFlash?.id ?? store.hoveredID)
        GeometryReader { proxy in
            if let current, let anchor = anchors[current], let workspace = store.workspace(current) {
                let pip = proxy[anchor]
                NameTag(name: workspace.name)
                    .fixedSize()
                    .opacity(isFading ? 0 : 1)
                    .offset(x: Metrics.railWidth + 4, y: pip.midY - NameTag.height / 2)
            }
        }
        .allowsHitTesting(false)
        // VoiceOver already reads the pip's full label.
        .accessibilityHidden(true)
        .onChange(of: store.keyboardFlash) { _, landing in
            flash = landing
            update()
        }
        .onChange(of: store.hoveredID) { update() }
        .task(id: flash) {
            guard flash != nil else { return }
            try? await Task.sleep(for: Self.hold)
            guard !Task.isCancelled else { return }
            flash = nil
            update()
        }
        .task(id: isFading) {
            guard isFading else { return }
            try? await Task.sleep(for: Self.fade)
            guard !Task.isCancelled else { return }
            shownID = nil
            isFading = false
        }
    }

    /// Shows the keyboard landing while it holds, else the pointed-at pip, else
    /// fades out. A new name never fades in: it simply replaces the old one.
    private func update() {
        if let target = flash?.id ?? store.hoveredID {
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) {
                shownID = target
                isFading = false
            }
        } else if shownID != nil, !isFading {
            withAnimation(reduceMotion ? nil : Motion.settle) { isFading = true }
        }
    }
}

struct NameTag: View {
    static let height: CGFloat = 22
    let name: String

    var body: some View {
        Text(name)
            .font(SidebarFont.mono(11.5, .medium))
            .foregroundStyle(Palette.nameSelected)
            .lineLimit(1)
            .padding(.horizontal, 8)
            .frame(height: Self.height)
            .background(Palette.selected, in: RoundedRectangle(cornerRadius: 6))
            .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(Palette.borderOnSelected, lineWidth: 1))
            .shadow(color: .black.opacity(0.35), radius: 6, y: 2)
    }
}
