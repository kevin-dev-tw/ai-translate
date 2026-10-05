"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { streamTranslate, type Language } from "@/lib/api";
import { LANGUAGES } from "@/lib/languages";
import {
  getHistorySnapshot,
  getServerHistorySnapshot,
  saveHistory,
  subscribeHistory,
  type HistoryEntry,
} from "@/lib/history";
import { useT } from "@/lib/i18n";
import LanguageSelect from "./LanguageSelect";

export default function TranslatorCard() {
  const t = useT();
  const languages: Language[] = LANGUAGES;
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("zh-Hant");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [swapTick, setSwapTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const history = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getServerHistorySnapshot
  );
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const openDrawer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setDrawerClosing(false);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    if (closeTimer.current) return;
    setDrawerClosing(true);
    closeTimer.current = setTimeout(() => {
      setDrawerOpen(false);
      setDrawerClosing(false);
      closeTimer.current = null;
    }, 220);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  const langName = (code: string) =>
    code === "auto"
      ? t("auto")
      : (languages.find((l) => l.code === code)?.name ?? code);

  const handleSwap = () => {
    if (source === "auto") return;
    setSource(target);
    setTarget(source);
    setInput(output);
    setOutput(input);
    setSwapTick((t) => t + 1);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError(t("error.copy"));
    }
  };

  const handleRestore = (h: HistoryEntry) => {
    setInput(h.q);
    setOutput(h.result);
    setSource(h.source);
    setTarget(h.target);
    setError(null);
    closeDrawer();
  };

  const handleDeleteEntry = (id: string) => {
    saveHistory(history.filter((h) => h.id !== id));
  };

  const handleClearHistory = () => {
    saveHistory([]);
  };

  const handleTranslate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setOutput("");
    try {
      let full = "";
      await streamTranslate(input, source, target, (text) => {
        full += text;
        setOutput((prev) => prev + text);
      });
      if (full.trim()) {
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          q: input,
          result: full,
          source,
          target,
          ts: Date.now(),
        };
        saveHistory([
          entry,
          ...history.filter(
            (h) => !(h.q === input && h.source === source && h.target === target)
          ),
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.translate"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-blue-600/5 backdrop-blur sm:p-8">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 sm:gap-4">
        <LanguageSelect
          id="source-lang"
          label={t("source.label")}
          value={source}
          languages={languages}
          allowAuto
          onChange={setSource}
        />
        <button
          type="button"
          onClick={handleSwap}
          disabled={source === "auto"}
          title={t("swap.label")}
          aria-label={t("swap.label")}
          className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
        >
          <svg
            className="h-4 w-4 transition-transform duration-300 ease-in-out"
            style={{ transform: `rotate(${swapTick * 180}deg)` }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
            />
          </svg>
        </button>
        <LanguageSelect
          id="target-lang"
          label={t("target.label")}
          value={target}
          languages={languages}
          onChange={setTarget}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div key={`in-${swapTick}`} className="swap-panel flex flex-col">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleTranslate();
              }
            }}
            placeholder={t("input.placeholder")}
            rows={7}
            className="h-full min-h-44 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
          <div className="mt-1.5 h-4" />
        </div>

        <div key={`out-${swapTick}`} className="swap-panel relative flex flex-col">
          <div
            aria-live="polite"
            className={`h-full min-h-44 w-full whitespace-pre-wrap rounded-2xl border p-4 text-base leading-relaxed ${
              output
                ? "border-blue-200 bg-blue-50/60 text-slate-800"
                : "border-dashed border-slate-200 bg-slate-50/30 text-slate-400"
            }`}
          >
            {output || t("output.placeholder")}
          </div>
          {output && (
            <button
              type="button"
              onClick={handleCopy}
              title={t("copy.label")}
              aria-label={t("copy.label")}
              className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-slate-400 shadow-sm ring-1 ring-slate-200 backdrop-blur transition-colors hover:text-blue-600 hover:ring-blue-300"
            >
              {copied ? (
                <svg
                  className="h-4 w-4 text-green-600"
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
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                  />
                </svg>
              )}
            </button>
          )}
          <div className="mt-1.5 h-4" />
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleTranslate}
        disabled={!input.trim() || loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            {t("translating")}
          </>
        ) : (
          t("translate")
        )}
      </button>
      <p className="mt-2.5 text-center text-xs text-slate-400">
        {t("shortcut.hint")}
      </p>
      <p className="mt-1 text-center text-xs text-slate-400">
        {t("error.retry.hint")}
      </p>

      {isClient &&
        createPortal(
          <>
            <button
            type="button"
            onClick={openDrawer}
            title={t("history.title")}
            aria-label={t("history.title")}
            className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:bg-blue-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {history.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-blue-600 shadow ring-1 ring-blue-200">
                {history.length}
              </span>
            )}
          </button>

          {drawerOpen && (
            <div className="fixed inset-0 z-50">
              <div
                className={`absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] ${
                  drawerClosing ? "drawer-backdrop-out" : "drawer-backdrop"
                }`}
                onClick={closeDrawer}
              />
              <aside
                className={`absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl ${
                  drawerClosing ? "drawer-panel-out" : "drawer-panel"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 className="text-sm font-semibold text-slate-800">
                    {t("history.title")}
                  </h2>
                  <div className="flex items-center gap-1">
                    {history.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="rounded-lg px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        {t("history.clear")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeDrawer}
                      aria-label="Close"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {history.length === 0 ? (
                  <p className="flex flex-1 items-center justify-center text-sm text-slate-400">
                    {t("history.empty")}
                  </p>
                ) : (
                  <ul className="flex-1 space-y-1.5 overflow-y-auto p-3">
                    {history.map((h) => (
                      <li key={h.id} className="group flex items-stretch gap-1">
                        <button
                          type="button"
                          onClick={() => handleRestore(h)}
                          className="min-w-0 flex-1 rounded-xl border border-slate-100 px-3.5 py-2.5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/50"
                        >
                          <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                            <span>{langName(h.source)}</span>
                            <span aria-hidden>→</span>
                            <span>{langName(h.target)}</span>
                          </div>
                          <p className="truncate text-sm text-slate-700">
                            {h.q}
                          </p>
                          <p className="truncate text-sm text-blue-600">
                            {h.result}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(h.id)}
                          title={t("history.delete")}
                          aria-label={t("history.delete")}
                          className="flex w-8 items-center justify-center rounded-xl text-slate-300 transition-all hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}
