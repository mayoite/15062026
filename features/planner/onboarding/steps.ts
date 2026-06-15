import type { CoachStep } from "@/features/planner/onboarding/OnboardingCoach";

export const PLANNER_ONBOARDING_STEPS: CoachStep[] = [
  {
    id: "welcome",
    title: "Welcome to Workspace Planner",
    description:
      "Design professional office layouts on a mm-accurate canvas. Draw walls, place catalog furniture, toggle 3D, and export client-ready PDFs.",
  },
  {
    id: "catalog",
    title: "Furniture catalog",
    description:
      "Browse desks, benches, rooms, and zones in the left library. Click an item to place it on the canvas.",
    target: "catalog",
  },
  {
    id: "tools",
    title: "Drawing tools",
    description:
      "Use the tool column to draw walls, rooms, doors, windows, zones, and measurements.",
    target: "toolbar",
  },
  {
    id: "templates",
    title: "Start from a template",
    description:
      "Open Templates for a pre-built open-plan or meeting layout, then customize.",
    target: "templates",
  },
  {
    id: "3d-view",
    title: "2D / 3D / Split",
    description:
      "Switch views anytime — Ctrl+Tab cycles 2D, 3D, and split. Changes stay in sync.",
    target: "view-toggle",
  },
  {
    id: "ai-advisor",
    title: "AI layout assistant",
    description:
      "Ask for desk counts, meeting rooms, or zone ideas. Suggestions can be applied to the canvas.",
    target: "ai-advisor",
  },
  {
    id: "help",
    title: "Help when you need it",
    description:
      "Open Help from the top bar for guides on measure, export, and guest vs member mode.",
    target: "help-link",
  },
];
