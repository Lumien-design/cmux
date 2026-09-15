import SwiftUI

/// One workspace. Line one is the scan line — state, name, clock. Line two is
/// the context line, muted so it never competes. The path appears only at the
/// expanded density; it is already in the title bar.
struct WorkspaceRow: View {
    let workspace: Workspace
    let density: Density
    let isSelected: Bool
    let isHovered: Bool
    let showsFocusRing: Bool
    /// The ⌘-number keycap, passed only while ⌘ is held.
    let shortcut: Int?
    var isRenaming = false
    var onRename: (String) -> Void = { _ in }
    var onCancelRename: () -> Void = {}

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            scanLine
            if density != .compact { contextLine }
            if density == .expanded { pathLine }
        }
        .padding(EdgeInsets(top: 6, leading: 10, bottom: 6, trailing: 8))
        .frame(maxWidth: .infinity, minHeight: density.rowHeight, alignment: .leading)
        .background(surface, in: RoundedRectangle(cornerRadius: Metrics.rowRadius))
        .overlay {
            // Inside the row, not at the mockup's 1pt outset: an outset ring is
            // clipped by the group header above or below it.
            if showsFocusRing {
                RoundedRectangle(cornerRadius: Metrics.rowRadius)
                    .strokeBorder(Palette.focus, lineWidth: 2)
            }
        }
        .overlay(alignment: .leading) {
            // Selection gets a surface lift and a neutral bar — no colour. The
            // bar draws over the ring, so a row that is both still reads as both.
            if isSelected {
                RoundedRectangle(cornerRadius: 1)
                    .fill(Palette.selectionBar)
                    .frame(width: 2)
                    .padding(.vertical, 5)
            }
        }
        .padding(.horizontal, Metrics.rowInset)
        .contentShape(Rectangle())
    }

    private var surface: Color {
        if isSelected { return Palette.selected }
        return isHovered ? Palette.hover : .clear
    }

    private var metaColor: Color { isSelected ? Palette.metaOnSelected : Palette.meta }

    private var scanLine: some View {
        HStack(spacing: 7) {
            StatusGlyph(state: workspace.state)
            if isRenaming {
                RenameField(original: workspace.name, onCommit: onRename, onCancel: onCancelRename)
            } else {
                Text(workspace.name)
                    .font(SidebarFont.mono(12.5, .medium))
                    .foregroundStyle(isSelected ? Palette.nameSelected : Palette.nameText)
                    .lineLimit(1)
                    .truncationMode(.tail)
            }
            if workspace.isPinned {
                Image(systemName: "pin.fill")
                    .font(.system(size: 7.5))
                    .foregroundStyle(Palette.muted)
                    .accessibilityHidden(true)
            }
            Spacer(minLength: 4)
            if let shortcut {
                Keycap(label: "\(shortcut)", onSelected: isSelected)
            }
            StateClock(state: workspace.state, onSelected: isSelected)
        }
        .frame(height: 16)
    }

    private var contextLine: some View {
        let segments = self.segments
        return HStack(spacing: 6) {
            ForEach(segments.indices, id: \.self) { index in
                if index > 0 { SeparatorDot() }
                segmentView(segments[index])
            }
        }
        .font(SidebarFont.mono(10.5))
        .foregroundStyle(metaColor)
        .lineLimit(1)
        .padding(.leading, Metrics.contextIndent)
        .frame(height: 14)
    }

    private var pathLine: some View {
        Text(workspace.path)
            .font(SidebarFont.mono(10.5))
            .foregroundStyle(isSelected ? Palette.metaOnSelected : Palette.muted)
            .lineLimit(1)
            .truncationMode(.middle)
            .padding(.leading, Metrics.contextIndent)
            .frame(height: 14)
    }

    private enum Segment {
        case agent(String)
        case host(String)
        case branch(String, isDirty: Bool)
        case panes(total: Int, waiting: Int)
        case diff(DiffStat)
        case port(Int)
    }

    private var segments: [Segment] {
        var result: [Segment] = []
        if let agent = workspace.agent { result.append(.agent(agent)) }
        if let host = workspace.host { result.append(.host(host)) }
        if let branch = workspace.branch { result.append(.branch(branch, isDirty: workspace.isDirty)) }
        if workspace.panes.count > 1 {
            result.append(.panes(total: workspace.panes.count, waiting: workspace.waitingPaneCount))
        }
        if let diff = workspace.diff { result.append(.diff(diff)) }
        if let port = workspace.port { result.append(.port(port)) }
        return result
    }

    @ViewBuilder
    private func segmentView(_ segment: Segment) -> some View {
        switch segment {
        case .agent(let agent):
            Text(agent)
                .font(SidebarFont.mono(10))
                .foregroundStyle(Palette.agent)
                .fixedSize()
        case .host(let host):
            HStack(spacing: 3) {
                icon("server.rack")
                Text(host)
            }
            .fixedSize()
        case .branch(let branch, let isDirty):
            // The one segment that truncates; everything else keeps its size.
            HStack(spacing: 3) {
                icon("arrow.triangle.branch")
                Text(branch).truncationMode(.tail)
                if isDirty {
                    Text("*").foregroundStyle(Palette.dirty).fixedSize()
                }
            }
            .layoutPriority(-1)
        case .panes(let total, let waiting):
            HStack(spacing: 3) {
                icon("rectangle.split.2x1")
                Text("\(total)")
                if waiting > 0 {
                    Text("\(waiting) waiting").foregroundStyle(Palette.signal)
                }
            }
            .fixedSize()
        case .diff(let diff):
            HStack(spacing: 4) {
                Text("+\(diff.added)").foregroundStyle(Palette.good)
                Text("−\(diff.removed)").foregroundStyle(Palette.bad)
            }
            .fontWeight(.medium)
            .fixedSize()
        case .port(let port):
            Text(":\(String(port))")
                .foregroundStyle(Palette.good)
                .fixedSize()
        }
    }

    private func icon(_ name: String) -> some View {
        Image(systemName: name)
            .font(.system(size: 8.5))
            .accessibilityHidden(true)
    }
}

/// A pane under an expanded workspace. The unit of attention is the pane, so
/// the pane gets a row.
struct PaneRow: View {
    let pane: Pane
    let isCurrent: Bool

    var body: some View {
        HStack(spacing: 7) {
            StatusGlyph(state: pane.state)
            Text(pane.agent).lineLimit(1)
            Spacer(minLength: 4)
            if case .failed(_, let reason?) = pane.state {
                Text(reason)
                    .font(SidebarFont.mono(10.5))
                    .foregroundStyle(Palette.bad)
                    .accessibilityHidden(true)
            } else {
                StateClock(state: pane.state, onSelected: isCurrent)
            }
        }
        .font(SidebarFont.mono(11))
        .foregroundStyle(isCurrent ? Palette.nameText : Palette.agent)
        .padding(EdgeInsets(top: 4, leading: 26, bottom: 4, trailing: 8))
        .background(isCurrent ? Palette.paneCurrent : .clear, in: RoundedRectangle(cornerRadius: 5))
        .padding(.horizontal, Metrics.rowInset)
        .contentShape(Rectangle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(pane.agent) pane, \(pane.state.spokenDescription)")
        .accessibilityAddTraits(isCurrent ? [.isButton, .isSelected] : .isButton)
    }
}

/// A 1pt rule with a label and a count. It costs 22pt and lets you jump with
/// your eyes instead of reading every row.
struct GroupHeader: View {
    let title: String
    let count: Int

    var body: some View {
        HStack(spacing: 6) {
            Text(title.uppercased()).kerning(1.05)
            Text("\(count)").monospacedDigit()
            Rectangle().fill(Palette.groupRule).frame(height: 1)
        }
        .font(SidebarFont.mono(9.5))
        .foregroundStyle(Palette.muted)
        .padding(EdgeInsets(top: 9, leading: 12, bottom: 4, trailing: 12))
        .frame(maxWidth: .infinity, alignment: .leading)
        // Headers stick; the rail colour hides rows scrolling underneath.
        .background(Palette.rail)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(title), \(count)")
        .accessibilityAddTraits(.isHeader)
    }
}
