import SwiftUI

/// Inline rename, in the name's own place and type. ↵ or clicking away keeps
/// the new name, ⎋ keeps the old one; the store refuses an empty name.
struct RenameField: View {
    let original: String
    let onCommit: (String) -> Void
    let onCancel: () -> Void
    @State private var text: String
    @State private var isFinished = false
    @FocusState private var isFocused: Bool
    @Environment(\.sidebarRenderMode) private var renderMode

    init(original: String, onCommit: @escaping (String) -> Void, onCancel: @escaping () -> Void) {
        self.original = original
        self.onCommit = onCommit
        self.onCancel = onCancel
        _text = State(initialValue: original)
    }

    var body: some View {
        Group {
            if renderMode == .live {
                TextField("Workspace name", text: $text)
                    .textFieldStyle(.plain)
                    .focused($isFocused)
                    .onSubmit { finish(keeping: true) }
                    .onExitCommand { finish(keeping: false) }
                    .onChange(of: isFocused) { _, focused in
                        if !focused { finish(keeping: true) }
                    }
                    // Next turn of the run loop, once the field is in the window.
                    .onAppear { Task { isFocused = true } }
            } else {
                Text(text).frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .font(SidebarFont.mono(12.5, .medium))
        .foregroundStyle(Palette.nameSelected)
        .lineLimit(1)
        .padding(.horizontal, 3)
        .frame(height: 18)
        .background(Palette.field, in: RoundedRectangle(cornerRadius: 4))
        .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(Palette.focus, lineWidth: 1))
        // Pull back by the padding so the text doesn't shift when editing starts.
        .padding(.leading, -3)
        .accessibilityLabel("Workspace name")
    }

    /// ↵, ⎋ and the blur that follows either can all arrive; only the first counts.
    private func finish(keeping: Bool) {
        guard !isFinished else { return }
        isFinished = true
        if keeping { onCommit(text) } else { onCancel() }
    }
}
