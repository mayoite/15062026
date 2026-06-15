"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MOTION_EASE } from "@/lib/helpers/motion";

interface SectionRevealProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
}

export function SectionReveal({ children, delay = 0, distance = 16 }: SectionRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -50px 0px" }}
      transition={
        reduceMotion
          ? { duration: 0, delay: 0 }
          : { duration: 0.5, ease: MOTION_EASE, delay }
      }
    >
      {children}
    </motion.div>
  );
}
