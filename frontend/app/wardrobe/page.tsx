// app/wardrobe/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Outfit, SavedOutfit } from "@/app/types/api";
import OutfitCard from "@/app/components/OutfitCard";
import Modal from "@/app/components/Modal";

/** LocalStorage keys used by your generator/save logic */
const SAVED_KEY = "savedOutfits";
const PIECES_KEY = "piecesCache";

type PiecesCache = {
  centerpieces: string[];
  mustInclude: string[];
};

export default function WardrobePage() {
  const [saved, setSaved] = useState<SavedOutfit[]>([]);
  const [pieces, setPieces] = useState<PiecesCache>({ centerpieces: [], mustInclude: [] });
  const [open, setOpen] = useState<Outfit | null>(null);

  // ---------- Load on mount ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch (e) {
      console.error("[wardrobe] failed to read saved outfits:", e);
    }
    try {
      const rawP = localStorage.getItem(PIECES_KEY);
      if (rawP) setPieces(JSON.parse(rawP));
    } catch (e) {
      console.error("[wardrobe] failed to read pieces cache:", e);
    }
  }, []);

  // ---------- Persist helpers ----------
  function persistSaved(next: SavedOutfit[]) {
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  }
  function persistPieces(next: PiecesCache) {
    setPieces(next);
    localStorage.setItem(PIECES_KEY, JSON.stringify(next));
  }

  // ---------- Saved outfits actions ----------
  function deleteOutfit(id: string) {
    const next = saved.filter((s) => s.id !== id);
    persistSaved(next);
  }
  function clearAllOutfits() {
    if (!confirm("Remove all saved outfits?")) return;
    persistSaved([]);
  }

  // ---------- Saved pieces actions ----------
  function deleteCenterpiece(v: string) {
    const next = { ...pieces, centerpieces: pieces.centerpieces.filter((x) => x !== v) };
    persistPieces(next);
  }
  function deleteMustInclude(v: string) {
    const next = { ...pieces, mustInclude: pieces.mustInclude.filter((x) => x !== v) };
    persistPieces(next);
  }
  function clearAllPieces() {
    if (!confirm("Clear all saved pieces?")) return;
    persistPieces({ centerpieces: [], mustInclude: [] });
  }

  // ---------- Derived ----------
  const outfitCount = saved.length;
  const sorted = useMemo(
    () => [...saved].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)),
    [saved]
  );

  return (
    <div className="page">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="title">My Wardrobe</h1>
        {outfitCount > 0 && (
          <button className="btn" onClick={clearAllOutfits}>Clear outfits</button>
        )}
      </div>

      {/* ===== Saved Pieces ===== */}
      <section className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="subtitle">Saved Pieces</h2>
          {(pieces.centerpieces.length > 0 || pieces.mustInclude.length > 0) && (
            <button className="btn" onClick={clearAllPieces}>Clear pieces</button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm uppercase tracking-wide opacity-70 mb-2">Centerpieces</h3>
            {pieces.centerpieces?.length ? (
              <ul className="space-y-2">
                {pieces.centerpieces.map((c, i) => (
                  <li
                    key={`${c}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                  >
                    <span className="font-medium">{c}</span>
                    <button className="btn" onClick={() => deleteCenterpiece(c)}>Delete</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm opacity-70">No saved centerpieces yet.</p>
            )}
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-wide opacity-70 mb-2">Must-include</h3>
            {pieces.mustInclude?.length ? (
              <ul className="space-y-2">
                {pieces.mustInclude.map((m, i) => (
                  <li
                    key={`${m}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                  >
                    <span className="font-medium">{m}</span>
                    <button className="btn" onClick={() => deleteMustInclude(m)}>Delete</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm opacity-70">No saved must-include items yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* ===== Saved Outfits ===== */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="subtitle">Saved Outfits</h2>
          <span className="text-sm opacity-70">{outfitCount} total</span>
        </div>

        {outfitCount === 0 ? (
          <div className="card p-6">
            <p className="text-sm opacity-80">
              You haven’t saved any outfits yet. Generate looks on{" "}
              <a className="link" href="/generate">Generator</a> and tap <b>Save Outfit</b>.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sorted.map((s) => (
              <div key={s.id} className="relative">
                <OutfitCard
                  outfit={s.outfit}
                  onView={() => setOpen(s.outfit)}
                  // Already saved; no onSave button here
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs opacity-70">
                    Saved {new Date(s.savedAt).toLocaleString()}
                  </span>
                  <button className="btn" onClick={() => deleteOutfit(s.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Details modal */}
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