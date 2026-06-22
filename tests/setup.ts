import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js font modules — they use Node APIs unavailable in happy-dom
vi.mock("next/font/local", () => ({
  default: () => ({ className: "mock-font", style: { fontFamily: "mock" } }),
}));
vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "mock-font", style: { fontFamily: "mock" } }),
  Outfit: () => ({ className: "mock-font", style: { fontFamily: "mock" } }),
}));

// server-only is a no-op in tests
vi.mock("server-only", () => ({}));

import enMessages from "../messages/en.json";

vi.mock("next-intl", () => {
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
  };

  return {
    useTranslations: (namespace?: string) => (key: string, values?: any) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      let text = getNestedValue(enMessages, fullKey) || fullKey;
      if (typeof text === 'string' && values) {
        Object.entries(values).forEach(([k, v]) => {
          text = (text as string).replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    useLocale: () => "en",
    NextIntlClientProvider: ({ children }: any) => children,
  };
});
