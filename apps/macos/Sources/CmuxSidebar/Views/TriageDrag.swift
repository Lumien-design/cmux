import CoreGraphics

/// Where a dragged row lands in triage and how far every other row scoots to
/// make room. Pure layout arithmetic over the frames taken when the row was
/// picked up, so it can be tested without a window.
enum TriageDrag {
    struct Plan: Equatable {
        /// The dragged row goes before `others[insertion]`; `others.count` means last.
        var insertion: Int
        /// The rows other than the dragged one, top to bottom.
        var others: [String]
        /// How far each other row moves, by id: plus the dragged row's height if
        /// it scoots down, minus if it scoots up, zero if it stays.
        var offsets: [String: CGFloat]
        /// Where the dragged row's slot ends up, relative to where it started.
        var landing: CGFloat
    }

    /// - Parameters:
    ///   - ids: Rows in display order, the dragged one included.
    ///   - frames: Each row's frame at pick-up. A missing frame means no plan.
    ///   - translation: How far the pointer has moved since pick-up.
    ///   - spacing: The gap between rows.
    static func plan(
        ids: [String],
        frames: [String: CGRect],
        dragged: String,
        translation: CGFloat,
        spacing: CGFloat = 1
    ) -> Plan? {
        guard let from = ids.firstIndex(of: dragged),
              let own = frames[dragged],
              ids.allSatisfy({ frames[$0] != nil })
        else { return nil }

        let others = ids.filter { $0 != dragged }
        // The row goes past every neighbour whose middle its own middle has crossed.
        let centre = own.midY + translation
        let insertion = others.filter { frames[$0]!.midY < centre }.count

        let shift = own.height + spacing
        var offsets: [String: CGFloat] = [:]
        for (index, id) in others.enumerated() {
            let before = index < from ? index : index + 1
            let after = index < insertion ? index : index + 1
            offsets[id] = CGFloat(after - before) * shift
        }

        let landing: CGFloat
        if insertion == from {
            landing = 0
        } else if insertion < from {
            landing = frames[others[insertion]]!.minY - own.minY
        } else {
            landing = frames[others[insertion - 1]]!.maxY - own.maxY
        }
        return Plan(insertion: insertion, others: others, offsets: offsets, landing: landing)
    }
}
