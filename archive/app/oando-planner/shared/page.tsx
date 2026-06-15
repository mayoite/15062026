import { redirect } from "next/navigation";

/** Legacy Smartdraw shell — unified planner is canonical. */
export default function LegacyOandoPlannerShared() {
  redirect("/planner/canvas/");
}
