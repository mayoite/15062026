"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useQuoteCart } from "@/lib/store/quoteCart";
import { QUOTE_CART_ROUTE_COPY } from "@/data/site/routeCopy";
import { normalizeAssetPath } from "@/lib/assetPaths";

function getCompareHref(items: Array<{ href?: string }>) {
  const keys = items
    .map((item) => {
      if (!item.href) return "";
      try {
        const url = new URL(item.href, "https://oando.local");
        const parts = url.pathname.split("/").filter(Boolean);
        return parts[parts.length - 1] || "";
      } catch {
        return "";
      }
    })
    .filter(Boolean);

  const uniqueKeys = Array.from(new Set(keys)).slice(0, 4);
  return uniqueKeys.length >= 2
    ? `/compare?items=${encodeURIComponent(uniqueKeys.join(","))}`
    : null;
}

export default function QuoteCartPage() {
  const items = useQuoteCart((state) => state.items);
  const totalQty = useQuoteCart((state) => state.totalQty);
  const setQty = useQuoteCart((state) => state.setQty);
  const removeItem = useQuoteCart((state) => state.removeItem);
  const clearCart = useQuoteCart((state) => state.clearCart);
  const compareHref = useMemo(() => getCompareHref(items), [items]);

  return (
    <section className="scheme-page min-h-screen bg-soft pb-14 pt-28">
      <section className="container-wide">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="typ-overline text-muted">{QUOTE_CART_ROUTE_COPY.kicker}</p>
            <h1 className="typ-page-title mt-2">
              {QUOTE_CART_ROUTE_COPY.title}
            </h1>
            <p className="page-copy mt-3 max-w-3xl text-muted">
              {QUOTE_CART_ROUTE_COPY.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className="btn-outline">
              {QUOTE_CART_ROUTE_COPY.browseCta}
            </Link>
            {compareHref ? (
              <Link href={compareHref} className="btn-outline">
                {QUOTE_CART_ROUTE_COPY.compareCta}
              </Link>
            ) : null}
            <Link href="/downloads" className="btn-outline">
              {QUOTE_CART_ROUTE_COPY.resourceDeskCta}
            </Link>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={clearCart}
                className="btn-outline"
              >
                {QUOTE_CART_ROUTE_COPY.clearCta}
              </button>
            ) : null}
          </div>
        </header>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-soft bg-panel p-8 text-center">
            <p className="typ-lead text-strong">{QUOTE_CART_ROUTE_COPY.emptyTitle}</p>
            <p className="page-copy-sm mx-auto mt-3 max-w-2xl text-muted">
              {QUOTE_CART_ROUTE_COPY.emptyDescription}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/products" className="btn-primary">
                {QUOTE_CART_ROUTE_COPY.emptyPrimaryCta}
              </Link>
              <Link href="/downloads" className="btn-outline">
                {QUOTE_CART_ROUTE_COPY.emptySecondaryCta}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="grid grid-cols-[5.5rem_1fr] gap-4 rounded-2xl border border-soft bg-panel p-4 sm:grid-cols-[7rem_1fr]"
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24">
                    <Image
                      src={normalizeAssetPath(item.image) || "/images/fallback/category.svg"}
                      alt={item.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div>
                    <Link
                      href={item.href || "/products"}
                      className="typ-cta text-strong hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border border-soft bg-panel">
                        <button
                          type="button"
                          onClick={() => setQty(item.id, item.qty - 1)}
                          className="inline-flex h-9 w-9 items-center justify-center text-body hover:text-primary"
                          aria-label={`Decrease quantity for ${item.name}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="typ-cta min-w-9 text-center text-strong">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(item.id, item.qty + 1)}
                          className="inline-flex h-9 w-9 items-center justify-center text-body hover:text-primary"
                          aria-label={`Increase quantity for ${item.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="typ-chip text-muted inline-flex items-center gap-1 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {QUOTE_CART_ROUTE_COPY.removeCta}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="rounded-2xl border border-soft bg-panel p-5 h-fit">
              <p className="typ-overline text-muted">{QUOTE_CART_ROUTE_COPY.summaryTitle}</p>
              <p className="page-copy-sm mt-3 text-muted">
                {QUOTE_CART_ROUTE_COPY.summaryDescription}
              </p>
              <p className="typ-body-sm mt-3 text-body">
                {QUOTE_CART_ROUTE_COPY.summaryQuantityLabel}: <strong>{totalQty}</strong>
              </p>
              <p className="typ-body-sm mt-2 text-body">
                {QUOTE_CART_ROUTE_COPY.summaryProductsLabel}: <strong>{items.length}</strong>
              </p>
              {compareHref ? (
                <div className="mt-4 rounded-2xl border border-soft bg-soft p-4">
                  <p className="typ-body-sm text-strong">
                    {QUOTE_CART_ROUTE_COPY.summaryCompareHint}
                  </p>
                  <Link href={compareHref} className="typ-nav mt-3 inline-flex text-primary">
                    {QUOTE_CART_ROUTE_COPY.compareCta}
                  </Link>
                </div>
              ) : null}
              <div className="mt-4 rounded-2xl border border-soft bg-soft p-4">
                <p className="typ-body-sm text-strong">
                  {QUOTE_CART_ROUTE_COPY.summaryDeskHint}
                </p>
                <div className="mt-3 grid gap-2">
                  <Link href="/planning" className="btn-outline justify-center">
                    {QUOTE_CART_ROUTE_COPY.planningCta}
                  </Link>
                  <Link href="/downloads" className="btn-outline justify-center">
                    {QUOTE_CART_ROUTE_COPY.resourceDeskCta}
                  </Link>
                </div>
              </div>
              <Link
                href="/contact?intent=quote&source=quote-cart"
                className="btn-primary typ-chip mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 py-2.5"
              >
                {QUOTE_CART_ROUTE_COPY.primaryCta}
              </Link>
            </aside>
          </div>
        )}
      </section>
    </section>
  );
}


