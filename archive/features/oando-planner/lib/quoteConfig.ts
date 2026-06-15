/**
 * Quote Mode Configuration
 *
 * Controls how the BOQ-to-quote workflow operates:
 * - 'request': Manual pricing mode (Quote Mode A) — BOQ is sent for manual pricing
 * - 'auto': Auto-quote mode (Quote Mode B) — prices are calculated from catalog data
 *
 * Currently backed by localStorage; will migrate to Supabase settings table.
 */

export type QuoteMode = 'request' | 'auto';

const STORAGE_KEY = 'oofpl_quote_mode';
const DEFAULT_MODE: QuoteMode = 'request';

/**
 * Read the current quote mode from localStorage.
 * Returns 'request' if no value is stored or value is invalid.
 */
export function getQuoteMode(): QuoteMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'request' || stored === 'auto') return stored;
  return DEFAULT_MODE;
}

/**
 * Persist the selected quote mode to localStorage.
 */
export function setQuoteMode(mode: QuoteMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, mode);
}
