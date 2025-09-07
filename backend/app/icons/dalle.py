from __future__ import annotations
import os
from typing import Optional
from openai import OpenAI

DALLE_ENABLED = os.getenv("DALLE_ENABLE", "false").lower() not in ("0","false","no")
IMAGE_MODEL = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1")
IMAGE_SIZE  = os.getenv("OPENAI_IMAGE_SIZE", "1024x1024")  # 1024x1024 | 1024x1536 | 1536x1024 | auto

def _client() -> OpenAI:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is missing")
    return OpenAI(api_key=key)

def generate_icon(item_name: str) -> Optional[str]:
    if not DALLE_ENABLED:
        return None
    try:
        prompt = (
            f"Minimal, clean icon of: {item_name}. "
            "Centered, solid WHITE background (no transparency). "
            "Dark outline, no text, no watermark."
        )
        r = _client().images.generate(model=IMAGE_MODEL, prompt=prompt, size=IMAGE_SIZE, n=1)
        data = (r.data or [])
        if not data or not data[0].b64_json:
            return None
        return f"data:image/png;base64,{data[0].b64_json}"
    except Exception as e:
        print(f"[dalle] icon generation failed for '{item_name}': {e}")
        return None
