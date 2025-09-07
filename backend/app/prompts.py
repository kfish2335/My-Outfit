# app/prompts.py
from __future__ import annotations

from typing import List
from app.models.schema import SuggestRequest, FeedbackRequest


# Shared JSON schema that we want the model to emit (only the keys we validate reliably)
_JSON_SCHEMA = """
Return ONLY a valid JSON object with this exact schema (no extra text):
{
  "outfits": [
    {
      "items": {
        "top": "string",
        "bottom": "string",
        "shoes": "string",
        "outerwear": "string|null",
        "layer": "string|null",
        "accessories": ["string"]
      },
      "why": "string",
      "fit_notes": "string",
      "notes": "string",
      "palette": ["#RRGGBB"]
    }
  ]
}
""".strip()


def _clamp_count(n: int | None, default: int = 4) -> int:
    try:
        v = int(n if n is not None else default)
    except Exception:
        v = default
    return max(1, min(v, 6))  # keep 1..6 to avoid extreme responses


def build_prompt(body: SuggestRequest) -> str:
    """Prompt for first-time outfit generation."""
    occ = body.occasion
    temp = float(body.weather.temp)
    rain = bool(getattr(body.weather, "rain", False))

    vibe = (getattr(body.style, "vibe", None) or "neat")
    fit = (getattr(body.style, "fit", None) or "regular")
    palette = (getattr(body.style, "palette", None) or "neutrals")

    centerpiece = getattr(body.special_items, "centerpiece", None) or ""
    must_include = getattr(body.special_items, "must_include", None) or ""

    avoid_list = getattr(body.constraints, "avoid", None) or []
    avoid_str = ", ".join(avoid_list) if avoid_list else "none"

    count = _clamp_count(getattr(body.output, "count", None), default=4)
    include_notes = bool(getattr(body.output, "include_notes", True))

    age = getattr(body, "age", None)
    age_str = f"{age}" if age is not None else "adult"

    body_type = getattr(body, "body_type", None) or "regular"
    season = getattr(body, "season", None) or "all"

    return f"""
You are a men's fashion assistant for beginners. Propose clear, wearable outfits that match the user's context and skill level.

Audience & context:
- Audience: male, age {age_str}, body type {body_type}.
- Occasion: {occ}.
- Season: {season} (use appropriate fabrics & footwear: linen/cotton/suede for warm; flannel/wool/leather for cool).
- Weather: {temp}°F, {"rain" if rain else "no rain"}.
- Style vibe: {vibe}. Fit preference: {fit}. Color palette guide: {palette}.
- Special items: centerpiece="{centerpiece}", must_include="{must_include}".
- Avoid: {avoid_str}.
- Number of outfits to return: {count}.
- Notes included: {include_notes}.

Hard rules:
- Outerwear: MUST be provided when (temp < 65°F) OR (rain == true) OR the context is dressy; else set "outerwear" to null.
- Layer: Provide a useful mid-layer when helpful; else set "layer" to null.
- Items should be brand-agnostic and easy to find.
- Keep each outfit coherent and beginner-friendly.

Explanations:
- "why": 1–2 sentences (occasion/season/palette logic, weather practicality).
- "fit_notes": specific advice for {body_type} builds (silhouette, rise, taper, jacket length, etc.).
- "notes": step-by-step how to wear (tuck/sleeve roll), pairing tips, footwear notes, weather tweak for {temp}°F and {"rain" if rain else "dry"}, 1 budget swap, and 1 dress-up/down tweak.

Formatting contract:
{_JSON_SCHEMA}

JSON only. Do not include any keys beyond the schema. No prose outside JSON.
""".strip()


def build_feedback_prompt(fb: FeedbackRequest) -> str:
    """Prompt for refinement based on user feedback and previous outfits."""
    req = fb.original_request

    # Original request context
    occ = req.occasion
    temp = float(req.weather.temp)
    rain = bool(getattr(req.weather, "rain", False))

    vibe = (getattr(req.style, "vibe", None) or "neat")
    fit = (getattr(req.style, "fit", None) or "regular")
    palette = (getattr(req.style, "palette", None) or "neutrals")

    centerpiece = getattr(req.special_items, "centerpiece", None) or ""
    must_include = getattr(req.special_items, "must_include", None) or ""

    avoid_list = getattr(req.constraints, "avoid", None) or []
    avoid_str = ", ".join(avoid_list) if avoid_list else "none"

    count = _clamp_count(getattr(fb.output, "count", None), default=4)
    include_notes = bool(getattr(fb.output, "include_notes", True))

    age = getattr(req, "age", None)
    age_str = f"{age}" if age is not None else "adult"

    body_type = getattr(req, "body_type", None) or "regular"
    season = getattr(req, "season", None) or "all"

    liked = ", ".join(getattr(fb.feedback, "liked", None) or []) or "none"
    disliked = ", ".join(getattr(fb.feedback, "disliked", None) or []) or "none"
    fit_issues = ", ".join(getattr(fb.feedback, "fit_issues", None) or []) or "none"
    notes = getattr(fb.feedback, "notes", None) or "none"

    # Summarize prior outfits compactly (for the model to adjust)
    prev_text: List[str] = []
    for i, o in enumerate(getattr(fb, "previous_outfits", []) or [], 1):
        prev_text.append(
            '#{idx}: top="{top}", bottom="{bottom}", shoes="{shoes}", '
            'outerwear="{outerwear}", layer="{layer}", accessories={acc}, why="{why}"'.format(
                idx=i,
                top=getattr(o.items, "top", None),
                bottom=getattr(o.items, "bottom", None),
                shoes=getattr(o.items, "shoes", None),
                outerwear=getattr(o.items, "outerwear", None),
                layer=getattr(o.items, "layer", None),
                acc=getattr(o.items, "accessories", []),
                why=(o.why or "").replace('"', "'"),
            )
        )
    prev_blob = "\n".join(prev_text) if prev_text else "none"

    return f"""
You are revising men's outfits for a beginner user using explicit feedback.

Original request:
- Occasion: {occ}
- Season: {season}
- Weather: {temp}°F, {"rain" if rain else "no rain"}
- Style: vibe {vibe}, fit {fit}, palette {palette}
- Special items: centerpiece="{centerpiece}", must_include="{must_include}"
- Avoid: {avoid_str}
- Age: {age_str}, Body type: {body_type}

Previous outfits:
{prev_blob}

Feedback summary:
- Liked: {liked}
- Disliked: {disliked}
- Fit issues: {fit_issues}
- Notes: {notes}

Refinement rules:
- Honor likes, avoid dislikes, and directly address fit issues.
- Keep all original constraints (occasion/season/weather/style/special items/age/body type).
- Outerwear: MUST be present when (temp < 65°F) OR (rain == true) OR dressy context; else set to null.
- Keep outfits coherent, brand-agnostic, and beginner-friendly.

Explanations:
- "why": explain the changes driven by the feedback (1–2 sentences).
- "fit_notes": how the recommendations suit {body_type} and address issues reported.
- "notes": how to wear (step-by-step), color pairing, footwear note, weather tweak for {temp}°F and {"rain" if rain else "dry"}, 1 budget swap, 1 dress-up/down.

Output count: {count}. Notes included: {include_notes}.

Formatting contract:
{_JSON_SCHEMA}

JSON only. Do not include any keys beyond the schema. No prose outside JSON.
""".strip()