import CmuxSidebar
import Foundation

/// Sessions taken from the redesign mockups (Main, Stress), so the prototype
/// can be checked against them side by side.
enum Scenario: String, CaseIterable, Identifiable {
    case main, stress, trio, empty

    var id: Self { self }

    var title: String {
        switch self {
        case .main: return "Nine Workspaces (Main mockup)"
        case .stress: return "Sixteen Workspaces (Stress mockup)"
        case .trio: return "Three Workspaces"
        case .empty: return "No Workspaces"
        }
    }

    var initialSelection: Workspace.ID? {
        self == .empty ? nil : "cmux-tui"
    }

    func workspaces(now: Date) -> [Workspace] {
        func ago(_ seconds: TimeInterval) -> Date { now.addingTimeInterval(-seconds) }

        let cmuxTUI = Workspace(
            id: "cmux-tui", name: "cmux-tui", path: "~/Repos/cmux/cmux-tui",
            agent: "claude", branch: "develop",
            panes: [
                Pane(id: "cmux-tui.claude", agent: "claude", state: .needsInput(since: ago(252))),
                Pane(id: "cmux-tui.gemini", agent: "gemini", state: .failed(at: ago(40), reason: "auth")),
            ],
            state: .needsInput(since: ago(252))
        )
        let fixSSH = Workspace(
            id: "fix-ssh", name: "fix-ssh", path: "~/Repos/cmux",
            agent: "codex", branch: "fix/ssh", diff: DiffStat(added: 38, removed: 12), port: 4000,
            state: .needsInput(since: ago(63))
        )
        let iosShell = Workspace(
            id: "ios-shell", name: "ios-shell", path: "~/Repos/cmux/ios-shell",
            agent: "claude", branch: "feat/ios-tabs", diff: DiffStat(added: 9, removed: 3),
            state: .needsInput(since: ago(22))
        )
        let webTokens = Workspace(
            id: "web-tokens", name: "web-tokens", path: "~/Repos/cmux/apps/web",
            agent: "claude", branch: "design/tui-rail", isDirty: true,
            diff: DiffStat(added: 142, removed: 38), port: 5173,
            state: .running(since: ago(47))
        )
        let apiMigrate = Workspace(
            id: "api-migrate", name: "api-migrate", path: "~/Repos/api",
            agent: "codex", branch: "feat/schema",
            state: .running(since: ago(158))
        )
        let train = Workspace(
            id: "train", name: "train", path: "~/model",
            agent: "claude", branch: "exp/lora", port: 8080, host: "gpu-01",
            state: .running(since: ago(1084))
        )
        let eval = Workspace(
            id: "eval", name: "eval", path: "~/model/eval",
            agent: "codex", branch: "exp/eval", host: "gpu-01",
            state: .running(since: ago(1081))
        )
        let chatmuxWS = Workspace(
            id: "chatmux-ws", name: "chatmux-ws", path: "~/Repos/chatmux",
            agent: "claude", branch: "feat/ws", diff: DiffStat(added: 64, removed: 21), port: 7070,
            state: .running(since: ago(191))
        )
        let docsAPI = Workspace(
            id: "docs-api", name: "docs-api", path: "~/Repos/docs",
            agent: "claude", branch: "docs/api", diff: DiffStat(added: 212, removed: 4),
            state: .finished(at: ago(360))
        )
        let ringAudit = Workspace(
            id: "ring-audit", name: "ring-audit", path: "~/Repos/cmux",
            agent: "codex", branch: "chore/ring-audit", diff: DiffStat(added: 18, removed: 96),
            state: .finished(at: ago(1440))
        )
        let perfBench = Workspace(
            id: "perf-bench", name: "perf-bench", path: "~/bench",
            agent: "codex", branch: "perf/rings",
            state: .failed(at: ago(660))
        )
        let desktopWin = Workspace(
            id: "desktop-win", name: "desktop-win", path: "~/Repos/cmux/desktop",
            agent: "claude", branch: "fix/win-dpi",
            state: .failed(at: ago(2460))
        )
        let mainWS = Workspace(
            id: "main", name: "main", path: "~/Repos/cmux",
            agent: "claude", branch: "main", port: 3000
        )
        let chatmux = Workspace(id: "chatmux", name: "chatmux", path: "~/Repos/chatmux", branch: "main")
        let cloudInfra = Workspace(id: "cloud-infra", name: "cloud-infra", path: "~/Repos/cloud", branch: "main")
        let site = Workspace(id: "site", name: "site", path: "~/Repos/site", branch: "main", port: 3001)

        switch self {
        case .main:
            return [cmuxTUI, fixSSH, webTokens, apiMigrate, train, docsAPI, perfBench, mainWS, chatmux]
        case .stress:
            return [
                cmuxTUI, fixSSH, iosShell, webTokens, apiMigrate, train, eval, chatmuxWS,
                docsAPI, ringAudit, perfBench, desktopWin, mainWS, chatmux, cloudInfra, site,
            ]
        case .trio:
            return [cmuxTUI, fixSSH, webTokens]
        case .empty:
            return []
        }
    }
}
