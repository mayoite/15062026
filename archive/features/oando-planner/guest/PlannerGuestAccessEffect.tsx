"use client";

import { useEffect } from "react";
import { PLANNER_GUEST_COOKIE } from "@/lib/auth/constants";

export function PlannerGuestAccessEffect() {
  useEffect(() => {
    document.cookie = `${PLANNER_GUEST_COOKIE}=true; path=/; max-age=86400`;
  }, []);

  return null;
}
