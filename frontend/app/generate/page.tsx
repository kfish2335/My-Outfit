"use client";

import { useMemo, useState } from "react";
import type {
  SuggestRequest,
  SuggestResponse,
  Outfit,
  StyleVibe,
  BodyType,
  Season,
} from "../types/api";

import { suggest } from "../../lib/api";
import OutfitCard from "../components/OutfitCard";
import Modal from "../components/Modal";
import { saveOutfit, loadPieces } from "../../lib/storage";

// ----- Presets -----
const VIBES: StyleVibe[] = [
  "smart_casual", "minimalist", "old_money", "streetwear",
  "neat", "relaxed", "professional", "trendy",
];
const FITS = ["tailored", "regular", "relaxed"];
const PALETTES = ["neutrals", "cool", "warm", "monochrome"];
const BODY_TYPES: BodyType[] = ["slim", "athletic", "regular", "broad", "plus_size"];
const OCCASIONS = ["coffee date", "office", "wedding guest", "night out", "weekend casual", "dinner", "interview"];
// ❌ removed "all"
const SEASONS: Season[] = ["spring", "summer", "fall", "winter"];

// ----- Small autofill helpers -----
function autoOccasionForVibe(v: StyleVibe): string {
  switch (v) {
    case "old_money": return "dinner";
    case "streetwear": return "night out";
    case "professional": return "office";
    case "minimalist": return "coffee date";
    case "smart_casual": return "dinner";
    default: return "coffee date";
  }
}
function autoPaletteForVibe(v: StyleVibe): string {
  switch (v) {
    case "old_money": return "neutrals";
    case "minimalist": return "monochrome";
    case "streetwear": return "cool";
    case "smart_casual": return "neutrals";
    case "professional": return "cool";
    default: return "neutrals";
  }
}
function autoCenterpiece(v: StyleVibe): string {
  switch (v) {
    case "old_money": return "navy blazer";
    case "streetwear": return "oversized hoodie";
    case "minimalist": return "premium white tee";
    case "smart_casual": return "oxford shirt";
    case "professional": return "charcoal sport coat";
    default: return "knit polo";
  }
}
function autoMustInclude(occ: string): string {
  const o = occ.toLowerCase();
  if (o.includes("office") || o.includes("interview")) return "leather belt";
  if (o.includes("wedding")) return "dress shoes";
  if (o.includes("night")) return "chelsea boots";
  if (o.includes("coffee")) return "clean white sneakers";
  return "watch";
}
function autoFitForBody(bt?: BodyType | ""): string {
  switch (bt) {
    case "slim": return "tailored";
    case "athletic": return "regular";
    case "regular": return "regular";
    case "broad": return "relaxed";
    case "plus_size": return "relaxed";
    default: return "regular";
  }
}

export default function GeneratorPage() {
  // ----- Form state -----
  const [occasion, setOccasion] = useState<string>("coffee date");
  // default to spring (no "all" option anymore)
  const [season, setSeason] = useState<Season>("spring");
  const [temp, setTemp] = useState<number>(68);
  const [rain, setRain] = useState<boolean>(false);
  const [vibe, setVibe] = useState<StyleVibe>("smart_casual");
  const [fit, setFit] = useState<string>("regular");
  const [palette, setPalette] = useState<string>("neutrals");
  const [centerpiece, setCenterpiece] = useState<string>("");
  const [mustInclude, setMustInclude] = useState<string>("");
  const [avoid, setAvoid] = useState<string>("");
  const [age, setAge] = useState<number | "">("");
  const [bodyType, setBodyType] = useState<BodyType | "">("");

  // ----- UI state -----
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Outfit | null>(null);

  // ----- Autocomplete caches -----
  const piecesCache = useMemo(() => loadPieces(), []);

  // Build payload (season included, 4 outfits)
  function makePayload(): SuggestRequest {
    return {
      occasion,
      season, // still sent to backend
      weather: { temp: Number(temp), rain: !!rain }, // backend still gets "rain" boolean
      style: { vibe, fit, palette: palette || null },
      special_items: {
        centerpiece: centerpiece?.trim() || null,
        must_include: mustInclude?.trim() || null,
      },
      constraints: {
        avoid:
          avoid
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || undefined,
        budget: null,
      },
      output: { count: 4, include_notes: true },
      age: age === "" ? null : Number(age),
      body_type: bodyType === "" ? null : bodyType,
    };
  }

  // ----- Autofill buttons -----
  function autoFillOccasion() {
    setOccasion((prev) => prev || autoOccasionForVibe(vibe));
  }
  function autoFillStyle() {
    setPalette((prev) => prev || autoPaletteForVibe(vibe));
    setFit((prev) => prev || autoFitForBody(bodyType));
  }
  function autoFillYou() {
    setBodyType((prev) => prev || "regular");
    setFit((prev) => prev || autoFitForBody(bodyType || "regular"));
  }
  function autoFillSpecial() {
    setCenterpiece((prev) => prev || autoCenterpiece(vibe));
    setMustInclude((prev) => prev || autoMustInclude(occasion));
  }
  function autoFillAll() {
    autoFillOccasion();
    autoFillStyle();
    autoFillYou();
    autoFillSpecial();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await suggest(makePayload());
      setResult(res);
    } catch (err: any) {
      const msg = err?.message || "Request failed";
      setError(msg);
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  function onSaveClick(outfit: Outfit) {
    const entry = saveOutfit(makePayload(), outfit);
    if (entry) alert("Outfit saved.");
  }

  // UI strings for precipitation: in winter, call it "Snow"; otherwise "Rain".
  const precipLabel = season === "winter" ? "Snow" : "Rain";

  return (
    <div className="page">
      <h1 className="title">Generate an Outfit</h1>

      <form className="card form" onSubmit={onSubmit}>
        {/* Quick Start */}
        <div className="form-section between">
          <div className="section-title">Quick Start</div>
          <button type="button" className="auto-btn" onClick={autoFillAll}>Auto-fill all</button>
        </div>

        {/* Occasion */}
        <div className="form-section bordered">
          <div className="section-title between">
            <span>Occasion</span>
            <button type="button" className="auto-btn" onClick={autoFillOccasion}>Auto</button>
          </div>
          <div className="chip-row" style={{ marginBottom: 10 }}>
            {OCCASIONS.map((o) => (
              <button
                type="button"
                key={o}
                className={`chip ${occasion === o ? "chip-active" : ""}`}
                onClick={() => setOccasion(o)}
              >
                {o}
              </button>
            ))}
          </div>
          <div className="form-block">
            <label className="label">Or type an occasion</label>
            <input
              className="input"
              list="occasion-list"
              placeholder="e.g., gallery opening"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
            />
            <datalist id="occasion-list">
              {OCCASIONS.map((o) => <option key={o} value={o} />)}
            </datalist>
          </div>
        </div>

        {/* Season */}
        <div className="form-section bordered">
          <div className="section-title">Season</div>
          <div className="chip-row">
            {SEASONS.map((s) => (
              <button
                type="button"
                key={s}
                className={`chip ${season === s ? "chip-active" : ""}`}
                onClick={() => setSeason(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Weather */}
        <div className="form-section bordered">
          <div className="section-title">Weather</div>
          <div className="form-grid">
            <div className="form-block">
              <label className="label">Temperature (°F)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={120}
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
              />
            </div>
            <div className="form-block">
              <label className="label">{precipLabel}</label>
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip ${!rain ? "chip-active" : ""}`}
                  onClick={() => setRain(false)}
                >
                  No
                </button>
                <button
                  type="button"
                  className={`chip ${rain ? "chip-active" : ""}`}
                  onClick={() => setRain(true)}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Style */}
        <div className="form-section bordered">
          <div className="section-title between">
            <span>Style</span>
            <button type="button" className="auto-btn" onClick={autoFillStyle}>Auto</button>
          </div>
          <div className="form-grid">
            <div className="form-block">
              <label className="label">Vibe</label>
              <div className="chip-row">
                {VIBES.map((v) => (
                  <button
                    type="button"
                    key={v}
                    className={`chip ${vibe === v ? "chip-active" : ""}`}
                    onClick={() => setVibe(v)}
                  >
                    {v.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-block">
              <label className="label">Fit</label>
              <div className="chip-row">
                {FITS.map((f) => (
                  <button
                    type="button"
                    key={f}
                    className={`chip ${fit === f ? "chip-active" : ""}`}
                    onClick={() => setFit(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-block" style={{ marginTop: 10 }}>
            <label className="label">Palette</label>
            <div className="chip-row">
              {PALETTES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip ${palette === p ? "chip-active" : ""}`}
                  onClick={() => setPalette(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* About You */}
        <div className="form-section bordered">
          <div className="section-title">About You</div>
          <div className="form-grid">
            <div className="form-block">
              <label className="label">Age</label>
              <input
                className="input"
                type="number"
                min={12}
                max={100}
                value={age}
                onChange={(e) =>
                  setAge(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>
            <div className="form-block">
              <label className="label">Body type</label>
              <div className="chip-row">
                {BODY_TYPES.map((bt) => (
                  <button
                    key={bt}
                    type="button"
                    className={`chip ${bodyType === bt ? "chip-active" : ""}`}
                    onClick={() => setBodyType(bt)}
                  >
                    {bt.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Special Items */}
        <div className="form-section bordered">
          <div className="section-title">Special Items</div>
          <div className="form-grid">
            <div className="form-block">
              <label className="label">Centerpiece</label>
              <input
                className="input"
                list="centerpieces"
                placeholder="e.g., navy blazer"
                value={centerpiece}
                onChange={(e) => setCenterpiece(e.target.value)}
              />
              <datalist id="centerpieces">
                {piecesCache.centerpieces?.map((c, i) => (
                  <option key={i} value={c} />
                ))}
              </datalist>
            </div>
            <div className="form-block">
              <label className="label">Must include</label>
              <input
                className="input"
                list="mustinclude"
                placeholder="e.g., leather shoes"
                value={mustInclude}
                onChange={(e) => setMustInclude(e.target.value)}
              />
              <datalist id="mustinclude">
                {piecesCache.mustInclude?.map((m, i) => (
                  <option key={i} value={m} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Constraints */}
        <div className="form-section bordered">
          <div className="section-title">Constraints</div>
          <div className="form-block">
            <label className="label">Avoid (comma separated)</label>
            <input
              className="input"
              placeholder="e.g., sandals, bright red"
              value={avoid}
              onChange={(e) => setAvoid(e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="form-section">
          <div className="form-actions" style={{ display: "flex", gap: ".5rem" }}>
            <button className="btn" type="button" onClick={autoFillAll}>
              Auto-fill all
            </button>
            <button className="btn-primary" type="submit" disabled={loading}>
              Generate
            </button>
          </div>

          {loading && (
            <div className="loading-overlay">
              <div className="loading">
                <div className="spinner" />
                <div>Generating outfits…</div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="results">
          <h2 className="subtitle">Suggestions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {result.outfits.map((o, idx) => (
              <OutfitCard
                key={idx}
                outfit={o}
                onView={() => setOpen(o)}
                onSave={() => onSaveClick(o)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={!!open} onClose={() => setOpen(null)} title="Outfit details">
        {open && (
          <div className="space-y-2 text-sm">
            <div><b>Top:</b> {open.items.top || "-"}</div>
            <div><b>Bottom:</b> {open.items.bottom || "-"}</div>
            <div><b>Shoes:</b> {open.items.shoes || "-"}</div>
            <div><b>Outerwear:</b> {open.items.outerwear || "-"}</div>
            <div><b>Layer:</b> {open.items.layer || "-"}</div>
            <div><b>Accessories:</b> {(open.items.accessories || []).join(", ") || "-"}</div>
            {open.why && <div><b>Why:</b> {open.why}</div>}
            {open.fit_notes && <div><b>Fit notes:</b> {open.fit_notes}</div>}
            {open.notes && <div><b>How to wear:</b> {open.notes}</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}