import { getStars } from '@/lib/stars';
import { CardNav } from '@/components/card-nav';
import { DotGridBackground } from '@/components/dot-grid';
import {
  ToolStrip,
  Faq,
  FinalCta,
  Footer,
  Hero,
  Install,
  OpenSource,
  Panels,
  Platforms,
  Problem,
  Shortcuts,
  Testimonials,
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

      <CardNav />

      {/* The sheet: paper held inside the dark shell. The frame is the
          direction's structural argument, so it is a real container rather
          than a background colour. */}
      <div className="p-200 split:p-300">
        <div className="relative isolate mx-auto overflow-clip rounded-sheet bg-sheet">
          {/* The grid, across the whole sheet.

              Sticky rather than absolute, and one viewport tall rather than the
              full page. The sheet runs to about ten thousand pixels; a canvas
              that size is tens of millions of device pixels to allocate and
              repaint. Sticky keeps it to one screen, follows the scroll, and
              unlike a fixed element is still clipped by the sheet's rounded
              edge instead of bleeding onto the dark shell.

              The negative margin removes its height from the flow, so it
              occupies the sheet without pushing anything down.

              The sheet is overflow-clip rather than overflow-hidden. Hidden
              establishes a scroll container, and a sticky child sticks to that
              rather than to the viewport, so the grid simply sat still at the
              top of the page. Clip does the same rounded corner clipping
              without creating the scroll port.

              The wrapper stays hit testable on purpose: the grid takes its
              stage from canvas.parentElement and listens there, so
              pointer-events-none would silently kill the cursor response. The
              canvas sets pointerEvents none on itself, which is what lets
              clicks through. */}
          <div
            aria-hidden="true"
            className="pointer-events-auto sticky top-0 -z-10 -mb-[100svh] h-[100svh] text-rule"
          >
            <DotGridBackground />
          </div>

          <main id="main">
            <Hero stars={stars} />
            <ToolStrip />
            <Problem />
            <Tagline />
            <Panels />
            <Testimonials />
            <Shortcuts />
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
