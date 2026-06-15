import { useQuoteCart as originalUseQuoteCart } from "@/lib/store/quoteCart";
export type { QuoteCartItem } from "@/lib/store/quoteCart";

export const useQuoteCartStore = originalUseQuoteCart;
export const useQuoteCart = originalUseQuoteCart;
