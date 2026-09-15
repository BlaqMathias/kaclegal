"use client";

import HoverImage from "@/components/ui/HoverImage";
import { motion } from "framer-motion";
import { useState } from "react";

const approach = [
  {
    number: "01",
    title: "Manage risk",
    description:
      "Identify legal and commercial exposure before it becomes costly.",
  },
  {
    number: "02",
    title: "Protect your interests",
    description:
      "Put practical legal safeguards around the decisions that matter.",
  },
  {
    number: "03",
    title: "Move forward",
    description:
      "Act with clearer options, stronger documentation and confidence.",
  },
];

const transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};

export default function HeroApproachToggle() {
  const [showImage, setShowImage] = useState(true);

  return (
    <div className="relative grid w-full">
      <motion.div
        onClick={() => setShowImage(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setShowImage(false);
          }
        }}
        role="button"
        tabIndex={showImage ? 0 : -1}
        aria-label="Return to the KAC Legal Approach details"
        aria-hidden={!showImage}
        animate={
          showImage
            ? { opacity: 1, scale: 1, rotate: 0 }
            : { opacity: 0, scale: 0.97, rotate: -1.5 }
        }
        transition={transition}
        className={`group relative block h-full w-full cursor-pointer rounded-[2rem] text-left focus-visible:ring-brand-ice focus-visible:ring-offset-brand-navyDark [grid-area:1/1] ${
          showImage ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <HoverImage
          src="/images/hero/kac-legal-approach.webp"
          alt="A marble figure of Justice holding balanced golden scales"
          tilt="right"
          className="!h-full !w-full !aspect-auto !rounded-[2rem] border-white/15"
        />
      </motion.div>

      <motion.button
        type="button"
        onClick={() => setShowImage(true)}
        tabIndex={showImage ? -1 : 0}
        aria-label="Show the KAC Legal Approach image"
        aria-hidden={showImage}
        animate={
          showImage
            ? { opacity: 0, scale: 0.97, rotate: 1.5 }
            : { opacity: 1, scale: 1, rotate: 0 }
        }
        whileHover={{ rotate: -1.5, scale: 1.02 }}
        whileTap={{ scale: 0.99 }}
        transition={transition}
        className={`relative flex w-full flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.08] p-5 text-left shadow-2xl backdrop-blur-md focus-visible:ring-brand-ice focus-visible:ring-offset-brand-navyDark [grid-area:1/1] sm:p-7 ${
          showImage ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <span className="flex w-full items-center justify-between border-b border-white/15 pb-5">
          <span>
            <span className="block text-caption font-semibold uppercase tracking-[0.2em] text-brand-ice">
              KAC Legal Approach
            </span>
            <span className="mt-2 block font-display text-h3 text-white">
              From legal risk to a clear next move
            </span>
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-ice/30 bg-brand-ice/10 font-display text-sm font-bold text-brand-ice">
            KAC
          </span>
        </span>

        <span className="block w-full divide-y divide-white/10">
          {approach.map((item) => (
            <span
              key={item.number}
              className="grid grid-cols-[2.5rem_1fr] gap-4 py-5"
            >
              <span className="font-display text-sm font-semibold text-brand-teal">
                {item.number}
              </span>
              <span>
                <span className="block font-display text-h4 font-semibold text-white">
                  {item.title}
                </span>
                <span className="mt-1 block text-sm leading-6 text-white/65">
                  {item.description}
                </span>
              </span>
            </span>
          ))}
        </span>

        <span className="mt-auto block w-full border-t border-white/15 pt-5">
          <span className="flex flex-wrap gap-2">
            {["Legal expertise", "Commercial insight", "Technology"].map(
              (label) => (
                <span
                  key={label}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-caption font-medium text-white/80"
                >
                  {label}
                </span>
              ),
            )}
          </span>
        </span>
      </motion.button>
    </div>
  );
}
