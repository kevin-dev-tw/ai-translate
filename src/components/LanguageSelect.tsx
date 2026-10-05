"use client";

import { useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/api";
import { useT } from "@/lib/i18n";

interface LanguageSelectProps {
  id: string;
  label: string;
  value: string;
  languages: Language[];
  allowAuto?: boolean;
  onChange: (value: string) => void;
}

export default function LanguageSelect({
  id,
  label,
  value,
  languages,
  allowAuto = false,
  onChange,
}: LanguageSelectProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const options: Language[] = [
    ...(allowAuto ? [{ code: "auto", name: t("auto") }] : []),
    ...languages,
  ];
  const filtered = options.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.code.toLowerCase().includes(query.toLowerCase())
  );
  const selected = options.find((l) => l.code === value);

  return (
    <div ref={ref} className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            setOpen((o) => !o);
            setQuery("");
          }}
          className={`flex w-full items-center justify-between gap-2 rounded-full border bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
            open
              ? "border-blue-600 text-slate-800 ring-2 ring-blue-600/20"
              : "border-slate-200 text-slate-800 hover:border-blue-300"
          }`}
        >
          <span className="truncate">{selected?.name ?? value}</span>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180 text-blue-600" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

        {open && (
          <div
            role="listbox"
            className="dropdown-panel absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-blue-900/10"
          >
            <div className="border-b border-slate-100 p-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="w-full rounded-full bg-slate-50 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <li className="px-3 py-2.5 text-sm text-slate-400">
                  {t("search.empty")}
                </li>
              )}
              {filtered.map((l) => {
                const isSelected = l.code === value;
                return (
                  <li key={l.code} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(l.code);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-blue-600/10 font-medium text-blue-700"
                          : "text-slate-700 hover:bg-blue-50"
                      }`}
                    >
                      <span className="truncate">{l.name}</span>
                      {isSelected && (
                        <svg
                          className="h-4 w-4 shrink-0 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
