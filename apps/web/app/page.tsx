import { getStars } from '@/lib/stars';
import { IslandNav } from '@/components/interactive';
import {
  AgentStrip,
  Capabilities,
  Faq,
  FinalCta,
  Footer,
  Foundation,
  Hero,
  Install,
  OpenSource,
  Platforms,
  Problem,
  Programmable,
  Shortcuts,
  Tagline,
} from '@/components/sections';

export default async function Page() {
  const stars = await getStars();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-300 focus:top-300 focus:z-[60] focus:rounded-control focus:bg-ink focus:px-100 focus:py-75 focus:text-ink-inverse"
      >
        Skip to content
      </a>

      <IslandNav />

      {/* The sheet: paper held inside the dark shell. The frame is the
          direction's structural argument, so it is a real container rather
          than a background colour. */}
      <div className="p-200 split:p-300">
        <div className="paper-grain mx-auto overflow-hidden rounded-sheet bg-sheet">
          <main id="main">
            <Hero stars={stars} />
            <AgentStrip />
            <Problem />
            <Tagline />
            <Capabilities />
            <Programmable />
            <Shortcuts />
            <Foundation />
            <Platforms />
            <Install />
            <OpenSource />
            <Faq />
            <FinalCta />
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
