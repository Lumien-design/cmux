'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { testimonials, type Testimonial } from '@/content/testimonials';

/**
 * StaggerTestimonials — the 21st.dev stagger deck, on this project's terms.
 *
 * The idea kept from the original: one centred card, its neighbours fanned out
 * either side with an alternating tilt, and a notched corner that reads as a
 * torn card rather than a rounded box. Clicking a neighbour deals it to the
 * centre; the list rotates rather than indexes, so the deck never ends.
 *
 * Four things had to change to land here, and each is load bearing.
 *
 * The quotes are the real ones. The original ships twenty invented people
 * praising "COMPANY" beside stock portraits. `content/testimonials.ts` exists
 * precisely because inventing a testimonial is disqualifying, so the deck reads
 * from it. The portraits are gone with them: putting a stock face next to a
 * real named person's words is a misattribution, not a decoration.
 *
 * Colour comes from the token layer, not shadcn's. There is no `--primary` or
 * `--card` here, so the centre card is ink on ink-inverse and its neighbours
 * sit on raised sheet, which is the same figure/ground the panels use.
 *
 * Motion is on the ladder. The original's 500ms is not a rung, and animating
 * every property at once is banned outright, so the move is 700 over the two
 * that actually change, and reduced motion cuts rather than slides.
 *
 * Keyboard and screen reader reach the deck through the two arrow buttons, and
 * only the centre card is in the accessibility tree. Twenty absolutely
 * positioned cards, each a click target, would otherwise be twenty tab stops
 * landing on quotes nobody can see.
 */

/** The corner notch, and the hypotenuse of the 50px triangle it cuts. */
const NOTCH = 50;
const BEVEL = Math.sqrt(2 * NOTCH * NOTCH);

type Card = Testimonial & { key: string };

function TestimonialCard({
  position,
  card,
  onSelect,
  size,
}: {
  position: number;
  card: Card;
  onSelect: (steps: number) => void;
  size: number;
}) {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => onSelect(position)}
      // Only the centre card is announced. The rest are decoration until they
      // are dealt in, and the arrows are what a keyboard drives.
      aria-hidden={!isCenter}
      className={cn(
        'absolute left-1/2 top-1/2 flex cursor-pointer flex-col overflow-hidden border p-400',
        'transition-[transform,background-color,border-color] duration-700 ease-in-out',
        'motion-reduce:transition-none',
        isCenter
          ? 'z-10 border-ink bg-ink text-ink-inverse'
          : 'z-0 border-rule bg-sheet-raised text-ink hover:border-rule-strong',
      )}
      style={{
        width: size,
        height: size,
        clipPath: `polygon(${NOTCH}px 0%, calc(100% - ${NOTCH}px) 0%, 100% ${NOTCH}px, 100% 100%, calc(100% - ${NOTCH}px) 100%, ${NOTCH}px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%)
          translateX(${(size / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? '0px 8px 0px 4px var(--color-rule-strong)' : undefined,
      }}
    >
      {/* The rule across the notch, so the cut corner reads as folded. */}
      <span
        aria-hidden="true"
        className={cn('absolute block origin-top-right rotate-45', isCenter ? 'bg-ink-inverse/25' : 'bg-rule')}
        style={{ right: -2, top: NOTCH - 2, width: BEVEL, height: 1 }}
      />

      {/* The quote takes what is left after the caption and clips there. These
          quotes run to 245 characters and the bilingual ones carry a
          translation as well, so on a fixed square card something has to give.
          The fade says the text continues rather than that it broke, and the
          source link under the deck is where it continues to. */}
      <blockquote
        className={cn(
          'min-h-0 flex-1 text-sm leading-snug',
          '[mask-image:linear-gradient(to_bottom,black_84%,transparent)]',
        )}
      >
        {card.original ? (
          <>
            <span lang={card.lang} className="block">
              {card.original}
            </span>
            <span
              className={cn('mt-100 block', isCenter ? 'text-ink-inverse/70' : 'text-ink-muted')}
            >
              {card.quote}
            </span>
          </>
        ) : (
          card.quote
        )}
      </blockquote>

      <figcaption
        className={cn(
          'mt-200 shrink-0 font-mono text-xs leading-snug',
          isCenter ? 'text-ink-inverse/70' : 'text-ink-muted',
        )}
      >
        {card.name}
        {card.title ? ` · ${card.title}` : null}
      </figcaption>
    </div>
  );
}

export function StaggerTestimonials({ items = testimonials }: { items?: readonly Testimonial[] }) {
  const [size, setSize] = useState(365);
  const [deck, setDeck] = useState<Card[]>(() =>
    items.map((t, i) => ({ ...t, key: `${t.href}-${i}` })),
  );

  /**
   * Rotating the array, rather than moving an index, is what makes the deck
   * endless: the card that leaves one end is re-keyed and pushed onto the
   * other, so React treats it as a new card and it enters without animating
   * across the whole deck.
   */
  const move = (steps: number) => {
    if (!steps) return;
    setDeck((prev) => {
      const next = [...prev];
      for (let i = 0; i < Math.abs(steps); i++) {
        if (steps > 0) {
          const item = next.shift();
          if (!item) return prev;
          next.push({ ...item, key: `${item.href}-${Math.random()}` });
        } else {
          const item = next.pop();
          if (!item) return prev;
          next.unshift({ ...item, key: `${item.href}-${Math.random()}` });
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const fit = () => setSize(window.matchMedia('(min-width: 46rem)').matches ? 365 : 290);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const centerIndex = Math.floor(deck.length / 2);
  const center = deck[centerIndex];

  return (
    <div className="relative h-full w-full overflow-hidden bg-sheet-sunken">
      {deck.map((card, index) => (
        <TestimonialCard
          key={card.key}
          card={card}
          onSelect={move}
          position={index - centerIndex}
          size={size}
        />
      ))}

      <div className="absolute bottom-300 left-1/2 flex -translate-x-1/2 items-center gap-100">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="Previous testimonial"
          className={cn(
            'grid size-500 place-items-center border border-rule-strong bg-sheet text-ink',
            'transition-colors duration-180 ease-out hover:bg-ink hover:text-ink-inverse',
          )}
        >
          <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="Next testimonial"
          className={cn(
            'grid size-500 place-items-center border border-rule-strong bg-sheet text-ink',
            'transition-colors duration-180 ease-out hover:bg-ink hover:text-ink-inverse',
          )}
        >
          <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {/* Beside the arrows rather than off in a corner: the citation is part
            of the deck's controls, and it is the only way to reach the source
            without a pointer now that the cards themselves are not links. */}
        {center ? (
          <a
            href={center.href}
            target="_blank"
            rel="noreferrer noopener"
            className="ms-200 font-mono text-xs text-ink-muted underline underline-offset-4 hover:text-ink"
          >
            Read the source
          </a>
        ) : null}
      </div>

      <p aria-live="polite" className="sr-only">
        {center ? `${center.quote} — ${center.name}` : ''}
      </p>
    </div>
  );
}
