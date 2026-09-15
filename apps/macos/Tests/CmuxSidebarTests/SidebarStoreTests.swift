import Foundation
import Testing
@testable import CmuxSidebar

@MainActor
final class Transcript {
    var messages: [String] = []
}

@MainActor
struct SidebarStoreTests {
    let now = Date(timeIntervalSinceReferenceDate: 800_000_000)

    private func ago(_ seconds: TimeInterval) -> Date {
        now.addingTimeInterval(-seconds)
    }

    private func makeStore(
        _ workspaces: [Workspace],
        selecting id: Workspace.ID? = nil,
        announce: @escaping @MainActor (String) -> Void = { _ in }
    ) -> SidebarStore {
        SidebarStore(workspaces: workspaces, selectedID: id, now: now, announce: announce)
    }

    private func workspace(
        _ id: String,
        _ state: AgentState = .idle,
        agent: String? = nil,
        branch: String? = nil,
        port: Int? = nil,
        host: String? = nil,
        panes: [Pane] = [],
        pinned: Bool = false
    ) -> Workspace {
        Workspace(
            id: id, name: id, path: "~/Repos/\(id)", agent: agent, branch: branch,
            port: port, host: host, panes: panes, state: state, isPinned: pinned
        )
    }

    private func order(_ store: SidebarStore) -> [String] {
        store.visibleWorkspaces.map(\.id)
    }

    // MARK: - Sorting

    @Test func groupsInAttentionOrder() {
        let store = makeStore([
            workspace("idle"),
            workspace("done", .finished(at: ago(60))),
            workspace("run", .running(since: ago(10))),
            workspace("blocked", .needsInput(since: ago(5))),
        ])
        #expect(store.sections.map(\.title) == ["Needs you", "Running", "Finished", "Idle"])
        #expect(order(store) == ["blocked", "run", "done", "idle"])
    }

    @Test func blockedRowsPutTheLongestWaitFirst() {
        let store = makeStore([
            workspace("short", .needsInput(since: ago(22))),
            workspace("long", .needsInput(since: ago(252))),
            workspace("mid", .needsInput(since: ago(63))),
        ])
        #expect(order(store) == ["long", "mid", "short"])
    }

    @Test func orderHoldsStillWhileTheClocksRun() {
        let store = makeStore([
            workspace("a", .running(since: ago(47))),
            workspace("b", .needsInput(since: ago(63))),
            workspace("c", .running(since: ago(1084))),
            workspace("d", .finished(at: ago(360))),
            workspace("e", .needsInput(since: ago(252))),
        ])
        let before = order(store)
        store.now = now.addingTimeInterval(50 * 60)
        #expect(order(store) == before)
    }

    @Test func finishedRowsAgeOutAfterAnHourButFailuresStay() {
        let store = makeStore([
            workspace("done", .finished(at: ago(10))),
            workspace("broke", .failed(at: ago(10))),
        ])
        store.now = now.addingTimeInterval(SidebarStore.finishedLifetime + 1)
        #expect(order(store) == ["broke"])
    }

    @Test func theSelectedRowNeverAgesOut() {
        let store = makeStore([workspace("done", .finished(at: ago(10)))], selecting: "done")
        store.now = now.addingTimeInterval(2 * SidebarStore.finishedLifetime)
        #expect(order(store) == ["done"])
    }

    @Test func pinnedRowsSitAboveTheSortAndNeverMove() {
        let store = makeStore([
            workspace("b", .running(since: ago(5)), pinned: true),
            workspace("blocked", .needsInput(since: ago(5))),
            workspace("a", pinned: true),
        ])
        #expect(store.sections.first?.title == "Pinned")
        #expect(order(store) == ["b", "a", "blocked"])
        store.setState(.needsInput(since: now), for: "a")
        #expect(order(store) == ["b", "a", "blocked"])
    }

    @Test func hostModeGroupsByHostWithThisMacFirst() {
        let store = makeStore([
            workspace("gpu", .running(since: ago(1)), host: "gpu-01"),
            workspace("local"),
            workspace("local-blocked", .needsInput(since: ago(1))),
        ])
        store.sortMode = .host
        #expect(store.sections.map(\.title) == ["This Mac", "gpu-01"])
        #expect(order(store) == ["local-blocked", "local", "gpu"])
    }

    // MARK: - Filter

    @Test(arguments: ["ssh", "fix/", "codex", "4000", ":40", "Repos/fix"])
    func filterMatchesNameBranchAgentPortAndPath(_ query: String) {
        let store = makeStore([
            workspace("fix-ssh", agent: "codex", branch: "fix/ssh", port: 4000),
            workspace("other"),
        ])
        store.filter = query
        #expect(order(store) == ["fix-ssh"])
    }

    @Test func collapsingClearsTheFilterAndTheHover() {
        let store = makeStore([workspace("a")])
        store.filter = "zzz"
        store.hoveredID = "a"
        store.setCollapsed(true)
        #expect(store.filter.isEmpty)
        #expect(store.hoveredID == nil)
    }

    // MARK: - Keyboard

    @Test func shortcutsNumberTheFirstNineVisibleRows() {
        let store = makeStore((1...11).map { workspace("w\($0)") })
        #expect(store.shortcutTarget(1)?.id == "w1")
        #expect(store.shortcutTarget(9)?.id == "w9")
        #expect(store.shortcutTarget(10) == nil)
        store.jump(toShortcut: 3)
        #expect(store.selectedID == "w3")
    }

    @Test func arrowsMoveTheCursorWithoutSwitching() {
        let store = makeStore([workspace("a"), workspace("b"), workspace("c")], selecting: "a")
        #expect(!store.isFocusVisible)

        store.moveFocus(by: 1)
        store.moveFocus(by: 1)
        store.moveFocus(by: 1)
        #expect(store.focusedID == "c")
        #expect(store.selectedID == "a")
        #expect(store.isFocusVisible)

        store.restoreFocus()
        #expect(store.focusedID == "a")

        store.moveFocus(by: 1)
        store.commitFocus()
        #expect(store.selectedID == "b")
    }

    @Test func nextBlockedCyclesLongestWaitFirst() {
        let store = makeStore([
            workspace("run", .running(since: ago(1))),
            workspace("short", .needsInput(since: ago(10))),
            workspace("long", .needsInput(since: ago(100))),
        ], selecting: "run")
        store.selectNextBlocked()
        #expect(store.selectedID == "long")
        store.selectNextBlocked()
        #expect(store.selectedID == "short")
        store.selectNextBlocked()
        #expect(store.selectedID == "long")
        store.selectNextBlocked(reverse: true)
        #expect(store.selectedID == "short")
    }

    @Test func typeAheadMovesTheCursorByNamePrefix() {
        let store = makeStore([workspace("alpha"), workspace("beta"), workspace("bravo")])
        let start = Date()
        store.typeAhead("b", at: start)
        #expect(store.focusedID == "beta")
        store.typeAhead("r", at: start.addingTimeInterval(0.3))
        #expect(store.focusedID == "bravo")
        store.typeAhead("a", at: start.addingTimeInterval(5))
        #expect(store.focusedID == "alpha")
    }

    @Test func keyboardLandingsFlashTheNameButClicksDoNot() {
        let store = makeStore([workspace("a"), workspace("b")], selecting: "a")
        store.select("b")
        #expect(store.keyboardFlash == nil)

        store.moveFocus(by: -1)
        let first = store.keyboardFlash
        #expect(first?.id == "a")

        // Clamped on the same row: still a fresh landing, so the name shows again.
        store.moveFocus(by: -1)
        #expect(store.keyboardFlash?.id == "a")
        #expect(store.keyboardFlash != first)

        store.jump(toShortcut: 2)
        #expect(store.keyboardFlash?.id == "b")
    }

    // MARK: - Attention list

    @Test func theAttentionListIsEveryBlockedWorkspaceLongestWaitFirst() {
        let store = makeStore([
            workspace("short", .needsInput(since: ago(10))),
            workspace("run", .running(since: ago(1))),
            workspace("long", .needsInput(since: ago(100))),
            workspace("mid", .needsInput(since: ago(50))),
        ])
        // Neither the filter nor the sort changes what's waiting.
        store.sortMode = .triage
        store.filter = "long"
        #expect(store.blockedWorkspaces.map(\.id) == ["long", "mid", "short"])
    }

    @Test func theAttentionListOpensOnlyWhenSomethingNeedsYou() {
        let store = makeStore([workspace("a", .running(since: ago(5)))])
        store.showAttentionList()
        #expect(!store.isAttentionListShown)

        store.setState(.needsInput(since: now), for: "a")
        store.setCollapsed(true)
        store.showAttentionList()
        #expect(store.isAttentionListShown)
        #expect(!store.isCollapsed)

        store.setCollapsed(true)
        #expect(!store.isAttentionListShown)
    }

    @Test func choosingFromTheListSwitchesAndClearsAFilterHidingIt() {
        let store = makeStore([
            workspace("a"),
            workspace("blocked", .needsInput(since: ago(5))),
        ], selecting: "a")
        store.filter = "a"
        store.showAttentionList()
        store.chooseFromAttentionList("blocked")
        #expect(store.selectedID == "blocked")
        #expect(store.filter.isEmpty)
        #expect(!store.isAttentionListShown)
    }

    @Test func closingTheListLeavesSelectionAndFilterAlone() {
        let store = makeStore([
            workspace("a"),
            workspace("blocked", .needsInput(since: ago(5))),
        ], selecting: "a")
        store.filter = "a"
        store.showAttentionList()
        store.closeAttentionList()
        #expect(!store.isAttentionListShown)
        #expect(store.selectedID == "a")
        #expect(store.filter == "a")
    }

    // MARK: - Sort and density

    @Test func choosingASortSaysWhichAndKeepsTheSelection() {
        let transcript = Transcript()
        let store = makeStore([
            workspace("a"),
            workspace("blocked", .needsInput(since: ago(5))),
        ], selecting: "a", announce: { transcript.messages.append($0) })
        store.setSortMode(.triage)
        store.setSortMode(.triage)
        #expect(store.sortMode == .triage)
        #expect(order(store) == ["a", "blocked"])
        #expect(store.selectedID == "a")
        #expect(transcript.messages == ["Sort: Triage."])
    }

    @Test func choosingADensitySaysWhichOnce() {
        let transcript = Transcript()
        let store = makeStore([workspace("a")], announce: { transcript.messages.append($0) })
        store.setDensity(.comfortable)
        store.setDensity(.compact)
        #expect(store.density == .compact)
        #expect(transcript.messages == ["Density: Compact."])
    }

    // MARK: - Triage

    @Test func triageKeepsTheOpenedOrderWithNoGroups() {
        let store = makeStore([
            workspace("idle"),
            workspace("blocked", .needsInput(since: ago(5))),
            workspace("run", .running(since: ago(10))),
        ])
        store.sortMode = .triage
        #expect(order(store) == ["idle", "blocked", "run"])
        #expect(store.sections.count == 1)
        #expect(store.sections.first?.title == "")
    }

    @Test func nothingMovesOrLeavesOnItsOwnInTriage() {
        let store = makeStore([
            workspace("a", .running(since: ago(5))),
            workspace("done", .finished(at: ago(10))),
            workspace("b", pinned: true),
        ])
        store.sortMode = .triage
        store.setState(.needsInput(since: now), for: "b")
        store.now = now.addingTimeInterval(2 * SidebarStore.finishedLifetime)
        #expect(order(store) == ["a", "done", "b"])
    }

    @Test func movesPlaceRelativeToANeighbour() {
        let store = makeStore([workspace("a"), workspace("b"), workspace("c"), workspace("d")])
        store.sortMode = .triage
        store.moveTriage("d", before: "b")
        #expect(order(store) == ["a", "d", "b", "c"])
        store.moveTriage("a", after: "c")
        #expect(order(store) == ["d", "b", "c", "a"])
    }

    @Test func keyboardMovesStepPastVisibleNeighboursAndSayWhere() {
        let transcript = Transcript()
        let store = makeStore(
            [
                workspace("a", agent: "claude"),
                workspace("hidden-x"),
                workspace("b", agent: "claude"),
                workspace("c", agent: "claude"),
            ],
            announce: { transcript.messages.append($0) }
        )
        store.sortMode = .triage

        // With hidden-x filtered out, c steps past b, its visible neighbour.
        store.filter = "claude"
        store.moveInTriage("c", by: -1)
        store.filter = ""
        #expect(order(store) == ["a", "hidden-x", "c", "b"])

        store.moveInTriage("a", by: 1)
        #expect(order(store) == ["hidden-x", "a", "c", "b"])
        #expect(transcript.messages == ["c, 2 of 3.", "a, 2 of 4."])
    }

    @Test func keyboardMovesDoNothingOutsideTriage() {
        let store = makeStore([workspace("a"), workspace("b")])
        store.moveInTriage("b", by: -1)
        store.sortMode = .triage
        #expect(order(store) == ["a", "b"])
    }

    @Test func newWorkspacesJoinTheBottomOfTriage() {
        let store = makeStore([workspace("a"), workspace("b")])
        store.sortMode = .triage
        store.moveTriage("b", before: "a")
        store.insert(workspace("new"), select: false)
        #expect(order(store) == ["b", "a", "new"])
    }

    // MARK: - Rename

    @Test func renameKeepsATrimmedNameAndRefusesAnEmptyOne() {
        let store = makeStore([workspace("a"), workspace("b")])
        store.beginRename("a")
        #expect(store.renamingID == "a")
        #expect(store.selectedID == "a")

        store.commitRename("  alpha  ")
        #expect(store.renamingID == nil)
        #expect(store.workspace("a")?.name == "alpha")

        store.beginRename("a")
        store.commitRename("   ")
        #expect(store.workspace("a")?.name == "alpha")

        store.beginRename("b")
        store.cancelRename()
        #expect(store.workspace("b")?.name == "b")
    }

    @Test func renamingDoesNotMoveTheRow() {
        let store = makeStore([
            workspace("z", .running(since: ago(5))),
            workspace("a", .running(since: ago(50))),
        ])
        let before = order(store)
        store.beginRename("z")
        store.commitRename("aaa")
        #expect(order(store) == before)
    }

    @Test func renamingWhileCollapsedReopensTheSidebar() {
        let store = makeStore([workspace("a")])
        store.setCollapsed(true)
        store.beginRename("a")
        #expect(!store.isCollapsed)
        #expect(store.renamingID == "a")
        store.setCollapsed(true)
        #expect(store.renamingID == nil)
    }

    // MARK: - Panes and announcements

    @Test func selectingAMultiPaneWorkspaceOpensItOnTheBlockedPane() {
        let panes = [
            Pane(id: "p1", agent: "gemini", state: .running(since: ago(5))),
            Pane(id: "p2", agent: "claude", state: .needsInput(since: ago(5))),
        ]
        let store = makeStore([workspace("multi", panes: panes), workspace("single")])
        store.select("multi")
        #expect(store.expandedIDs == ["multi"])
        #expect(store.currentPaneID(in: store.workspaces[0]) == "p2")
        store.select("single")
        #expect(store.expandedIDs.isEmpty)
    }

    @Test func announcesOnlyTheTransitionIntoNeedsInput() {
        let transcript = Transcript()
        let store = makeStore([workspace("fix-ssh", .running(since: ago(5)))]) {
            transcript.messages.append($0)
        }
        store.setState(.needsInput(since: now), for: "fix-ssh")
        store.setState(.needsInput(since: now), for: "fix-ssh")
        store.setState(.running(since: now), for: "fix-ssh")
        #expect(transcript.messages == ["fix-ssh needs input."])
    }
}
