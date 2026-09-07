import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { site } from '@/content/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: 'cmux — the open source terminal built for coding agents',
  description:
    'Free and open source native macOS terminal built on libghostty. Notification rings tell you which pane is waiting, vertical tabs carry the branch and the port, and a socket API drives all of it.',
  openGraph: {
    title: 'cmux — the open source terminal built for coding agents',
    description:
      'Notification rings tell you which pane is waiting. Vertical tabs carry the branch and the port. Native Swift, no Electron.',
    url: site.url,
    siteName: 'cmux',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ede9e0' },
    { media: '(prefers-color-scheme: dark)', color: '#131209' },
  ],
};

/**
 * Resolves the theme before first paint so there is no flash. One mechanism
 * only: a data-theme attribute. No token is defined behind a media query, so
 * there is nothing that can disagree with this.
 *
 * Light is the default rather than the OS preference, and that is a deliberate
 * call. Paper is the direction's whole argument, and most developers run a dark
 * system, so honouring prefers-color-scheme here would mean almost nobody ever
 * sees the design. A full dark theme exists and the toggle is in the nav; an
 * explicit choice is remembered and always wins.
 */
const themeScript = `(function(){try{var t=localStorage.getItem('cmux-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
