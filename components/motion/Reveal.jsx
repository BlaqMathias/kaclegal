"use client";

import { motion } from "framer-motion";

/**
 * Named animation variants for `Reveal`. Each has a `hidden` (pre-scroll)
 * and `visible` (in-view) state that framer-motion tweens between.
 *
 * - fadeUp / fadeDown — the workhorse: content eases in while travelling a
 *   short distance vertically.
 * - slideLeft — enters travelling right-to-left (use for content that should
 *   feel like it's arriving from the right edge).
 * - slideRight — enters travelling left-to-right (arriving from the left edge).
 * - appear — a plain opacity fade, no movement. For content where motion
 *   would be distracting (e.g. dense text blocks).
 * - zoom — scales up slightly while fading in.
 * - morph — a more dramatic entrance combining scale, a rounded-corner
 *   "unfold", and a blur that resolves — reserved for a few hero-ish moments,
 *   not everyday content.
 */
const VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, y: 36 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -36 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 56 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -56 },
    visible: { opacity: 1, x: 0 },
  },
  appear: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  zoom: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  morph: {
    hidden: {
      opacity: 0,
      scale: 0.85,
      borderRadius: "32px",
      filter: "blur(8px)",
    },
    visible: { opacity: 1, scale: 1, borderRadius: "0px", filter: "blur(0px)" },
  },
};

const EASE = [0.22, 1, 0.36, 1];

/**
 * Reveal — animates its children in once they scroll into view. Public-site
 * only; never used inside /admin.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {keyof typeof VARIANTS} [props.variant='fadeUp'] - Which animation to play.
 * @param {number} [props.delay=0] - Seconds to wait before starting.
 * @param {number} [props.duration=0.6] - Animation length in seconds.
 * @param {number} [props.amount=0.2] - Fraction of the element that must be
 *   visible before it triggers (0–1).
 * @param {boolean} [props.once=true] - Play once and stay visible, vs. replay
 *   every time it scrolls in/out of view.
 * @param {keyof JSX.IntrinsicElements} [props.as='div'] - Underlying element/motion tag.
 * @param {string} [props.className]
 */
export default function Reveal({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 0.6,
  amount = 0.2,
  once = true,
  as = "div",
  className = "",
  ...rest
}) {
  const MotionTag = motion[as] ?? motion.div;
  const chosen = VARIANTS[variant] ?? VARIANTS.fadeUp;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={chosen}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export { VARIANTS as REVEAL_VARIANTS };
