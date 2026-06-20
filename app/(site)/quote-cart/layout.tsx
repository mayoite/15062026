import type { ReactNode } from "react";
import { QUOTE_CART_PAGE_METADATA } from "@/data/site/routeMetadata";

export const metadata = QUOTE_CART_PAGE_METADATA;

export default function QuoteCartLayout({ children }: { children: ReactNode }) {
  return children;
}
