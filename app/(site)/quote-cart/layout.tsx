import type { ReactNode } from "react";
import { QUOTE_CART_PAGE_METADATA } from "@/lib/site-data/routeMetadata";

export const metadata = QUOTE_CART_PAGE_METADATA;

export default function QuoteCartLayout({ children }: { children: ReactNode }) {
  return children;
}
