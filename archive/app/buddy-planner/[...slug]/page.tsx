import { redirect } from "next/navigation";

export default function LegacyBuddyPlannerCatchAll() {
  redirect("/planner/canvas/");
}
