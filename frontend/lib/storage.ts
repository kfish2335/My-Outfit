// lib/storage.ts
import { SavedOutfit, SuggestRequest, Outfit } from "@/app/types/api";

const KEY = "savedOutfits";
const PIECES_KEY = "piecesCache";

export function loadSaved(): SavedOutfit[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveOutfit(request: SuggestRequest, outfit: Outfit): SavedOutfit {
  const entry: SavedOutfit = {
    id: crypto.randomUUID(),
    savedAt: Date.now(),
    request,
    outfit,
  };
  const list = loadSaved();
  list.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(list));
  // also maintain center/must-include dropdown cache
  persistPieces(request);
  return entry;
}

export function deleteSaved(id: string) {
  const list = loadSaved().filter(x => x.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function loadPieces(): { centerpieces: string[]; mustInclude: string[] } {
  if (typeof window === "undefined") return { centerpieces: [], mustInclude: [] };
  try { return JSON.parse(localStorage.getItem(PIECES_KEY) || '{"centerpieces":[],"mustInclude":[]}'); }
  catch { return { centerpieces: [], mustInclude: [] }; }
}

function persistPieces(req: SuggestRequest) {
  const prev = loadPieces();
  const c = req.special_items?.centerpiece?.trim();
  const m = req.special_items?.must_include?.trim();
  if (c && !prev.centerpieces.includes(c)) prev.centerpieces.unshift(c);
  if (m && !prev.mustInclude.includes(m)) prev.mustInclude.unshift(m);
  localStorage.setItem(PIECES_KEY, JSON.stringify(prev));
}

export type LastForm = {
  occasion?: string;
  season?: "spring" | "summer" | "fall" | "winter";
  temp?: number;
  rain?: boolean;
  vibe?: string;
  fit?: string;
  palette?: string;
  centerpiece?: string;
  mustInclude?: string;
  avoid?: string;
  age?: number | "";
  bodyType?: string | "";
};

const FORM_KEY = "myoutfit:lastForm:v1";

export function loadLastForm(): LastForm | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FORM_KEY);
    return raw ? (JSON.parse(raw) as LastForm) : null;
  } catch {
    return null;
  }
}

export function saveLastForm(data: LastForm) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FORM_KEY, JSON.stringify(data));
  } catch {}
}