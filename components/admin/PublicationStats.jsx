"use client";

import Button from "@/components/ui/Button";
import { formatNaira } from "@/lib/publications";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export default function PublicationStats({
  totalPublications,
  freePublications,
  paidPublications,
  totalFreeDownloads,
  totalRevenue,
  salesThisMonth,
  downloadsThisMonth,
  bestSeller,
}) {
  const [showStats, setShowStats] = useState(false);

  const stats = [
    { label: "Total Publications", value: totalPublications },
    { label: "Free Publications", value: freePublications },
    { label: "Paid Publications", value: paidPublications },
    { label: "Free Downloads", value: totalFreeDownloads },
    { label: "Total Revenue", value: formatNaira(totalRevenue) },
    { label: "Sales This Month", value: salesThisMonth },
    { label: "Downloads This Month", value: downloadsThisMonth },
    { label: "Best Seller", value: bestSeller, compact: true },
  ];

  return (
    <section aria-label="Publication statistics">
      <div className="flex items-center justify-center gap-3 sm:justify-end">
        <Button href="/admin/publications/new">Add publication</Button>
        <button
          type="button"
          onClick={() => setShowStats((current) => !current)}
          aria-expanded={showStats}
          aria-controls="publication-stats-grid"
          className="inline-flex items-center gap-2 rounded-full border border-brand-teal px-5 py-2.5 text-sm font-medium text-brand-ice transition-colors hover:bg-brand-teal hover:text-white focus-visible:ring-brand-teal focus-visible:ring-offset-brand-navyDark"
        >
          {showStats ? "Hide stats" : "Show stats"}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className={`h-4 w-4 transition-transform duration-200 ${
              showStats ? "rotate-180" : ""
            }`}
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showStats && (
          <motion.div
            id="publication-stats-grid"
            initial={{ height: 0, opacity: 0, y: -12 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="border border-white/10 bg-white/5 px-6 py-5 text-center"
                >
                  <p className="text-caption font-semibold uppercase tracking-[0.14em] text-white/60">
                    {stat.label}
                  </p>
                  <p
                    className={`mt-2 font-display text-white ${
                      stat.compact ? "text-h4" : "text-h1"
                    }`}
                  >
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
