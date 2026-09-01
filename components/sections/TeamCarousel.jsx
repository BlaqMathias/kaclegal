"use client";

import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { team } from "@/content/team";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/** How often the carousel auto-advances, in ms. */
const AUTO_ADVANCE_MS = 4500;

/** Minimum horizontal drag distance (px) to count as a swipe. */
const SWIPE_THRESHOLD_PX = 40;

/**
 * Photos used here are homepage-specific — distinct from the plain headshots
 * used on /team — so they're looked up by a separate naming convention.
 */
function carouselPhotoFor(slug) {
  return `/images/team/${slug}-carousel.webp`;
}

/** Shortest signed distance between two carousel positions, accounting for wraparound. */
function shortestDelta(rawDelta, length) {
  let delta = rawDelta % length;
  if (delta > length / 2) delta -= length;
  if (delta < -length / 2) delta += length;
  return delta;
}

/**
 * TeamCarousel — the "Finding a Lawyer You Can Trust" teal section. Text on
 * the left, an auto-advancing/swipeable coverflow carousel of team photos on
 * the right — side by side, fully contained within the teal section (no
 * longer overlapping into the section below it).
 */
export default function TeamCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartXRef = useRef(null);
  const autoAdvanceRef = useRef(null);
  const length = team.length;

  const goTo = useCallback(
    (index) => {
      setCurrentIndex(((index % length) + length) % length);
    },
    [length],
  );

  /** Restarts the auto-advance timer — called on mount and after any manual navigation. */
  const restartAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    autoAdvanceRef.current = setInterval(() => {
      setCurrentIndex((index) => (index + 1) % length);
    }, AUTO_ADVANCE_MS);
  }, [length]);

  useEffect(() => {
    restartAutoAdvance();
    return () => clearInterval(autoAdvanceRef.current);
  }, [restartAutoAdvance]);

  function handleManualNavigate(index) {
    goTo(index);
    restartAutoAdvance();
  }

  function handleTouchStart(event) {
    touchStartXRef.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (touchStartXRef.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    handleManualNavigate(currentIndex + (deltaX < 0 ? 1 : -1));
  }

  return (
    <Section background="navy" spacing="lg" className="overflow-hidden">
      <div className="flex flex-col items-center gap-10 md:flex-row md:gap-14">
        <div className="text-center md:w-2/5 md:text-left">
          <h2 className="font-display text-h1 text-white font-bold">
            Finding a Lawyer You Can Trust
            <br />
            Is Harder Than It Should Be
          </h2>
          <p className="mt-4 text-body-lg text-white/85">
            We&rsquo;re different. Koko Asuquo Chambers serves you with lawyers
            that are connected to your business needs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Button
              href="/team"
              className="!rounded-full !bg-brand-navyDark !text-white hover:!bg-white hover:!text-brand-navyDark"
            >
              Meet the Team
            </Button>
            <Button
              href="/contact"
              variant="secondary"
              className="!rounded-full !border-white !text-white hover:!bg-white hover:!text-brand-teal"
            >
              Request a Consultation
            </Button>
          </div>
        </div>

        <div className="md:w-3/5">
          <div
            className="relative mx-auto h-72 w-full max-w-md select-none sm:h-80"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {team.map((member, index) => {
              const delta = shortestDelta(index - currentIndex, length);
              const isCenter = delta === 0;
              const isAdjacent = Math.abs(delta) === 1;

              if (!isCenter && !isAdjacent) return null;

              const translateX = `${delta * 62}%`;
              const scale = isCenter ? 1 : 0.78;
              const opacity = isCenter ? 1 : 0.65;
              const zIndex = isCenter ? 30 : 10;

              return (
                <button
                  key={member.slug}
                  type="button"
                  onClick={() => !isCenter && handleManualNavigate(index)}
                  aria-label={
                    isCenter
                      ? `${member.name}, currently featured`
                      : `Show ${member.name}`
                  }
                  aria-current={isCenter}
                  className="absolute left-1/2 top-1/2 h-80 w-60 overflow-hidden rounded-3xl shadow-card-hover transition-all duration-500 ease-out sm:h-96 sm:w-72"
                  style={{
                    transform: `translate(-50%, -50%) translateX(${translateX}) scale(${scale})`,
                    opacity,
                    zIndex,
                    cursor: isCenter ? "default" : "pointer",
                  }}
                >
                  <Image
                    src={carouselPhotoFor(member.slug)}
                    alt={member.name}
                    fill
                    sizes="224px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
