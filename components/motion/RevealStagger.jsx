"use client";

import { motion } from "framer-motion";
import { REVEAL_VARIANTS } from "@/components/motion/Reveal";

const EASE = [0.22, 1, 0.36, 1];

/**
 * RevealStagger — wraps a grid/list of items (e.g. a `<div className="grid">`
 * of cards). Pair every direct child with `<RevealItem>`; when the container
 * scrolls into view, its children animate in one after another instead of
 * all at once.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Should be `RevealItem` elements.
 * @param {number} [props.stagger=0.12] - Seconds between each child's start.
 * @param {number} [props.amount=0.15] - Fraction of the container visible before triggering.
 * @param {boolean} [props.once=true]
 * @param {string} [props.className]
 */
export function RevealStagger({
  children,
  stagger = 0.12,
  amount = 0.15,
  once = true,
  as = "div",
  className = "",
  ...rest
}) {
  const MotionTag = motion[as] ?? motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{ staggerChildren: stagger }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/**
 * RevealItem — a single child of `RevealStagger`. Inherits its "hidden"/
 * "visible" state from the parent's scroll-triggered orchestration rather
 * than observing the viewport itself.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {keyof typeof REVEAL_VARIANTS} [props.variant='fadeUp']
 * @param {number} [props.duration=0.5]
 * @param {keyof JSX.IntrinsicElements} [props.as='div'] - Underlying element/motion tag.
 * @param {string} [props.className]
 */
export function RevealItem({
  children,
  variant = "fadeUp",
  duration = 0.5,
  as = "div",
  className = "",
  ...rest
}) {
  const MotionTag = motion[as] ?? motion.div;
  const chosen = REVEAL_VARIANTS[variant] ?? REVEAL_VARIANTS.fadeUp;

  return (
    <MotionTag
      className={className}
      variants={chosen}
      transition={{ duration, ease: EASE }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
