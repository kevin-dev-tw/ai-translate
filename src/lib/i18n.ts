import { useSyncExternalStore } from "react";

export type Locale = "zh-Hant" | "en";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "zh-Hant", label: "繁中" },
  { code: "en", label: "EN" },
];

const KEY = "ui-locale";
const DEFAULT_LOCALE: Locale = "zh-Hant";

const dict = {
  "title.a": { "zh-Hant": "AI即時", en: "AI Instant " },
  "title.b": { "zh-Hant": "翻譯", en: "Translation" },
  subtitle: {
    "zh-Hant": "快速、準確的多語言翻譯,支援自動偵測語言",
    en: "Fast, accurate multi-language translation with auto language detection",
  },
  "source.label": { "zh-Hant": "原文語言", en: "From" },
  "target.label": { "zh-Hant": "譯文語言", en: "To" },
  auto: { "zh-Hant": "自動偵測", en: "Auto Detect" },
  "input.placeholder": {
    "zh-Hant": "輸入要翻譯的文字…",
    en: "Enter text to translate…",
  },
  "output.placeholder": {
    "zh-Hant": "翻譯結果會顯示在這裡",
    en: "Translation will appear here",
  },
  translate: { "zh-Hant": "翻譯", en: "Translate" },
  translating: { "zh-Hant": "翻譯中…", en: "Translating…" },
  "shortcut.hint": {
    "zh-Hant": "按 Enter 快速翻譯 · Shift + Enter 換行",
    en: "Press Enter to translate · Shift + Enter for a new line",
  },
  "history.title": { "zh-Hant": "翻譯記錄", en: "History" },
  "history.clear": { "zh-Hant": "清除全部", en: "Clear all" },
  "history.delete": { "zh-Hant": "刪除此筆記錄", en: "Delete entry" },
  "history.empty": {
    "zh-Hant": "尚無翻譯記錄",
    en: "No translations yet",
  },
  "copy.label": { "zh-Hant": "複製翻譯結果", en: "Copy translation" },
  "swap.label": { "zh-Hant": "交換語言", en: "Swap languages" },
  "search.placeholder": {
    "zh-Hant": "搜尋語言…",
    en: "Search languages…",
  },
  "search.empty": {
    "zh-Hant": "找不到符合的語言",
    en: "No matching language",
  },
  "error.copy": {
    "zh-Hant": "複製失敗,請手動選取文字",
    en: "Copy failed — please select the text manually",
  },
  "error.translate": {
    "zh-Hant": "翻譯失敗,請稍後再試",
    en: "Translation failed, please try again",
  },
  "error.retry.hint": {
    "zh-Hant": "如果 AI 暫時無法回應,請等幾分鐘或隔天再試",
    en: "If the AI is temporarily unavailable, please try again in a few minutes or come back tomorrow",
  },
} as const;

export type I18nKey = keyof typeof dict;

let cache: Locale | null = null;
const listeners = new Set<() => void>();

function readLocale(): Locale {
  try {
    const v = localStorage.getItem(KEY);
    return v === "en" || v === "zh-Hant" ? v : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function subscribeLocale(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getLocaleSnapshot(): Locale {
  if (cache === null) cache = readLocale();
  return cache;
}

function getServerLocaleSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function setLocale(locale: Locale): void {
  cache = locale;
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    // 靜默略過
  }
  document.documentElement.lang = locale === "en" ? "en" : "zh-Hant";
  listeners.forEach((cb) => cb());
}

export function useLocale(): Locale {
  return useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot
  );
}

export function useT(): (key: I18nKey) => string {
  const locale = useLocale();
  return (key) => dict[key][locale];
}
