// app/types/api.ts
export type StyleVibe =
  | "neat" | "relaxed" | "professional" | "trendy" | "old_money"
  | "streetwear" | "athleisure" | "minimalist" | "smart_casual"
  | "techwear" | "edgy" | "grunge" | "bohemian" | "retro" | "y2k"
  | "mediterranean" | "scandinavian";

export type BodyType = "slim" | "athletic" | "regular" | "broad" | "plus_size";
export type Season = "spring" | "summer" | "fall" | "winter" | "all";

export type SuggestRequest = {
  occasion: string;
  season?: Season | null;                       // NEW (optional)
  weather: { temp: number; rain: boolean };
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

export type OutfitIcons = {
  top?: string | null;
  bottom?: string | null;
  shoes?: string | null;
  outerwear?: string | null;
  layer?: string | null;
  accessories?: (string | null)[];
};

export type OutfitIconsImg = {
  top?: string | null;
  bottom?: string | null;
  shoes?: string | null;
  outerwear?: string | null;
  layer?: string | null;
  accessories?: (string | null)[];
};

export type Outfit = {
  items: OutfitItems;
  icons?: OutfitIcons;
  icons_img?: OutfitIconsImg;
  why?: string | null;
  notes?: string | null;
  fit_notes?: string | null;
  palette?: string[];
  // items_colors?: Partial<{ top: string; bottom: string; shoes: string; outerwear: string; layer: string; accessories: string }>;
};

export type SuggestResponse = { outfits: Outfit[] };

export type FeedbackPayload = {
  liked?: string[];
  disliked?: string[];
  fit_issues?: string[];
  notes?: string;
};

export type SavedOutfit = {
  id: string;
  savedAt: number;
  request: SuggestRequest;
  outfit: Outfit;
  feedback?: FeedbackPayload;
};