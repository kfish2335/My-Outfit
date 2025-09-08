// app/generate/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import OutfitCard from "@/app/components/OutfitCard";
import {
  suggest,
  type SuggestRequest,
  type Outfit,
} from "@/lib/api";

/* ---------- Types & constants ---------- */

type Weather = { temp: number; rain: boolean; wind?: boolean; snow?: boolean };
type StyleVibe =
  | "neat" | "relaxed" | "professional" | "trendy" | "old_money"
  | "streetwear" | "athleisure" | "minimalist" | "smart_casual"
  | "techwear" | "edgy" | "grunge" | "bohemian" | "retro" | "y2k"
  | "mediterranean" | "scandinavian";

type BodyType = "slim" | "athletic" | "regular" | "broad" | "plus_size";

type FormState = {
  occasion: string;
  season: "spring" | "summer" | "fall" | "winter";
  weather: Weather;
  style: { vibe: StyleVibe; fit: string; palette?: string | null };
  special_items?: { centerpiece?: string | null; must_include?: string | null };
  constraints?: { avoid?: string[]; budget?: number | null };
  output?: { count: number; include_notes: boolean };
  age?: number | null;
  body_type?: BodyType | null;
};

const FORM_CACHE_KEY = "form-cache-v2";
const SAVED_OUTFITS_KEY = "saved-outfits-v2";
const SAVED_PIECES_KEY = "saved-pieces-v2";

const VIBES: StyleVibe[] = [
  "neat","relaxed","professional","trendy","old_money",
  "streetwear","athleisure","minimalist","smart_casual",
  "techwear","edgy","grunge","bohemian","retro","y2k",
  "mediterranean","scandinavian",
];

const FITS = ["regular", "slim", "relaxed", "tailored"] as const;

const OCCASIONS = [
  "Coffee date","Casual hangout","Office","Interview","Wedding guest",
  "Night out","Smart casual dinner","Gym-to-street","Travel/airport",
];

const PALETTES = [
  "neutrals","earth tones","navy/gray","monochrome","high contrast",
];

/* ---------- Small utilities (typed) ---------- */

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

/* ---------- Page ---------- */

export default function GeneratePage() {
  // restore cached form (or sensible defaults)
  const [form, setForm] = useState<FormState>(() =>
    getLocal<FormState>(FORM_CACHE_KEY, {
      occasion: "Coffee date",
      season: "fall",
      weather: { temp: 68, rain: false, wind: false, snow: false },
      style: { vibe: "smart_casual", fit: "regular", palette: "neutrals" },
      special_items: { centerpiece: "", must_include: "" },
      constraints: { avoid: [], budget: null },
      output: { count: 4, include_notes: true },
      age: 28,
      body_type: "regular",
    })
  );

  // save on change
  useEffect(() => {
    setLocal(FORM_CACHE_KEY, form);
  }, [form]);

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [detailIdx, setDetailIdx] = useState<number | null>(null);

  // cached dropdown values (centerpiece, must_include)
  const [savedPieces, setSavedPieces] = useState<string[]>(() =>
    getLocal<string[]>(SAVED_PIECES_KEY, [])
  );

  useEffect(() => {
    setLocal(SAVED_PIECES_KEY, savedPieces);
  }, [savedPieces]);

  const precipLabel = useMemo(() => {
    return form.season === "winter" ? "Snow" : "Rain";
  }, [form.season]);

  /* ---------- Handlers ---------- */

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setLoading(true);

    // Build a SuggestRequest for the backend
    const payload: SuggestRequest = {
      occasion: form.occasion,
      season: form.season,
      weather: {
        temp: Number(form.weather.temp),
        rain: form.season === "winter" ? false : Boolean(form.weather.rain),
        // backend can infer from season + snow flag if needed
      },
      style: {
        vibe: form.style.vibe,
        fit: form.style.fit,
        palette: form.style.palette ?? undefined,
      },
      special_items: {
        centerpiece: form.special_items?.centerpiece || undefined,
        must_include: form.special_items?.must_include || undefined,
      },
      constraints: form.constraints,
      output: form.output,
      age: form.age ?? undefined,
      body_type: form.body_type ?? undefined,
    };

    // if winter & snow toggled on, add a hint into constraints (backend knows)
    if (form.season === "winter" && form.weather.snow) {
      payload.constraints = payload.constraints || { avoid: [], budget: null };
      const avoid = new Set(payload.constraints.avoid || []);
      // Example: avoid canvas shoes in snow
      avoid.add("canvas shoes in snow");
      payload.constraints.avoid = Array.from(avoid);
    }

    try {
      const resp = await suggest(payload);
      setOutfits(resp.outfits || []);
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Failed to generate outfits."
      );
    } finally {
      setLoading(false);
    }
  }

  function onSaveOutfit(o: Outfit) {
    const saved = getLocal<{ id: string; savedAt: number; outfit: Outfit; request: SuggestRequest }[]>(
      SAVED_OUTFITS_KEY,
      []
    );
    const id = crypto.randomUUID();
    const entry = { id, savedAt: Date.now(), outfit: o, request: toSuggestRequest(form) };
    const next = [entry, ...saved].slice(0, 200);
    setLocal(SAVED_OUTFITS_KEY, next);

    // collect centerpiece & must_include for dropdowns
    const c = form.special_items?.centerpiece?.trim();
    const m = form.special_items?.must_include?.trim();
    const nextPieces = new Set(savedPieces);
    if (c) nextPieces.add(c);
    if (m) nextPieces.add(m);
    setSavedPieces(Array.from(nextPieces).slice(0, 100));
    alert("Saved to My Wardrobe.");
  }

  function toSuggestRequest(f: FormState): SuggestRequest {
    return {
      occasion: f.occasion,
      season: f.season,
      weather: {
        temp: Number(f.weather.temp),
        rain: f.season === "winter" ? false : Boolean(f.weather.rain),
      },
      style: {
        vibe: f.style.vibe,
        fit: f.style.fit,
        palette: f.style.palette ?? undefined,
      },
      special_items: {
        centerpiece: f.special_items?.centerpiece || undefined,
        must_include: f.special_items?.must_include || undefined,
      },
      constraints: f.constraints,
      output: f.output,
      age: f.age ?? undefined,
      body_type: f.body_type ?? undefined,
    };
  }

  /* ---------- UI ---------- */

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-[var(--text)]">Generate Outfits</h1>

      <form onSubmit={onSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 space-y-5">
        {/* Occasion + Season */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Occasion</label>
            <input
              className="input"
              list="occasion-list"
              value={form.occasion}
              onChange={(e) => setForm({ ...form, occasion: e.target.value })}
              required
            />
            <datalist id="occasion-list">
              {OCCASIONS.map((o) => <option key={o} value={o} />)}
            </datalist>
          </div>

          <div>
            <label className="label">Season</label>
            <select
              className="input"
              value={form.season}
              onChange={(e) =>
                setForm({
                  ...form,
                  season: e.target.value as FormState["season"],
                  // reset precip when season changes
                  weather: {
                    ...form.weather,
                    rain: false,
                    snow: false,
                  },
                })
              }
            >
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="fall">Fall</option>
              <option value="winter">Winter</option>
            </select>
          </div>
        </section>

        {/* Weather */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Temperature (°F)</label>
            <input
              className="input"
              type="number"
              min={-10}
              max={120}
              value={form.weather.temp}
              onChange={(e) =>
                setForm({
                  ...form,
                  weather: { ...form.weather, temp: Number(e.target.value) },
                })
              }
              required
            />
          </div>

          <div className="flex items-end gap-2">
            <input
              id="precip"
              className="checkbox"
              type="checkbox"
              checked={form.season === "winter" ? !!form.weather.snow : !!form.weather.rain}
              onChange={(e) =>
                setForm({
                  ...form,
                  weather:
                    form.season === "winter"
                      ? { ...form.weather, snow: e.target.checked, rain: false }
                      : { ...form.weather, rain: e.target.checked, snow: false },
                })
              }
            />
            <label htmlFor="precip" className="label !mb-1">{precipLabel}</label>
          </div>

          <div className="flex items-end gap-2">
            <input
              id="wind"
              className="checkbox"
              type="checkbox"
              checked={!!form.weather.wind}
              onChange={(e) =>
                setForm({ ...form, weather: { ...form.weather, wind: e.target.checked } })
              }
            />
            <label htmlFor="wind" className="label !mb-1">Windy</label>
          </div>
        </section>

        {/* Style */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Style vibe</label>
            <select
              className="input"
              value={form.style.vibe}
              onChange={(e) =>
                setForm({ ...form, style: { ...form.style, vibe: e.target.value as StyleVibe } })
              }
            >
              {VIBES.map((v) => <option key={v} value={v}>{v.replace("_", " ")}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Fit</label>
            <select
              className="input"
              value={form.style.fit}
              onChange={(e) =>
                setForm({ ...form, style: { ...form.style, fit: e.target.value } })
              }
            >
              {FITS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Palette</label>
            <select
              className="input"
              value={form.style.palette ?? ""}
              onChange={(e) =>
                setForm({ ...form, style: { ...form.style, palette: e.target.value || null } })
              }
            >
              <option value="">(any)</option>
              {PALETTES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </section>

        {/* Age + Body type */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Age</label>
            <input
              className="input"
              type="number"
              min={12}
              max={100}
              value={form.age ?? ""}
              onChange={(e) =>
                setForm({ ...form, age: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
          <div>
            <label className="label">Body type</label>
            <select
              className="input"
              value={form.body_type ?? "regular"}
              onChange={(e) =>
                setForm({ ...form, body_type: e.target.value as BodyType })
              }
            >
              <option value="slim">Slim</option>
              <option value="athletic">Athletic</option>
              <option value="regular">Regular</option>
              <option value="broad">Broad</option>
              <option value="plus_size">Plus size</option>
            </select>
          </div>
        </section>

        {/* Special items */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Centerpiece</label>
            <input
              className="input"
              list="pieces-list"
              value={form.special_items?.centerpiece ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  special_items: {
                    ...(form.special_items || {}),
                    centerpiece: e.target.value,
                  },
                })
              }
            />
          </div>
          <div>
            <label className="label">Must include</label>
            <input
              className="input"
              list="pieces-list"
              value={form.special_items?.must_include ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  special_items: {
                    ...(form.special_items || {}),
                    must_include: e.target.value,
                  },
                })
              }
            />
          </div>

          <datalist id="pieces-list">
            {savedPieces.map((p) => <option key={p} value={p} />)}
          </datalist>
        </section>

        {/* Output controls */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label"># of outfits</label>
            <input
              className="input"
              type="number"
              min={1}
              max={6}
              value={form.output?.count ?? 4}
              onChange={(e) =>
                setForm({
                  ...form,
                  output: { ...(form.output || { include_notes: true }), count: Number(e.target.value) },
                })
              }
            />
          </div>
          <div className="flex items-end gap-2">
            <input
              id="notes"
              className="checkbox"
              type="checkbox"
              checked={!!form.output?.include_notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  output: { ...(form.output || { count: 4 }), include_notes: e.target.checked },
                })
              }
            />
            <label htmlFor="notes" className="label !mb-1">Include notes</label>
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">
            Generate
          </button>
        </div>
      </form>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm grid place-items-center z-40">
          <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-4 text-[var(--text)]">
            <div className="flex items-center gap-3">
              <span className="loader" aria-hidden />
              <span>Generating outfits…</span>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {serverError && (
        <div className="mt-4 rounded-md border border-red-400 bg-red-50 text-red-800 px-3 py-2 dark:bg-red-900/30 dark:text-red-200">
          {serverError}
        </div>
      )}

      {/* Results */}
      <div className="mt-6 grid grid-cols-1 gap-4">
        {outfits.map((o, i) => (
          <OutfitCard
            key={i}
            outfit={o}
            onSave={() => onSaveOutfit(o)}
            onView={() => setDetailIdx(i)}
          />
        ))}
      </div>

      {/* Simple inline modal for details */}
      {detailIdx !== null && outfits[detailIdx] && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Outfit details</h2>
              <button className="btn" onClick={() => setDetailIdx(null)}>Close</button>
            </div>
            <pre className="whitespace-pre-wrap text-sm opacity-90">
{JSON.stringify(outfits[detailIdx], null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}