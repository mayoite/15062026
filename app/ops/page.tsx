import { redirect } from "next/navigation";

/** Ops routes are consolidated under the admin console. */
export default function OpsIndexPage() {
  redirect("/admin/customer-queries");
}
