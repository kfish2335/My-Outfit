// app/lib/api.ts

// ---------- Public API base ----------
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// ---------- Types ----------
export type StyleVibe =
  | "neat" | "relaxed" | "professional" | "trendy" | "old_money"
  | "streetwear" | "athleisure" | "minimalist" | "smart_casual"
  | "techwear" | "edgy" | "grunge" | "bohemian" | "retro" | "y2k"
  | "mediterranean" | "scandinavian";

export type BodyType = "slim" | "athletic" | "regular" | "broad" | "plus_size";

export type SuggestRequest = {
  occasion: string;
  season?: "spring" | "summer" | "fall" | "winter";
  weather: { temp: number; rain: boolean; wind?: boolean; snow?: boolean };
  style: { vibe: StyleVibe; fit: string; palette?: string | null };
  special_items?: { centerpiece?: string | null; must_include?: string | null };
  constraints?: { avoid?: string[]; budget?: number | null };
  output?: { count: number; include_notes: boolean };
  age?: number | null;
  body_type?: BodyType | null;
};

export type OutfitItems = {
  top?: string | null;
  bottom?: string | null;
  shoes?: string | null;
  outerwear?: string | null;
  layer?: string | null;
  accessories: string[];
};

export type OutfitIcons = Partial<Record<keyof OutfitItems, string | null>>;
export type OutfitIconsImg = Partial<Record<keyof OutfitItems, string | null>>;

export type Outfit = {
  items: OutfitItems;
  icons?: OutfitIcons;        // (Iconify slugs — optional)
  icons_img?: OutfitIconsImg; // (DALL·E base64 PNGs — optional)
  why?: string | null;
  notes?: string | null;
  fit_notes?: string | null;
  palette?: string[];
  // optional per-item colors (hex) if backend sends them
  items_colors?: Partial<Record<keyof OutfitItems, string>>;
};

export type SuggestResponse = { outfits: Outfit[] };

// ---------- API helpers ----------
async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Request failed: ${res.status} ${res.statusText} ${msg}`);
  }
  return res.json() as Promise<T>;
}

// ---- Suggest outfits from backend ----
export async function suggest(payload: SuggestRequest): Promise<SuggestResponse> {
  return jsonFetch<SuggestResponse>(`${API_BASE}/suggest`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

