"use client";

import PublicationCard from "@/components/sections/PublicationCard";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { PUBLICATION_TYPES } from "@/lib/publications";
import { useMemo, useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { RevealStagger, RevealItem } from "@/components/motion/RevealStagger";

/** Filter pill order as requested — independent of PUBLICATION_TYPES' own order. */
const FILTERS = [
  "All Publications",
  ...PUBLICATION_TYPES.filter((t) => t !== "Guide"),
  "Guide",
];

/**
 * PublicationsBrowser — the filterable library grid.
 *
 * Client component so the type filter can be interactive; it owns the visual
 * hand-off from the light intro section above it (pill row, matching
 * background) to the navy-dark section that holds the actual card grid.
 *
 * @param {object} props
 * @param {Array<Record<string, any>>} props.publications - Published rows, newest first.
 * @param {boolean} props.failed - Whether the initial server fetch failed.
 */
export default function PublicationsBrowser({ publications, failed }) {
  const [activeFilter, setActiveFilter] = useState("All Publications");

  const filtered = useMemo(
    () =>
      activeFilter === "All Publications"
        ? publications
        : publications.filter((p) => p.type === activeFilter),
    [publications, activeFilter],
  );

  return (
    <>
      {/* Filter pills — sits on the same light background as the hero above it. */}
      <Section background="white" spacing="sm" className="!pt-0">
        <div className="flex flex-wrap justify-center gap-2.5">
          {FILTERS.map((filter) => {
            const isActive = filter === activeFilter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={isActive}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-brand-navy text-white"
                    : "bg-white text-brand-slate shadow-card hover:bg-brand-offWhite"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Grid — navy-dark background, holding the (filtered) publication cards. */}
      <Section background="navyDarkPanel" spacing="md">
        {filtered.length > 0 ? (
          <RevealStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((publication) => (
              <RevealItem key={publication.id} variant="fadeUp">
                <PublicationCard publication={publication} />
              </RevealItem>
            ))}
          </RevealStagger>
        ) : (
          <Reveal
            variant="appear"
            className="mx-auto max-w-xl border border-white/15 bg-white/5 p-10 text-center"
          >
            <h2 className="font-display text-h3 text-white">
              {failed
                ? "Publications are unavailable"
                : publications.length > 0
                  ? "Nothing in this category yet"
                  : "Nothing published yet"}
            </h2>
            <p className="mt-3 text-body text-white/70">
              {failed
                ? "We could not load the library just now. Please try again shortly, or get in touch and we will send you what you need."
                : publications.length > 0
                  ? "Try a different filter, or view all publications."
                  : "Our first publications are on the way. In the meantime, we are happy to talk through any question directly."}
            </p>
            <div className="mt-6 flex justify-center">
              {publications.length > 0 && !failed ? (
                <Button
                  variant="secondary"
                  className="!border-white !text-white hover:!bg-white hover:!text-brand-navy"
                  onClick={() => setActiveFilter("All Publications")}
                >
                  View all publications
                </Button>
              ) : (
                <Button
                  href="/contact"
                  variant="secondary"
                  className="!border-white !text-white hover:!bg-white hover:!text-brand-navy"
                >
                  Get in touch
                </Button>
              )}
            </div>
          </Reveal>
        )}
      </Section>
    </>
  );
}
