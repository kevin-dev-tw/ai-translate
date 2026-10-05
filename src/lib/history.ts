export interface HistoryEntry {
  id: string;
  q: string;
  result: string;
  source: string;
  target: string;
  ts: number;
}

const KEY = "translate-history";
const MAX_ENTRIES = 20;
const EMPTY: HistoryEntry[] = [];

let cache: HistoryEntry[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function subscribeHistory(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

export function getHistorySnapshot(): HistoryEntry[] {
  if (cache === null) cache = readStorage();
  return cache;
}

export function getServerHistorySnapshot(): HistoryEntry[] {
  return EMPTY;
}

export function saveHistory(entries: HistoryEntry[]): void {
  cache = entries.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // 儲存失敗(空間不足等)時靜默略過
  }
  listeners.forEach((cb) => cb());
}
