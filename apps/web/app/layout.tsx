import type { Metadata, Viewport } from 'next';
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
      suppressHydrationWarning
    >
      <head>
        {/*
          Google Sans Flex is newer than this Next version's font manifest, so
          next/font/google cannot resolve it. Linked directly rather than self
          hosted: it keeps a proprietary Google typeface out of a public repo,
          and avoids a build time fetch that would make a Google Fonts hiccup
          into a CI failure. Both faces are variable, so this is two files.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Code:wght@400;500&family=Google+Sans+Flex:wght@300..700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
