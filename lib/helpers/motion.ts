import type { Transition, Variants } from "framer-motion";
import { useReducedMotion } from "framer-motion";

export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const MOTION_TOKENS = {
  fast: 0.42,
  base: 0.58,
  medium: 1.05,
  slow: 1.35,
  distanceSm: 12,
  distanceMd: 24,
  distanceLg: 44,
} as const;

export function fadeUp(distance: number = MOTION_TOKENS.distanceMd, delay = 0): {
  initial: { opacity: number; y: number };
  whileInView: { opacity: number; y: number };
  viewport: { once: true; amount: number };
  transition: Transition;
} {
  return {
    initial: { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: MOTION_TOKENS.slow, delay, ease: MOTION_EASE },
  };
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.14,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: MOTION_TOKENS.distanceMd },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TOKENS.medium,
      ease: MOTION_EASE,
    },
  },
};

export const panelEnter: Transition = {
  duration: MOTION_TOKENS.medium,
  ease: MOTION_EASE,
};

export const drawerTransition: Transition = {
  duration: MOTION_TOKENS.base,
  ease: MOTION_EASE,
};

export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: MOTION_TOKENS.fast,
      ease: MOTION_EASE,
    },
  },
} as const;

export const filterSwap: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TOKENS.base,
      ease: MOTION_EASE,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: MOTION_TOKENS.fast,
      ease: MOTION_EASE,
    },
  },
};

export const marqueeKeyframes = {
  left: "marquee-left 90s linear infinite",
  right: "marquee-right 90s linear infinite",
} as const;

/**
 * Returns hover/tap props that are nulled-out when the user has
 * `prefers-reduced-motion: reduce`. Use to wrap framer-motion
 * `whileHover` / `whileTap` props so they degrade gracefully.
 *
 * Example:
 *   const { whileHover, whileTap } = useMotionSafeHover({ y: -3 }, { y: 0 });
 *   <motion.div whileHover={whileHover} whileTap={whileTap} />
 */
export function useMotionSafeHover<H extends object, T extends object>(
  hover: H,
  tap?: T,
): {
  whileHover: H | undefined;
  whileTap: T | undefined;
} {
  const reduce = useReducedMotion();
  return {
    whileHover: reduce ? undefined : hover,
    whileTap: reduce ? undefined : tap,
  };
}
