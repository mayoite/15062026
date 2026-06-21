import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});

import enMessages from "../messages/en.json";

vi.mock("next-intl", () => {
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  return {
    useTranslations: (namespace?: string) => (key: string, values?: any) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      let text = getNestedValue(enMessages, fullKey) || fullKey;
      if (typeof text === 'string' && values) {
        Object.entries(values).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    useLocale: () => "en",
    NextIntlClientProvider: ({ children }: any) => children,
  };
});
