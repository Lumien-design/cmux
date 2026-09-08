import type { ShellState } from '@/components/app-shell';
import { palette, programmable } from '@/content/site';

/**
 * Fixture data for the app mock: branches, paths, ports, commands, config.
 *
 * Kept out of site.ts deliberately, and the split is by kind rather than by
 * convenience. site.ts is writing — headings, bodies, bullets — and the design
 * rules test lints it for prose: no hyphens, no clichés, no invented numbers.
 * This file is interface content. `feat/pr-status`, `--direction right` and
 * `gpu-01` are identifiers, not prose, and a prose lint would mangle them.
 *
 * Everything here still has to be true. Branch names are plausible rather than
 * real, but every command, port convention, shortcut and feature shown maps to
 * something cmux documents. The window says it is a mock in its own caption.
 */

/* ── hero ────────────────────────────────────────────────────────────────── */

export const heroShell: ShellState = {
  label:
    'A cmux window with three workspaces in the sidebar and two terminal panes. The right pane is ringed in blue because its agent is waiting for input.',
  density: 'compact',
  list: {
    workspaces: [
      { name: 'main', path: '~/cmux', ports: [':3000'], active: true },
      { name: 'feat/rings', path: '~/web', ports: [':5173'], waiting: true },
      { name: 'docs', path: '~/docs' },
    ],
  },
  detail: {
    kind: 'split',
    direction: 'row',
    panes: [
      {
        kind: 'terminal',
        title: 'claude',
        lines: [
          { text: '$ claude', tone: 'dim' },
          { text: '› reading tokens.css' },
          { text: '› 41 files changed' },
          { text: '› running tests' },
        ],
      },
      {
        kind: 'terminal',
        title: 'codex',
        waiting: true,
        lines: [
          { text: '$ codex', tone: 'dim' },
          { text: '› migration written' },
          { text: 'Apply to database? (y/n)', tone: 'bright' },
          { text: '● waiting for you', tone: 'signal' },
        ],
      },
    ],
  },
};

/* ── the five panels ─────────────────────────────────────────────────────── */

const rail = (active: 'sidebar' | 'palette' | 'bell' | 'browser', badge?: number) =>
  [
    { icon: 'sidebar' as const, label: 'Toggle left sidebar · Command B', active: active === 'sidebar' },
    { icon: 'palette' as const, label: 'Command palette · Command Shift P', active: active === 'palette' },
    {
      icon: 'bell' as const,
      label: 'Jump to latest unread · Command Shift U',
      active: active === 'bell',
      badge,
    },
    { icon: 'browser' as const, label: 'New browser · Command Shift L', active: active === 'browser' },
  ] as const;

export const panelShells: Record<string, ShellState> = {
  attention: {
    label:
      'The cmux window with two terminal panes, the right one ringed in blue and waiting, and the notification panel open listing three pending items.',
    rail: rail('bell', 3),
    list: {
      workspaces: [
        { name: 'main', path: '~/cmux', branch: 'main', ports: [':3000'], active: true },
        { name: 'feat/rings', path: '~/web', branch: 'feat/rings', waiting: true },
        { name: 'fix/ssh', path: '~/cmux', branch: 'fix/ssh', waiting: true },
        { name: 'docs', path: '~/docs', branch: 'docs/api' },
      ],
    },
    tabs: [
      { name: 'claude', active: true },
      { name: 'codex', waiting: true },
    ],
    detail: {
      kind: 'split',
      direction: 'row',
      panes: [
        {
          kind: 'terminal',
          title: 'claude',
          lines: [
            { text: '$ git switch feat/rings', tone: 'dim' },
            { text: '$ claude', tone: 'dim' },
            { text: '› reading tokens.css' },
            { text: '› reading app-shell.tsx' },
            { text: '› 41 files changed' },
            { text: '› running tests', tone: 'dim' },
            { text: '✓ 16 passed', tone: 'good' },
            { text: '› waiting on the second agent', tone: 'dim' },
          ],
        },
        {
          kind: 'terminal',
          title: 'codex',
          waiting: true,
          lines: [
            { text: '$ codex', tone: 'dim' },
            { text: '› reading schema.sql' },
            { text: '› migration written' },
            { text: '  add ring_state to panes', tone: 'dim' },
            { text: 'Apply to database? (y/n)', tone: 'bright' },
            { text: '● waiting for you', tone: 'signal' },
          ],
        },
      ],
    },
    aside: {
      title: 'Notifications',
      items: [
        { workspace: 'codex', text: 'Apply to database?', ago: '12s', unread: true },
        { workspace: 'fix/ssh', text: 'Approve edit?', ago: '4m', unread: true },
        { workspace: 'docs', text: 'Build finished', ago: '9m' },
      ],
    },
  },

  organize: {
    label:
      'The cmux sidebar filtered to four workspaces, each row showing its git branch, pull request status and listening ports.',
    rail: rail('sidebar'),
    list: {
      filter: 'ring',
      workspaces: [
        {
          group: 'Local',
          name: 'feat/rings',
          path: '~/web',
          branch: 'feat/rings',
          pr: { num: '#412', state: 'checks' },
          ports: [':5173'],
          active: true,
        },
        {
          name: 'ring-audit',
          path: '~/cmux',
          branch: 'chore/ring-audit',
          pr: { num: '#418', state: 'draft' },
        },
        {
          name: 'ring-docs',
          path: '~/docs',
          branch: 'docs/rings',
          pr: { num: '#420', state: 'open' },
          ports: [':4000'],
        },
        { name: 'ring-bench', path: '~/bench', branch: 'perf/rings', ports: [':9229'] },
      ],
    },
    tabs: [
      { name: 'feat/rings', active: true },
      { name: 'ring-docs' },
      { name: 'ring-bench' },
    ],
    detail: {
      kind: 'terminal',
      title: 'feat/rings',
      lines: [
        { text: '$ git switch feat/rings', tone: 'dim' },
        { text: 'Switched to branch feat/rings' },
        { text: '$ gh pr status', tone: 'dim' },
        { text: '#412 ring state on panes', tone: 'bright' },
        { text: '$ git status', tone: 'dim' },
        { text: 'On branch feat/rings' },
        { text: '✓ checks passed · #412', tone: 'good' },
        { text: '$ npm run dev', tone: 'dim' },
        { text: '› listening on :5173', tone: 'good' },
      ],
    },
    prompt: { agent: 'claude', value: 'why did the ring stop firing on tab two' },
  },

  browser: {
    label:
      'A cmux window split between a terminal running a browser command and the in app browser pane, with the agent pointer visible on the page.',
    rail: rail('browser'),
    list: {
      workspaces: [
        { name: 'main', path: '~/cmux', branch: 'main', ports: [':3000'], active: true },
        { name: 'feat/rings', path: '~/web', branch: 'feat/rings', ports: [':5173'] },
        { name: 'docs', path: '~/docs', branch: 'docs/api' },
      ],
    },
    detail: {
      kind: 'split',
      direction: 'row',
      panes: [
        {
          kind: 'terminal',
          title: 'claude',
          lines: [
            { text: '$ cmux browser snapshot', tone: 'dim' },
            { text: '› 34 nodes in the tree' },
            { text: '$ cmux browser click "Sign in"', tone: 'dim' },
            { text: '› clicked', tone: 'good' },
          ],
        },
        {
          kind: 'browser',
          url: 'localhost:3000/settings',
          chip: 'Cookies from Arc',
          blocks: [
            { kind: 'bar', w: 62 },
            { kind: 'bar', w: 38 },
            { kind: 'field', value: 'you@example.com' },
            { kind: 'field', value: '••••••••••••' },
            { kind: 'box', h: 1.1 },
            { kind: 'bar', w: 44 },
            { kind: 'box', h: 0.7 },
            { kind: 'cursor', label: 'agent' },
          ],
        },
      ],
    },
    prompt: { agent: 'claude', value: 'log in and screenshot the settings page' },
  },

  remote: {
    label:
      'A cmux window with workspaces grouped under a remote host, and a vertical split where a browser pane resolves a localhost URL on that machine.',
    rail: rail('browser'),
    list: {
      workspaces: [
        {
          group: 'ssh://gpu-01',
          name: 'train',
          path: '~/model',
          branch: 'exp/lora',
          host: 'gpu-01',
          ports: [':8080'],
          active: true,
        },
        { name: 'eval', path: '~/model', branch: 'exp/eval', host: 'gpu-01', waiting: true },
        { group: 'Local', name: 'main', path: '~/cmux', branch: 'main' },
      ],
    },
    detail: {
      kind: 'split',
      direction: 'col',
      panes: [
        {
          kind: 'terminal',
          title: 'gpu-01',
          lines: [
            { text: '$ cmux teams start 2', tone: 'dim' },
            { text: '› teammate one · native split', tone: 'good' },
            { text: '› teammate two · native split', tone: 'good' },
            { text: '› session restored from last launch', tone: 'dim' },
          ],
        },
        {
          kind: 'browser',
          url: 'localhost:8080/runs',
          chip: 'via gpu-01',
          blocks: [
            { kind: 'bar', w: 48 },
            { kind: 'box', h: 0.62 },
            { kind: 'box', h: 0.62 },
            { kind: 'box', h: 0.62 },
            { kind: 'box', h: 0.62 },
            { kind: 'bar', w: 26 },
          ],
        },
      ],
    },
    prompt: { agent: 'codex', value: 'tail the eval logs and ring me when it finishes' },
  },

  foundation: {
    label:
      'A cmux window with the Ghostty config file open on the left and a terminal on the right reporting that the renderer is libghostty on Metal.',
    rail: rail('sidebar'),
    list: {
      workspaces: [
        { name: 'main', path: '~/cmux', branch: 'main', ports: [':3000'], active: true },
        { name: 'feat/rings', path: '~/web', branch: 'feat/rings' },
        { name: 'docs', path: '~/docs', branch: 'docs/api' },
      ],
    },
    detail: {
      kind: 'split',
      direction: 'row',
      panes: [
        {
          kind: 'code',
          file: '~/.config/ghostty/config',
          lines: [
            { text: 'font-family = Berkeley Mono' },
            { text: 'font-size = 13' },
            { text: 'theme = ashes' },
            { text: 'window-padding-x = 8' },
            { text: 'cursor-style = block' },
            { text: 'macos-option-as-alt = true' },
          ],
        },
        {
          kind: 'terminal',
          title: 'main',
          lines: [
            { text: '$ cmux --version', tone: 'dim' },
            { text: 'cmux · libghostty', tone: 'bright' },
            { text: '› renderer: Metal', tone: 'good' },
            { text: '› Swift and AppKit, no web view', tone: 'good' },
            { text: '$ cmux config path', tone: 'dim' },
            { text: '~/.config/ghostty/config' },
          ],
        },
      ],
    },
    prompt: { agent: 'main', value: 'cmux config path' },
  },

  program: {
    label:
      'The cmux command palette open over a split showing a cmux.json config and a terminal, with the custom command from that file as the first result.',
    rail: rail('palette'),
    list: {
      workspaces: [
        { name: 'main', path: '~/cmux', branch: 'main', ports: [':3000'], active: true },
        { name: 'feat/rings', path: '~/web', branch: 'feat/rings' },
      ],
    },
    detail: {
      kind: 'split',
      direction: 'row',
      panes: [
        {
          kind: 'code',
          file: 'cmux.json',
          lines: programmable.config.split('\n').map((text) => ({ text, tone: 'base' as const })),
        },
        {
          kind: 'terminal',
          title: 'socket',
          lines: [
            { text: '$ cmux split --direction right', tone: 'dim' },
            { text: '› pane 2 opened', tone: 'good' },
            { text: '$ cmux send --pane 2 "npm test"', tone: 'dim' },
            { text: '$ cmux notify --pane 2 "tests green"', tone: 'dim' },
          ],
        },
      ],
    },
    overlay: {
      query: palette.query,
      rows: palette.rows.map((r) => ({ ...r })),
    },
    prompt: { agent: 'socket', value: 'cmux split --direction right' },
  },
};
