"use client";

import { LOCALES, setLocale, useLocale } from "@/lib/i18n";

export default function LocaleToggle() {
  const locale = useLocale();
  return (
    <div className="flex rounded-full border border-slate-200 bg-white/80 p-0.5 shadow-sm backdrop-blur">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLocale(l.code)}
          aria-pressed={locale === l.code}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            locale === l.code
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-blue-600"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
