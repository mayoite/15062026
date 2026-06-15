import { redirect } from "next/navigation";

export default function DownloadBrochurePage() {
  redirect("/downloads");
  return (
    <main>
      <h1 className="text-3xl font-semibold">Download Brochure</h1>
    </main>
  );
}
