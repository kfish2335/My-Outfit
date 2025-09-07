from __future__ import annotations
import os
from openai import OpenAI
from dotenv import load_dotenv


load_dotenv()

CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

def _client() -> OpenAI:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is missing")
    return OpenAI(api_key=key)

def chat_json(prompt: str) -> str:
    client = _client()
    resp = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful menswear stylist. Always return valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )
    return resp.choices[0].message.content or "{}"