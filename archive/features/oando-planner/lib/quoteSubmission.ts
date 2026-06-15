/**
 * Quote Submission Service
 *
 * Handles persisting submitted quotes to localStorage (with TODO for Supabase migration).
 * In 'request' mode, the BOQ is saved as a "pending quote" for admin to price manually.
 * In 'auto' mode, the quote is saved with calculated prices for reference.
 */

import type { QuoteResult } from './quoteEngine';

export interface QuoteSubmission {
  id: string;
  planId: string | null;
  projectName: string;
  clientName?: string;
  itemCount?: number;
  mode: 'request' | 'auto';
  status: 'pending' | 'priced' | 'accepted' | 'rejected';
  quoteResult: QuoteResult;
  submittedAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'oofpl_submitted_quotes';

/**
 * Get all submitted quotes from localStorage.
 */
export function getSubmittedQuotes(): QuoteSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QuoteSubmission[];
  } catch {
    return [];
  }
}

/**
 * Submit a quote — persists to localStorage.
 * In 'request' mode, this represents sending the BOQ to the admin notification queue.
 *
 * TODO: Migrate to Supabase `quotes` table when available.
 */
export function submitQuote(
  projectName: string,
  planId: string | null,
  quoteResult: QuoteResult,
  options?: { clientName?: string; itemCount?: number }
): QuoteSubmission {
  const existing = getSubmittedQuotes();
  const existingIndex = planId
    ? existing.findIndex((quote) => quote.planId === planId && quote.mode === quoteResult.mode)
    : -1;
  const now = new Date().toISOString();

  const submission: QuoteSubmission = existingIndex >= 0
    ? {
        ...existing[existingIndex],
        projectName,
        clientName: options?.clientName,
        itemCount: options?.itemCount,
        quoteResult,
        updatedAt: now,
        status: quoteResult.mode === 'auto' ? 'priced' : 'pending',
      }
    : {
        id: crypto.randomUUID(),
        planId,
        projectName,
        clientName: options?.clientName,
        itemCount: options?.itemCount,
        mode: quoteResult.mode,
        status: quoteResult.mode === 'auto' ? 'priced' : 'pending',
        quoteResult,
        submittedAt: now,
        updatedAt: now,
      };

  if (existingIndex >= 0) {
    existing.splice(existingIndex, 1);
  }

  existing.unshift(submission);

  // Keep max 50 submissions in localStorage
  const trimmed = existing.slice(0, 50);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full — silently fail; caller can check return value
  }

  return submission;
}

/**
 * Update the status of a submitted quote (used by admin).
 */
export function updateQuoteStatus(
  quoteId: string,
  status: QuoteSubmission['status']
): QuoteSubmission | null {
  const quotes = getSubmittedQuotes();
  const idx = quotes.findIndex((q) => q.id === quoteId);
  if (idx === -1) return null;

  quotes[idx] = {
    ...quotes[idx],
    status,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  } catch {
    // Storage full
  }

  return quotes[idx];
}

/**
 * Get a single submitted quote by ID.
 */
export function getQuoteById(quoteId: string): QuoteSubmission | null {
  const quotes = getSubmittedQuotes();
  return quotes.find((q) => q.id === quoteId) ?? null;
}
