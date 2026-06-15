import { redirect } from "next/navigation";

export default function CatalogPage() {
  redirect("/downloads");
  return (
    <main>
      <h1 className="text-3xl font-semibold">Product Catalog</h1>
    </main>
  );
}
