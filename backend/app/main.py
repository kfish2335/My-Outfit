# app/main.py
from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.schema import (
    SuggestRequest, SuggestResponse,
    FeedbackRequest, FeedbackResponse,
)
# ✅ Prompt builders live outside main
from app.prompts import build_prompt, build_feedback_prompt
from app.openai_client import chat_json

# --- simple domain guard: allow clothing/outfit/event-related ---
CLOTHING_WORDS = (
    "shirt,tee,t-shirt,polo,oxford,henley,sweater,hoodie,jacket,coat,blazer,overshirt,"
    "jeans,chinos,trousers,pants,joggers,shorts,"
    "sneakers,loafers,boots,derbies,oxfords,"
    "belt,watch,scarf,cap,bracelet,sunglasses,accessories,"
    "outerwear,layer,outfit,look,style,fashion,attire,event,occasion,wedding,office,date,party"
)
DOMAIN_RE = re.compile(r"|".join(map(re.escape, CLOTHING_WORDS.split(","))), re.I)

def is_domain_related(text: str) -> bool:
    return bool(DOMAIN_RE.search(text or ""))


def create_app() -> FastAPI:
    app = FastAPI(title="Outfit API (minimal)", version="1.0")

    # CORS
    origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in origins if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health():
        return {"ok": True, "model": os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")}

    @app.post("/suggest", response_model=SuggestResponse)
    async def suggest(req: SuggestRequest):
        # Domain guard
        blob = json.dumps(req.model_dump())
        if not is_domain_related(blob):
            raise HTTPException(status_code=400, detail={"error": "domain_reject", "message": "Please provide clothing/outfit-related inputs."})

        # Build prompt with external builder
        prompt = build_prompt(req)

        # Call LLM (sync helper assumed; if yours is async, `await chat_json(...)`)
        raw = chat_json(prompt)

        # Extract last JSON object in response
        m = re.search(r"\{[\s\S]*\}\s*$", (raw or "").strip(), re.MULTILINE)
        if not m:
            raise HTTPException(status_code=500, detail={"error":"parse_error","message":"Model did not return JSON"})
        try:
            data = json.loads(m.group(0))
        except Exception as e:
            raise HTTPException(status_code=500, detail={"error":"json_error","message":str(e)})

        outfits: List[Dict[str, Any]] = data.get("outfits") or []
        cleaned: List[Dict[str, Any]] = []
        for o in outfits:
            items = (o.get("items") or {})
            outfit = {
                "items": {
                    "top": items.get("top"),
                    "bottom": items.get("bottom"),
                    "shoes": items.get("shoes"),
                    "outerwear": items.get("outerwear"),
                    "layer": items.get("layer"),
                    "accessories": items.get("accessories") or [],
                },
                "why": o.get("why"),
                "notes": o.get("notes"),
                "fit_notes": o.get("fit_notes"),
                "palette": o.get("palette") or [],
            }

            # Optional: enrich with DALL·E icons if available
            try:
                from app.icons.dalle import generate_icon
                icons_img = {}
                for k in ("top","bottom","shoes","outerwear","layer"):
                    v = outfit["items"].get(k)
                    if isinstance(v, str) and v.strip():
                        icons_img[k] = generate_icon(v.strip())
                acc = outfit["items"].get("accessories") or []
                if acc and isinstance(acc, list) and isinstance(acc[0], str):
                    icons_img["accessories"] = [generate_icon(acc[0].strip())]
                if icons_img:
                    outfit["icons_img"] = icons_img
            except Exception:
                pass

            cleaned.append(outfit)

        if not cleaned:
            cleaned = [{
                "items": {"top":"white oxford","bottom":"navy chinos","shoes":"brown loafers","outerwear":None,"layer":"crewneck","accessories":["watch"]},
                "why": "Simple, versatile combo for most casual-smart occasions.",
                "fit_notes": "Tailored (not tight) fit flatters most builds.",
                "notes": None,
                "palette": ["#ffffff","#1f2a44","#6b4b2f","#d1d5db"],
            }]

        return {"outfits": cleaned}

    @app.post("/feedback", response_model=FeedbackResponse)
    async def feedback(req: FeedbackRequest):
        # Domain guard
        blob = json.dumps(req.model_dump())
        if not is_domain_related(blob):
            raise HTTPException(status_code=400, detail={"error": "domain_reject", "message": "Please provide clothing/outfit-related inputs."})

        prompt = build_feedback_prompt(req)
        raw = chat_json(prompt)

        m = re.search(r"\{[\s\S]*\}\s*$", (raw or "").strip(), re.MULTILINE)
        if not m:
            raise HTTPException(status_code=500, detail={"error":"parse_error","message":"Model did not return JSON"})
        try:
            data = json.loads(m.group(0))
        except Exception as e:
            raise HTTPException(status_code=500, detail={"error":"json_error","message":str(e)})

        outfits = data.get("outfits") or []
        if not isinstance(outfits, list):
            raise HTTPException(status_code=500, detail={"error":"schema_error","message":"outfits should be a list"})

        final: List[Dict[str, Any]] = []
        for o in outfits:
            items = (o.get("items") or {})
            outfit = {
                "items": {
                    "top": items.get("top"),
                    "bottom": items.get("bottom"),
                    "shoes": items.get("shoes"),
                    "outerwear": items.get("outerwear"),
                    "layer": items.get("layer"),
                    "accessories": items.get("accessories") or [],
                },
                "why": o.get("why"),
                "notes": o.get("notes"),
                "fit_notes": o.get("fit_notes"),
                "palette": o.get("palette") or [],
            }
            final.append(outfit)

        return {"outfits": final}

    return app

app = create_app()