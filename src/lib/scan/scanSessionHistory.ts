import type { ScanMode, ScanResponseBody } from "@/types/scan";

export const SCAN_SESSION_HISTORY_KEY = "hack-latam.scanSession.v1";
export const SCAN_SESSION_HISTORY_MAX = 10;

export type ScanSessionHistoryEntry = {
  id: string;
  savedAt: number;
  /** User-entered target string at run time */
  inputTarget: string;
  mode: ScanMode;
  result: ScanResponseBody;
};

type PersistedShape = {
  v: 1;
  entries: ScanSessionHistoryEntry[];
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isScanMode(x: unknown): x is ScanMode {
  return x === "deep" || x === "quick";
}

function isScanResponseBody(x: unknown): x is ScanResponseBody {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.target === "string" &&
    typeof o.normalizedTarget === "string" &&
    (o.inputKind === "domain" ||
      o.inputKind === "ip" ||
      o.inputKind === "unknown") &&
    isScanMode(o.mode) &&
    Array.isArray(o.findings) &&
    Array.isArray(o.modules)
  );
}

function isHistoryEntry(x: unknown): x is ScanSessionHistoryEntry {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.savedAt === "number" &&
    typeof o.inputTarget === "string" &&
    isScanMode(o.mode) &&
    isScanResponseBody(o.result)
  );
}

export function loadScanSessionHistory(): ScanSessionHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(SCAN_SESSION_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      (parsed as PersistedShape).v !== 1
    )
      return [];
    const entries = (parsed as PersistedShape).entries;
    if (!Array.isArray(entries)) return [];
    return entries.filter(isHistoryEntry).slice(0, SCAN_SESSION_HISTORY_MAX);
  } catch {
    return [];
  }
}

export function persistScanSessionHistory(
  entries: ScanSessionHistoryEntry[],
): void {
  if (typeof window === "undefined") return;
  try {
    const slice = entries.slice(0, SCAN_SESSION_HISTORY_MAX);
    const payload: PersistedShape = { v: 1, entries: slice };
    window.sessionStorage.setItem(
      SCAN_SESSION_HISTORY_KEY,
      JSON.stringify(payload),
    );
  } catch {
    /* sessionStorage full or disabled */
  }
}

/**
 * Prepend a new run and cap list size. Does not persist — call `persistScanSessionHistory` after.
 */
export function appendScanSessionHistoryEntry(
  prev: ScanSessionHistoryEntry[],
  partial: Pick<ScanSessionHistoryEntry, "inputTarget" | "mode" | "result">,
): { entries: ScanSessionHistoryEntry[]; newId: string } {
  const id = newId();
  const entry: ScanSessionHistoryEntry = {
    id,
    savedAt: Date.now(),
    inputTarget: partial.inputTarget,
    mode: partial.mode,
    result: partial.result,
  };
  const entries = [entry, ...prev].slice(0, SCAN_SESSION_HISTORY_MAX);
  return { entries, newId: id };
}

export function formatHistoryRelativeEs(savedAt: number): string {
  const diffMs = Date.now() - savedAt;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return "Ahora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Hace ${d} d`;
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(savedAt);
}
