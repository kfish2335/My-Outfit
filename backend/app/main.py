# app/main.py
from __future__ import annotations

import json
import logging,os
import re
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

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

SYS = (
    "You are a men's outfit assistant. "
    "Always return ONLY valid JSON matching the schema requested by the user prompt. "
    "Do not include extra prose outside JSON."
)
def create_app() -> FastAPI:
    app = FastAPI(title="Outfit API (minimal)", version="1.0")

    # CORS
    origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://main.d3ar6p25m3w6fv.amplifyapp.com,https://aioutfit.kurkfisher.me,https://www.aioutfit.kurkfisher.me"
    ).split(",")
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

    def _coerce_json(obj):
        """
        Accept dict (already-parsed), or a JSON string, or a string that contains JSON at the end.
        Return a dict or raise an HTTPException with useful details.
        """
        if isinstance(obj, dict):
            return obj

        if isinstance(obj, str):
            s = obj.strip()
            # First try straight JSON
            try:
                return json.loads(s)
            except Exception:
                pass
            # Try to extract the last {...} block if model prefixed anything
            m = re.search(r"\{[\s\S]*\}\s*$", s, re.MULTILINE)
            if m:
                try:
                    return json.loads(m.group(0))
                except Exception:
                    pass

        raise HTTPException(
            status_code=500,
            detail={"error": "bad_model_json", "raw": str(obj)[:400]},
        )

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        logging.basicConfig(level=logging.INFO)
        logging.info("[startup] FastAPI app starting")
        logging.info("PORT=%s", os.getenv("PORT"))
        logging.info("OPENAI_API_KEY=%s", "set" if os.getenv("OPENAI_API_KEY") else "missing")
        yield
        logging.info("[shutdown] FastAPI app shutting down")


    @app.post("/suggest")
    async def suggest(body: SuggestRequest):
        try:
            user_prompt = build_prompt(body)
            raw = chat_json(SYS, user_prompt)  # returns dict (ideally), but we’ll be defensive
            data = _coerce_json(raw)
            return data
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail={"error": "openai_error", "message": str(e)})

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
