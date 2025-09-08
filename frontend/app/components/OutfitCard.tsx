"use client";

import Image from "next/image";
import {
  OutfitItems,
  type Outfit,
} from "@/lib/api";

/** color word → hex (expand anytime) */
const COLOR_MAP: Record<string, string> = {
  white: "#ffffff",
  black: "#111111",
  gray: "#8e9399",
  grey: "#8e9399",
  silver: "#c0c0c0",
  charcoal: "#36454F",
  navy: "#14213d",
  blue: "#1f6feb",
  sky: "#87CEEB",
  teal: "#1abc9c",
  green: "#2ecc71",
  olive: "#556B2F",
  khaki: "#b7a57a",
  beige: "#d9c7a3",
  tan: "#d2b48c",
  taupe: "#b9a189",
  brown: "#8b5e3c",
  chocolate: "#5d3a1a",
  cognac: "#9a5b3f",
  burgundy: "#800020",
  maroon: "#7f1d1d",
  red: "#ef4444",
  rust: "#b7410e",
  orange: "#f97316",
  coral: "#ff7f50",
  yellow: "#f59e0b",
  gold: "#d4af37",
  sand: "#e2c799",
  cream: "#f5f0e6",
  offwhite: "#f4f4f2",
  ecru: "#f5f1e3",
  purple: "#7c3aed",
  plum: "#673147",
  pink: "#ec4899",
};

// ✅ Make sizes explicit and uniform
const ICON_SIZE = 44;
const SWATCH_SIZE = 44;

type ItemKey = keyof OutfitItems; // "top" | "bottom" | "shoes" | "outerwear" | "layer" | "accessories"

/** Resolve a per-item color (either provided as hex via items_colors or inferred from text keywords). */
function perItemColor(
  key: ItemKey,
  text: string | null | undefined,
  itemsColors?: Partial<Record<ItemKey, string>>
): string | undefined {
  const hexMaybe = (itemsColors?.[key] ?? "").trim();
  if (typeof hexMaybe === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hexMaybe)) {
    return hexMaybe;
  }
  const t = (text || "").toLowerCase();
  for (const k of Object.keys(COLOR_MAP)) {
    if (t.includes(k) || t.includes(`dark ${k}`) || t.includes(`light ${k}`)) {
      return COLOR_MAP[k];
    }
  }
  return undefined;
}

/** Safely get the first accessories icon (works if backend sent array or nothing). */
function firstAccessoriesImg(
  accessoriesIcons?: (string | null)[] | string | null
): string | null {
  if (Array.isArray(accessoriesIcons)) {
    return accessoriesIcons[0] ?? null;
  }
  return (accessoriesIcons as string | null) ?? null;
}

export default function OutfitCard({
  outfit,
  onSave,
  onView,
}: {
  outfit: Outfit;
  onSave?: () => void;
  onView?: () => void;
}) {
  const it = outfit.items || {};
  const img = outfit.icons_img || {};
  const itemsColors = outfit.items_colors; // ✅ typed, no any

  const cTop = perItemColor("top", it.top, itemsColors);
  const cBottom = perItemColor("bottom", it.bottom, itemsColors);
  const cShoes = perItemColor("shoes", it.shoes, itemsColors);
  const cOuter = perItemColor("outerwear", it.outerwear, itemsColors);
  const cLayer = perItemColor("layer", it.layer, itemsColors);
  const firstAccessory = (it.accessories || [])[0];
  const cAcc = perItemColor("accessories", firstAccessory, itemsColors);

  // accessories icon (array-aware)
  const accImg = firstAccessoriesImg(img.accessories as unknown as (string | null)[] | string | null);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] p-4 shadow-sm">
      <ItemRow label="Top"       text={it.top}       img={img.top ?? null}       emoji="👕" color={cTop} />
      <ItemRow label="Bottom"    text={it.bottom}    img={img.bottom ?? null}    emoji="👖" color={cBottom} />
      <ItemRow label="Shoes"     text={it.shoes}     img={img.shoes ?? null}     emoji="👞" color={cShoes} />
      <ItemRow label="Outerwear" text={it.outerwear} img={img.outerwear ?? null} emoji="🧥" color={cOuter} />
      <ItemRow label="Layer"     text={it.layer}     img={img.layer ?? null}     emoji="🧶" color={cLayer} />
      <ItemRow
        label="Accessories"
        text={(it.accessories || []).join(", ")}
        img={accImg}
        emoji="⌚"
        color={cAcc}
      />

      {!!outfit.why && (
        <p className="mt-3 text-sm opacity-90"><b>Why:</b> {outfit.why}</p>
      )}
      {!!outfit.fit_notes && (
        <p className="mt-1 text-sm opacity-90"><b>Fit notes:</b> {outfit.fit_notes}</p>
      )}

      {(outfit.palette && outfit.palette.length > 0) && (
        <div className="mt-3 flex gap-2">
          {outfit.palette.map((hex, i) => (
            <span
              key={i}
              className="rounded border border-[var(--border)]"
              style={{ width: SWATCH_SIZE, height: SWATCH_SIZE, backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {onView && <button className="btn" onClick={onView}>Details</button>}
        {onSave && <button className="btn-primary" onClick={onSave}>Save Outfit</button>}
      </div>
    </div>
  );
}

function ItemRow({
  label,
  text,
  img,
  emoji,
  color,
}: {
  label: string;
  text?: string | null;
  img?: string | null;
  emoji: string;
  color?: string;
}) {
  const ringStyle = color ? { boxShadow: `0 0 0 2px ${color} inset` } : undefined;

  // Make a data URL for next/image when we have base64
  const dataUrl = img ? `data:image/png;base64,${img}` : null;

  return (
    <div className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-b-0">
      <span className="inline-flex items-center gap-2 min-w-[110px]">
        <span className="text-xs uppercase tracking-wide opacity-70">{label}</span>
      </span>

      <span className="inline-flex items-center gap-3 flex-1">
        {/* ✅ icon with hard 44×44 size */}
        <span
          className="icon-shell"
          style={{
            ...ringStyle,
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: 8,
            border: "1px solid var(--border)",
            display: "grid",
            placeItems: "center",
            background: "var(--card)",
          }}
        >
          {dataUrl ? (
            <Image
              src={dataUrl}
              alt={label}
              width={ICON_SIZE - 8}
              height={ICON_SIZE - 8}
              style={{ objectFit: "contain" }}
              // data URLs don’t require next.config domains
              priority={false}
            />
          ) : (
            <span className="icon-emoji" aria-hidden style={{ fontSize: 20 }}>{emoji}</span>
          )}
        </span>

        {/* ✅ per-item color swatch, hard 44×44 */}
        <span
          style={{
            width: SWATCH_SIZE,
            height: SWATCH_SIZE,
            borderRadius: 8,
            border: "1px solid var(--border)",
            backgroundColor: color || "var(--border)",
          }}
          title={color ? `color: ${color}` : "color: n/a"}
        />

        {/* description text */}
        <span className="font-medium">{text || "-"}</span>
      </span>
    </div>
  );
}