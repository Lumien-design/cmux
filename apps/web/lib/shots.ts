/**
 * Image slots, declared at their final dimensions.
 *
 * The frame owns the aspect ratio, not the image, so dropping a real capture in
 * later changes no layout. Until one exists, the slot renders a composed empty
 * state naming the shot that belongs there. Never a grey box, and never stock
 * imagery standing in for a product screen.
 */
export type Shot = {
  id: string;
  /** Display box. Capture at 2x these numbers. */
  w: number;
  h: number;
  alt: string;
  /** What to capture, for whoever takes the screenshot. */
  brief: string;
};

export const shots: Record<string, Shot> = {
  'notification-ring': {
    id: 'notification-ring',
    w: 800,
    h: 500,
    alt: 'Two cmux panes side by side, the right one ringed in blue because its agent is waiting for input.',
    brief: 'Tight crop on two adjacent panes, one carrying the blue ring.',
  },
  'tabs-vertical': {
    id: 'tabs-vertical',
    w: 800,
    h: 500,
    alt: 'The cmux sidebar listing several workspaces, each showing its git branch, working directory and listening port.',
    brief: 'Sidebar with several real workspaces. Branch, PR status, directory, ports. Not the empty state.',
  },
  'browser-pane': {
    id: 'browser-pane',
    w: 800,
    h: 500,
    alt: 'A cmux window split between a terminal pane and the in app browser.',
    brief: 'Terminal pane beside the in app browser pane.',
  },
  'ssh-workspace': {
    id: 'ssh-workspace',
    w: 800,
    h: 500,
    alt: 'A cmux SSH workspace with a browser pane routing through the remote host.',
    brief: 'Remote workspace, browser pane resolving a localhost URL on the remote machine.',
  },
};
