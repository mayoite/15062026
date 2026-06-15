import { redirect } from "next/navigation";

export default function BrochurePage() {
  redirect("/downloads");
  return (
    <main>
      <h1 className="text-3xl font-semibold">Brochure</h1>
    </main>
  );
}
