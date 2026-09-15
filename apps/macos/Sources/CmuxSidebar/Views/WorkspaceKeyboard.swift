import SwiftUI

/// ↑↓ ↵ ⎋ and type-ahead, shared by the list and the collapsed rail so the
/// keyboard model survives the collapse. ← → only apply where panes can show.
/// Everything stands down while a name is being edited.
struct WorkspaceKeyboard: ViewModifier {
    let store: SidebarStore
    var handlesDisclosure = true

    func body(content: Content) -> some View {
        content
            .onKeyPress(.upArrow) { handle { store.moveFocus(by: -1) } }
            .onKeyPress(.downArrow) { handle { store.moveFocus(by: 1) } }
            .onKeyPress(.rightArrow) {
                guard handlesDisclosure else { return .ignored }
                return handle { store.expandFocused() }
            }
            .onKeyPress(.leftArrow) {
                guard handlesDisclosure else { return .ignored }
                return handle { store.collapseFocused() }
            }
            .onKeyPress(.return) { handle { store.commitFocus() } }
            .onKeyPress(.escape) { handle { store.restoreFocus() } }
            .onKeyPress(characters: .alphanumerics, phases: .down) { press in
                guard press.modifiers.isDisjoint(with: [.command, .control, .option]),
                      let character = press.characters.first
                else { return .ignored }
                return handle { store.typeAhead(character) }
            }
    }

    private func handle(_ action: () -> Void) -> KeyPress.Result {
        guard store.renamingID == nil else { return .ignored }
        action()
        return .handled
    }
}
