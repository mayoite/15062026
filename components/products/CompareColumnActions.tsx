"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { trackQuoteCartAdded } from "@/lib/analytics/siteEvents";
import { useQuoteCart } from "@/lib/store/quoteCart";

interface CompareColumnActionsProps {
  productId: string;
  productName: string;
  productHref: string;
  image: string;
  viewLabel: string;
  addLabel: string;
}

export function CompareColumnActions({
  productId,
  productName,
  productHref,
  image,
  viewLabel,
  addLabel,
}: CompareColumnActionsProps) {
  const addItem = useQuoteCart((state) => state.addItem);
  const pathname = usePathname() || "";

  return (
    <div className="mt-4 grid gap-2">
      <Link
        href={productHref}
        className="btn-outline inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-medium"
      >
        {viewLabel}
      </Link>
      <button
        type="button"
        onClick={() => {
          trackQuoteCartAdded({
            pathname,
            surface: "compare-column-actions",
            productId,
          });
          addItem({
            id: `quote-${productId}`,
            name: productName,
            image,
            href: productHref,
            qty: 1,
          });
        }}
        aria-label={`${addLabel} ${productName}`}
        className="btn-primary inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium"
      >
        <ShoppingCart className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  );
}
