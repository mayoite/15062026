"use client";

import { Suspense } from "react";

import type { CompatCategory as Category } from "@/features/catalog/getProducts";

import { AdvancedFilterGridInner } from "./FilterGridInner";

export function FilterGrid({
  category,
  categoryId,
}: {
  category: Category;
  categoryId: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="text-muted w-full h-64 flex items-center justify-center text-sm">
          Loading products...
        </div>
      }
    >
      <AdvancedFilterGridInner category={category} categoryId={categoryId} />
    </Suspense>
  );
}
