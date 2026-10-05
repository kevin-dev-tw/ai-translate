"use client";

import TranslatorCard from "@/components/TranslatorCard";
import LocaleToggle from "@/components/LocaleToggle";
import { useT } from "@/lib/i18n";

export default function Home() {
  const t = useT();
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-blue-50 via-slate-50 to-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl"
      />
      <div
        aria-hidden
        className="orb pointer-events-none absolute -left-32 top-1/4 h-80 w-80 bg-blue-500/20"
      />
      <div
        aria-hidden
        className="orb pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 bg-indigo-400/20"
      />
      <div
        aria-hidden
        className="orb pointer-events-none absolute right-1/4 top-16 h-56 w-56 bg-sky-300/15"
      />

      <div className="absolute right-5 top-5 z-20 sm:right-8">
        <LocaleToggle />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-20">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t("title.a")}
            <span className="text-blue-600">{t("title.b")}</span>
          </h1>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <TranslatorCard />
      </main>
    </div>
  );
}
