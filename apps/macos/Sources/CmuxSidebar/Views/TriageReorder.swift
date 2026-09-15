import AppKit
import SwiftUI

/// A row picked up in triage.
struct TriageReorder: Equatable {
    let id: Workspace.ID
    /// Visible rows at pick-up, top to bottom.
    let ids: [Workspace.ID]
    /// Their frames at pick-up, before anything moved.
    let frames: [Workspace.ID: CGRect]
    var translation: CGFloat = 0
    /// Set on release: the offset the row settles to before the new order commits.
    var landing: CGFloat?

    var plan: TriageDrag.Plan? {
        TriageDrag.plan(ids: ids, frames: frames, dragged: id, translation: translation)
    }
}

/// Click and drag to move a row in triage. A press held still for a tenth of a
/// second picks the row up — short enough to feel like one motion — while a
/// drag that is already moving before then stays a scroll. The rows it passes
/// scoot out of the way, and letting go settles it into the gap before the new
/// order is committed, so nothing jumps.
struct TriageReorderable: ViewModifier {
    let id: Workspace.ID
    let store: SidebarStore
    @Binding var reorder: TriageReorder?
    @Binding var frames: [Workspace.ID: CGRect]
    let coordinateSpace: String
    var isEnabled = true
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private static let holdToLift = 0.1

    func body(content: Content) -> some View {
        let isLifted = reorder?.id == id
        content
            .onGeometryChange(for: CGRect.self) { $0.frame(in: .named(coordinateSpace)) } action: { frame in
                frames[id] = frame
            }
            .background {
                if isLifted {
                    RoundedRectangle(cornerRadius: Metrics.rowRadius)
                        .fill(Palette.selected)
                        .shadow(color: .black.opacity(0.45), radius: 10, y: 4)
                        .padding(.horizontal, Metrics.rowInset)
                }
            }
            .offset(y: offset)
            .zIndex(isLifted ? 1 : 0)
            // The lifted row tracks the pointer exactly; everything else scoots.
            .animation(isLifted && reorder?.landing == nil ? nil : scoot, value: offset)
            .simultaneousGesture(pickUp, including: isEnabled ? .all : .subviews)
    }

    private var scoot: Animation? {
        reduceMotion ? nil : Motion.settle
    }

    private var offset: CGFloat {
        guard let reorder else { return 0 }
        if reorder.id == id { return reorder.landing ?? reorder.translation }
        return reorder.plan?.offsets[id] ?? 0
    }

    private var pickUp: some Gesture {
        LongPressGesture(minimumDuration: Self.holdToLift, maximumDistance: 4)
            .sequenced(before: DragGesture(minimumDistance: 0))
            .onChanged { value in
                guard case .second(true, let drag) = value else { return }
                if reorder == nil { lift() }
                guard reorder?.id == id, reorder?.landing == nil else { return }
                reorder?.translation = drag?.translation.height ?? 0
            }
            .onEnded { _ in drop() }
    }

    private func lift() {
        reorder = TriageReorder(id: id, ids: store.visibleWorkspaces.map(\.id), frames: frames)
        NSHapticFeedbackManager.defaultPerformer.perform(.generic, performanceTime: .now)
        NSCursor.closedHand.push()
    }

    private func drop() {
        guard let current = reorder, current.id == id, current.landing == nil else { return }
        NSCursor.pop()
        guard let plan = current.plan else {
            reorder = nil
            return
        }
        if reduceMotion {
            commit(current.id, plan)
            return
        }
        withAnimation(Motion.settle) { reorder?.landing = plan.landing }
        Task {
            try? await Task.sleep(for: .milliseconds(220))
            commit(current.id, plan)
        }
    }

    /// The row already sits in its new slot, so the order changes with no animation.
    private func commit(_ moving: Workspace.ID, _ plan: TriageDrag.Plan) {
        var transaction = Transaction()
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            if plan.insertion < plan.others.count {
                store.moveTriage(moving, before: plan.others[plan.insertion])
            } else if let last = plan.others.last {
                store.moveTriage(moving, after: last)
            }
            reorder = nil
        }
    }
}
