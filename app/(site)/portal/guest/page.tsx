import { redirect } from "next/navigation";

export default function GuestPortalPage() {
  redirect("/access?next=%2Fportal");
}
