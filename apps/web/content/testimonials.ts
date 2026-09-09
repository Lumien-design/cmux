/**
 * Real, attributed, linked. Every quote below is verbatim from the URL beside
 * it — nothing paraphrased, nothing trimmed to read better.
 *
 * This is the first genuine proof the page has had. The design rationale
 * previously argued for having no testimonial section at all, on the grounds
 * that inventing one is disqualifying and no real quote existed. That is no
 * longer true, so the argument changes with the facts.
 *
 * Non English quotes carry the original and a translation. Showing only the
 * translation would quietly erase that this is being adopted in eight
 * languages, which is itself the point those quotes are making.
 *
 * Selected from a larger set. Order puts the people whose judgement a reader
 * can weigh first — the person who wrote the engine cmux is built on, then
 * founders and researchers — followed by the reach.
 */

export type Testimonial = {
  quote: string;
  /** For quotes not in English: the original, shown above the translation. */
  original?: string;
  lang?: string;
  name: string;
  title?: string;
  href: string;
};

export const testimonials: readonly Testimonial[] = [
  {
    quote:
      'Another day another libghostty-based project, this time a macOS terminal with vertical tabs, better organization/notifications, embedded/scriptable browser specifically targeted towards people who use a ton of terminal-based agentic workflows.',
    name: 'Mitchell Hashimoto',
    title: 'Creator of Ghostty, founder of HashiCorp',
    href: 'https://x.com/mitchellh/status/2024913161238053296',
  },
  {
    quote:
      "I'm late to the party, but cmux is great. Current split: Codex Mac app for knowledge work, learning, reading; cmux + Codex CLI for coding.",
    name: 'Peter Steinberger',
    title: 'OpenClaw creator, founder of PSPDFKit',
    href: 'https://x.com/steipete/status/2058093406874689770',
  },
  {
    quote:
      "This is exactly the product I've been looking for. After two hours this am I've in love.",
    name: 'Nick Schrock',
    title: 'Creator of Dagster, GraphQL co-creator',
    href: 'https://x.com/schrockn/status/2025182278637207857',
  },
  {
    quote: "I've been using this all weekend and it's amazing.",
    name: 'Edward Grefenstette',
    title: 'Director of Research, Google DeepMind',
    href: 'https://x.com/egrefen/status/2026806171563184199',
  },
  {
    quote:
      'Been using this for a week and it’s fantastic. Vert tab for each WIP task. Inside, claudes on one side and browser with PR and resources on the other, switch between tasks and stay organized.',
    name: 'Connor',
    href: 'https://x.com/connorelsea/status/2026867085750440390',
  },
  {
    quote:
      'I like it, ran it in the past day on three parallel projects each with several worktrees. Having this paired with lazygit and yazi / nvim made me a bit more productive than usual. Also feels more natural than tmux.',
    name: 'afruth',
    title: 'Reddit',
    href: 'https://www.reddit.com/r/ClaudeCode/comments/1r9g45u/comment/o6sxbr3/',
  },
  {
    quote:
      'Hey, this looks seriously awesome. Love the ideas here, specifically: the programmability, layered UI, browser w/ api.',
    name: 'johnthedebs',
    title: 'Hacker News',
    href: 'https://news.ycombinator.com/item?id=47083596',
  },
  {
    original:
      '아직 늦지 않았어요. 저도 Ghostty 많이 쓰는데 이어서 cmux도 사랑입니다. 세로 탭, 알림 링, 내장 브라우저, 분할 패널, GPU 가속 등등.. 정말 이점이 많아요!',
    quote:
      "It's not too late. I use Ghostty a lot, and cmux is love too. Vertical tabs, notification rings, built in browser, split panes, GPU acceleration... there are so many real benefits!",
    lang: 'Korean',
    name: 'lucas',
    href: 'https://x.com/lucas_flatwhite/status/2058215633259831694',
  },
  {
    original:
      '我也主力用 cmux，还推荐给其他同事，原因就是通知系统，分工作区，快捷键好用，多工作并行时能提高效率。',
    quote:
      'I also use cmux as my main terminal and recommend it to coworkers. The notifications, workspaces, and shortcuts improve efficiency when running multiple jobs in parallel.',
    lang: 'Chinese',
    name: 'minixalpha',
    href: 'https://x.com/minixalpha/status/2037496984890986576',
  },
  {
    original:
      'Я уже какое-то время назад на него переехал с warp и как будто пересел на ракету. Он написан нативно для Mac OS на Swift и его супер активно развивают.',
    quote:
      'I moved to it from Warp a while ago and it felt like switching to a rocket. It is native macOS Swift and being developed super actively.',
    lang: 'Russian',
    name: 'Закиев Василь',
    href: 'https://x.com/zvasil/status/2058873355172810894',
  },
  {
    original:
      '年初にWarpからGhosttyに乗り換えたけど、今はcmuxに乗り換えた💻 垂直タブが便利で、Claude Codeのタスクの終了が通知されるのがありがたい。',
    quote:
      'I switched from Warp to Ghostty at the start of the year, but now I have switched to cmux. The vertical tabs are convenient, and I appreciate getting notified when Claude Code tasks finish.',
    lang: 'Japanese',
    name: '鹿野 壮 Takeshi Kano',
    href: 'https://x.com/tonkotsuboy_com/status/2028458464801108212',
  },
  {
    original:
      "eğer birden fazla terminal ile çalışmanız gerekiyorsa kesinlikle cmux'u denemelisiniz. terminal sizden bir cevap beklediğinde otomatik bildirim geliyor.",
    quote:
      'If you need to work with multiple terminals, you should definitely try cmux. When a terminal waits for your input, it sends an automatic notification.',
    lang: 'Turkish',
    name: 'Şerafettin Sarışen',
    href: 'https://x.com/ssarisen/status/2046289729281294567',
  },
  {
    original: 'اقتراحي هو استعملوا Cmux وخلاص... فك لي ازمة بكل شيء تقريبًا من ناحية التيرمنل',
    quote: 'My suggestion is just use cmux. It solved almost every terminal problem for me.',
    lang: 'Arabic',
    name: 'Yousef Rol',
    href: 'https://x.com/yousefrol/status/2054034664940068890',
  },
  {
    original: 'po nao sei como vivi tanto tempo sem cmux',
    quote: "Man, I don't know how I lived so long without cmux.",
    lang: 'Portuguese',
    name: 'Wesley',
    href: 'https://x.com/wescld/status/2059611549677863347',
  },
  {
    quote: 'This has been such a useful find. I can’t recommend it enough.',
    name: 'Scott Watermasysk',
    href: 'https://x.com/scottw/status/2026806893067551084',
  },
  {
    quote: '> learn cmux > trust me',
    name: 'David Ondrej',
    href: 'https://x.com/DavidOndrej1/status/2059360111336865901',
  },
  {
    quote: 'this has been my favorite tool for past two weeks',
    name: 'Max Forsey',
    href: 'https://x.com/max4c_/status/2027266664270889204',
  },
  {
    quote: 'Vertical tabs in my terminal. I never thought of that before.',
    name: 'Joe Riddle',
    href: 'https://x.com/joeriddles10/status/2024914132416561465',
  },
] as const;

export const testimonialSection = {
  heading: 'Adopted by the people who build the tools.',
  note: 'Every quote links to its source.',
} as const;
