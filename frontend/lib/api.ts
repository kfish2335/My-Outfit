// lib/api.ts
import { SuggestRequest, SuggestResponse, FeedbackPayload, Outfit } from "@/app/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const j = await res.json(); msg = JSON.stringify(j); } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function suggest(body: SuggestRequest): Promise<SuggestResponse> {
  return jsonFetch<SuggestResponse>("/suggest", { method: "POST", body: JSON.stringify(body) });
}

export async function feedback(
  original: SuggestRequest,
  previous_outfits: Outfit[],
  payload: FeedbackPayload,
  count = 1,
): Promise<SuggestResponse> {
  return jsonFetch<SuggestResponse>("/feedback", {
    method: "POST",
    body: JSON.stringify({
      original_request: original,
      previous_outfits,
      feedback: payload,
      output: { count, include_notes: true },
    }),
  });
}