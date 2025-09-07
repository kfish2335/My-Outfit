// app/components/Modal.tsx
"use client";
import React from "react";

export default function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-auto md:max-w-xl bg-[var(--card)] text-[var(--text)] rounded-t-2xl md:rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title || "Details"}</h3>
          <button className="px-3 py-1 rounded border border-[var(--border)] hover:bg-[var(--hover)]" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}