/**
 * All page copy lives here, typed, so it can be reviewed as writing rather than
 * hunted through JSX — and so the design-rules test can lint it.
 *
 * Two rules this file is written under, both from `landing-page-design`:
 *   - No hyphens inside body copy. Rewrite the phrase instead.
 *   - No invented numbers, customers, quotes or awards. Every fact below is
 *     verifiable against the repo, the app, or the site.
 */

export const site = {
  name: 'cmux',
  url: 'https://cmux.com',
  repo: 'https://github.com/manaflow-ai/cmux',
  docs: 'https://cmux.com/docs',
  discord: 'https://discord.gg/xsgFEVrWCZ',
  email: 'founders@manaflow.com',
} as const;

/** Verified against the GitHub API. Used only as a floor if the live fetch fails. */
export const proofFallback = {
  stars: 26849,
  checkedOn: '2026-09-07',
} as const;

export const nav = [
  { label: 'Attention', href: '#attention' },
  { label: 'Organize', href: '#organize' },
  { label: 'Program', href: '#program' },
  { label: 'Open source', href: '#open-source' },
] as const;

export const hero = {
  eyebrow: 'Free and open source for macOS',
  // "The {category} for {audience}" — and it is the line the app itself uses.
  headline: 'The open source terminal built for coding agents.',
  sub: 'Run several at once and always know which one is waiting on you. Tabs carry the branch, the directory and the port. Native Swift, no Electron.',
  primary: { label: 'Download for Mac', href: '/download' },
  secondary: { label: 'View source', href: site.repo },
} as const;

/** Named as text, not logos. No verified partnership exists, and a logo wall
 *  without one is exactly the "borrowed credibility" the slop rules forbid. */
export const agents = {
  label: 'Works with the agents you already run',
  items: ['Claude Code', 'Codex', 'Gemini CLI', 'OpenCode', 'Amp'],
} as const;

export const problem = {
  heading: 'Several agents. One screen. No idea which one stopped.',
  body: 'An agent finishes, or hits a question, and then just sits there. You find out on your next pass through the tabs, which might be a minute later or ten. The work is parallel; the attention is not.',
} as const;

/** The mandated tagline reveal. Their own words, from the Zen of cmux. */
export const tagline = {
  lines: ['cmux is a primitive,', 'not a solution.'],
  attribution: 'The Zen of cmux',
  body: 'It is not prescriptive about how you hold your tools. It gives you rings, panes and a socket, then gets out of the way.',
} as const;

export type Capability = {
  id: string;
  eyebrow: string;
  heading: string;
  body: string;
  points: readonly string[];
  shot: string;
  reverse?: boolean;
};

export const capabilities: readonly Capability[] = [
  {
    id: 'attention',
    eyebrow: 'Attention',
    heading: 'The pane that needs you lights up.',
    body: 'When an agent wants input, its pane takes a blue ring and its tab lights up. You stop polling and start responding. Everything pending collects in one panel, and a single keystroke jumps you to the most recent unread.',
    points: [
      'Blue ring on the pane, matching light on the tab',
      'Notification panel collects everything pending',
      'Jump to latest unread on Command Shift U',
    ],
    shot: 'notification-ring',
  },
  {
    id: 'organize',
    eyebrow: 'Organization',
    heading: 'Tabs that carry their own context.',
    body: 'A vertical sidebar holds every workspace, and each row shows the git branch, the pull request status, the working directory and any listening ports. You can read the state of six projects without entering one.',
    points: [
      'Git branch and pull request status per workspace',
      'Working directory and listening ports, always visible',
      'Vertical and horizontal tabs, whichever fits the screen',
    ],
    shot: 'tabs-vertical',
    reverse: true,
  },
  {
    id: 'browser',
    eyebrow: 'Panes',
    heading: 'A browser that your agent can drive.',
    body: 'Split a browser next to the terminal and hand it to the agent through a scriptable API, ported from Vercel’s agent browser. It can read the accessibility tree, click, fill forms and evaluate scripts, in a pane you are watching.',
    points: [
      'Horizontal and vertical splits',
      'Scriptable browser API in a pane beside the work',
      'Import cookies and sessions from Chrome, Firefox, Arc and more',
    ],
    shot: 'browser-pane',
  },
  {
    id: 'remote',
    eyebrow: 'Remote',
    heading: 'Workspaces that live on another machine.',
    body: 'Create a workspace over SSH and browser panes route through that host’s network, so a localhost URL on the remote box simply opens. Session layout survives a restart: windows, workspaces and panes come back as you left them.',
    points: [
      'Browser traffic routes through the remote host',
      'Claude Code Teams spawns teammates as native splits',
      'Window, workspace and pane layout restores on relaunch',
    ],
    shot: 'ssh-workspace',
    reverse: true,
  },
] as const;

export const programmable = {
  eyebrow: 'Programmability',
  heading: 'Everything the app can do, a socket can do too.',
  body: 'The CLI and the Unix socket API cover workspaces, panes, keystrokes, browser automation, notifications and sessions. Project specific actions go in a cmux.json and appear in the command palette.',
  cli: [
    { cmd: 'cmux split --direction right', note: 'open a pane' },
    { cmd: 'cmux send --pane 2 "npm test"', note: 'type into it' },
    { cmd: 'cmux notify --pane 2 "tests green"', note: 'ring when it matters' },
  ],
  config: `{
  "commands": [
    {
      "name": "Review the diff",
      "run": "git diff | claude -p 'review this'"
    }
  ]
}`,
} as const;

export const foundation = {
  eyebrow: 'Foundation',
  heading: 'Built on libghostty, the way apps are built on WebKit.',
  body: 'Ghostty is a terminal. libghostty is the rendering engine underneath it, and cmux uses it as a library. You get its GPU accelerated rendering and its config file, inside an app that is a native Swift and AppKit build rather than a web view in a costume.',
  facts: [
    { k: 'Rendering', v: 'GPU accelerated via libghostty' },
    { k: 'Application', v: 'Swift and AppKit, not Electron' },
    { k: 'Config', v: 'Reads your existing Ghostty config' },
    { k: 'License', v: 'GPL 3.0 or later' },
  ],
} as const;

export const platforms = {
  heading: 'Where it runs',
  rows: [
    { name: 'macOS', state: 'Stable', note: 'Universal build, updates in place' },
    { name: 'macOS nightly', state: 'Nightly', note: 'Installs beside the stable app' },
    { name: 'iOS companion', state: 'Beta', note: 'On TestFlight as cmux BETA' },
  ],
} as const;

export const install = {
  eyebrow: 'Install',
  heading: 'Two ways in.',
  brew: 'brew tap manaflow-ai/cmux && brew install --cask cmux',
  dmg: 'Download the disk image and drag it to Applications. It updates itself from there.',
} as const;

export const openSource = {
  eyebrow: 'Open source',
  heading: 'Free, and you can read all of it.',
  body: 'cmux is GPL 3.0 or later, with commercial terms for organisations that cannot comply. The client is public and the issue tracker is where the roadmap actually happens.',
} as const;

export const faq = [
  {
    q: 'Does it work with the agent I already use?',
    a: 'Yes. cmux runs any terminal based coding agent, including Claude Code, Codex, Gemini CLI, OpenCode and Amp. It does not wrap them or replace their interface.',
  },
  {
    q: 'Is this a fork of Ghostty?',
    a: 'No. Ghostty is a terminal application. cmux uses libghostty, its rendering engine, as a library, in the same way an app uses WebKit for web views. cmux is a separate application built on top of it.',
  },
  {
    q: 'Will my Ghostty config carry over?',
    a: 'cmux reads your existing config at ~/.config/ghostty/config, so themes, fonts and colours come with you.',
  },
  {
    q: 'Is it really free?',
    a: 'Yes. The client is open source under GPL 3.0 or later. Commercial terms exist for organisations that cannot comply with the GPL.',
  },
  {
    q: 'Can I use it on a remote machine?',
    a: 'Yes. SSH workspaces run against another host, and browser panes route through that host’s network, so a localhost address on the remote machine opens correctly.',
  },
  {
    q: 'What happens to my layout when I quit?',
    a: 'Session restore brings back your windows, workspaces and pane layout when you relaunch.',
  },
  {
    q: 'Is there a version for Windows or Linux?',
    a: 'Not today. cmux is a native macOS application written in Swift and AppKit. Other platforms are on the way and there is a waitlist.',
  },
  {
    q: 'What about my phone?',
    a: 'An iOS companion is in beta on TestFlight as cmux BETA. It syncs terminals to iPhone and iPad so you can answer a waiting agent away from your desk.',
  },
] as const;

export const finalCta = {
  heading: 'Stop checking. Start being told.',
  body: 'Free, open source, and native to your Mac.',
} as const;

export const credit = {
  text: 'Independent concept redesign, not affiliated with cmux.',
  author: 'Colley Stapleton',
  href: 'https://lumien.design',
} as const;
