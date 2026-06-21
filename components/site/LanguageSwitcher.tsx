"use client";

import { useEffect, useState } from "react";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "हिन्दी (Hindi)",
  fr: "Français (French)",
  de: "Deutsch (German)",
  es: "Español (Spanish)",
};

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState("en");

  useEffect(() => {
    const match = document.cookie.match(/(^|;)\s*NEXT_LOCALE\s*=\s*([^;]+)/);
    if (match) {
      Promise.resolve().then(() => setCurrentLocale(match[2]));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    setCurrentLocale(nextLocale);
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      <label htmlFor="locale-switcher" className="text-gray-400 text-xs">
        Select Language
      </label>
      <select
        id="locale-switcher"
        value={currentLocale}
        onChange={handleChange}
        className="bg-transparent border border-gray-600 rounded px-2.5 py-1 text-sm text-white focus:outline-none focus:border-primary cursor-pointer w-40"
      >
        {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
          <option key={code} value={code} className="bg-neutral-900 text-white">
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
