import SwiftUI

/// The leading state mark. Colour carries state, and every state also has its
/// own shape, so it still reads without colour.
struct StatusGlyph: View {
    let state: AgentState
    var size: CGFloat = Metrics.glyph

    var body: some View {
        Canvas { context, canvas in
            context.scaleBy(x: canvas.width / 10, y: canvas.height / 10)
            switch state {
            case .needsInput:
                context.fill(Path(ellipseIn: CGRect(x: 1.6, y: 1.6, width: 6.8, height: 6.8)), with: .color(Palette.signal))
            case .running:
                var arc = Path()
                arc.addArc(center: CGPoint(x: 5, y: 5), radius: 3.6, startAngle: .degrees(-90), endAngle: .degrees(180), clockwise: false)
                context.stroke(arc, with: .color(Palette.running), style: StrokeStyle(lineWidth: 1.5, lineCap: .round))
            case .finished:
                var check = Path()
                check.move(to: CGPoint(x: 1.6, y: 5.2))
                check.addLine(to: CGPoint(x: 3.9, y: 7.5))
                check.addLine(to: CGPoint(x: 8.4, y: 2.9))
                context.stroke(check, with: .color(Palette.good), style: StrokeStyle(lineWidth: 1.5, lineCap: .round, lineJoin: .round))
            case .failed:
                var cross = Path()
                cross.move(to: CGPoint(x: 2.2, y: 2.2))
                cross.addLine(to: CGPoint(x: 7.8, y: 7.8))
                cross.move(to: CGPoint(x: 7.8, y: 2.2))
                cross.addLine(to: CGPoint(x: 2.2, y: 7.8))
                context.stroke(cross, with: .color(Palette.bad), style: StrokeStyle(lineWidth: 1.5, lineCap: .round))
            case .idle:
                context.stroke(Path(ellipseIn: CGRect(x: 2.1, y: 2.1, width: 5.8, height: 5.8)), with: .color(Palette.idleRing), lineWidth: 1.3)
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

/// The blocked pip's loop — --animate-ring, 2600ms on --curve-out. Under Reduce
/// Motion it rests at full opacity: the lit end of the loop, never the dim one.
struct AttentionPulse: ViewModifier {
    let isActive: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.sidebarRenderMode) private var renderMode

    func body(content: Content) -> some View {
        if isActive, !reduceMotion, renderMode == .live {
            content.phaseAnimator([false, true]) { view, lit in
                view
                    .opacity(lit ? 1 : 0.4)
                    .shadow(color: Palette.ring.opacity(lit ? 0.28 : 0), radius: 9)
            } animation: { _ in
                Motion.pulseHalf
            }
        } else {
            content
        }
    }
}

/// The trailing clock. It ticks in its own `TimelineView`, so a running session
/// re-renders one `Text` a second rather than the list, and it is hidden from
/// VoiceOver, which would otherwise recite it every second.
struct StateClock: View {
    let state: AgentState
    var size: CGFloat = 10.5
    var onSelected = false
    @Environment(\.sidebarRenderMode) private var renderMode

    var body: some View {
        Group {
            if let frozen = renderMode.frozenNow {
                label(at: frozen)
            } else {
                TimelineView(.periodic(from: .now, by: ticksEverySecond ? 1 : 30)) { context in
                    label(at: context.date)
                }
            }
        }
        .accessibilityHidden(true)
    }

    private var ticksEverySecond: Bool { state.isBlocked || state.isRunning }

    @ViewBuilder
    private func label(at now: Date) -> some View {
        if let text = ClockFormat.clock(for: state, at: now) {
            Text(text)
                .font(SidebarFont.mono(size))
                .monospacedDigit()
                .foregroundStyle(color)
                .fixedSize()
        }
    }

    private var color: Color {
        switch state {
        case .needsInput: return Palette.signal
        case .failed: return Palette.bad
        default: return onSelected ? Palette.metaOnSelected : Palette.meta
        }
    }
}

struct Keycap: View {
    let label: String
    var size: CGFloat = 9
    var onSelected = false

    var body: some View {
        Text(label)
            .font(SidebarFont.mono(size))
            .foregroundStyle(onSelected ? Palette.metaOnSelected : Palette.muted)
            .padding(.horizontal, 3)
            .padding(.vertical, 2)
            .overlay(
                RoundedRectangle(cornerRadius: 3)
                    .strokeBorder(onSelected ? Palette.borderOnSelected : Palette.border, lineWidth: 1)
            )
            .fixedSize()
            .accessibilityHidden(true)
    }
}

struct SeparatorDot: View {
    var body: some View {
        Text("·")
            .font(SidebarFont.mono(10))
            .foregroundStyle(Palette.separator)
            .accessibilityHidden(true)
    }
}

struct CountBadge: View {
    let count: Int

    var body: some View {
        Text(count > 9 ? "9+" : "\(count)")
            .font(SidebarFont.mono(8, .semibold))
            .foregroundStyle(Palette.onSignal)
            .padding(.horizontal, count > 9 ? 2 : 0)
            .frame(minWidth: 12, minHeight: 12)
            .background(Palette.signal, in: Capsule())
            .accessibilityHidden(true)
    }
}
