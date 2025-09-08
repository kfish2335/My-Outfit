# app/openai_client.py
from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any, Dict, Optional

try:
    # Optional for local dev; safe to import even if not installed in prod
    from dotenv import load_dotenv  # type: ignore
except Exception:  # pragma: no cover
    load_dotenv = None  # type: ignore

from openai import OpenAI

# ---- Configuration knobs (env names) -----------------------------------------

# Name (or full ARN) of the AWS Secrets Manager secret containing a JSON object:
#   {
#     "OPENAI_API_KEY": "sk-...",
#     "OPENAI_MODEL": "gpt-4o-mini"
#   }
# You can set any of these env vars to tell the client which secret to read:
_SECRET_NAME_ENV_KEYS = (
    "AWS_OPENAI_SECRET",     # preferred
    "OPENAI_SECRET_NAME",
    "OPENAI_SECRETS_NAME",
    "OPENAI_SECRET",
)

# Region to use for Secrets Manager (falls back to AWS_REGION or default)
_REGION_ENV_KEYS = ("AWS_SECRETS_REGION", "AWS_REGION")

# Default model if none is set anywhere
DEFAULT_MODEL = "gpt-4o-mini"


# ---- Secrets Manager helpers --------------------------------------------------

def _get_region(default: str = "us-east-1") -> str:
    for k in _REGION_ENV_KEYS:
        v = os.getenv(k)
        if v:
            return v
    return default


def _get_secret_name() -> Optional[str]:
    for k in _SECRET_NAME_ENV_KEYS:
        v = os.getenv(k)
        if v:
            return v
    return None


@lru_cache(maxsize=1)
def _read_secret_json(secret_name: str, region: str) -> Dict[str, Any]:
    """
    Read a JSON-formatted secret from AWS Secrets Manager and return it as dict.
    Results are cached for the process lifetime.
    """
    try:
        import boto3  # imported lazily so local dev without boto3 still works
        from botocore.config import Config  # type: ignore

        sm = boto3.client("secretsmanager", config=Config(region_name=region))
        resp = sm.get_secret_value(SecretId=secret_name)
        raw = resp.get("SecretString")
        if not raw:
            raise RuntimeError(f"Secret {secret_name} has no SecretString")
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise RuntimeError(f"Secret {secret_name} is not a JSON object")
        return data
    except Exception as e:
        raise RuntimeError(f"Failed to read secret {secret_name} in {region}: {e}") from e


def _try_from_aws() -> Dict[str, Optional[str]]:
    """
    Attempt to load OPENAI_API_KEY / OPENAI_MODEL from AWS Secrets Manager.
    Returns a dict with possibly-None values if not found.
    """
    secret_name = _get_secret_name()
    if not secret_name:
        return {"OPENAI_API_KEY": None, "OPENAI_MODEL": None}

    region = _get_region()
    try:
        blob = _read_secret_json(secret_name, region)
        return {
            "OPENAI_API_KEY": blob.get("OPENAI_API_KEY"),
            "OPENAI_MODEL": blob.get("OPENAI_MODEL"),
        }
    except Exception:
        # Silent fallback; caller will try env/.env next
        return {"OPENAI_API_KEY": None, "OPENAI_MODEL": None}


def _try_from_env() -> Dict[str, Optional[str]]:
    """
    Load from process env (and .env locally, if available).
    """
    if load_dotenv is not None:
        # Only affects local dev; in containers this is typically a no-op
        load_dotenv(override=False)

    return {
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        "OPENAI_MODEL": os.getenv("OPENAI_MODEL"),
    }


# ---- Public surface -----------------------------------------------------------

def get_openai_credentials() -> Dict[str, str]:
    """
    Resolve credentials with precedence:
      1) AWS Secrets Manager (if AWS_OPENAI_SECRET / OPENAI_SECRET_NAME is set)
      2) Process env / .env
    Raises if OPENAI_API_KEY is still missing after both attempts.
    """
    # 1) Try AWS Secrets Manager
    from_aws = _try_from_aws()

    # 2) Fallback to env/.env if needed
    from_env = _try_from_env()

    api_key = from_aws.get("OPENAI_API_KEY") or from_env.get("OPENAI_API_KEY")
    model = from_aws.get("OPENAI_MODEL") or from_env.get("OPENAI_MODEL") or DEFAULT_MODEL

    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is missing. "
            "Set it via AWS Secrets Manager (JSON keys OPENAI_API_KEY/OPENAI_MODEL) "
            "or export it in the environment."
        )

    return {"OPENAI_API_KEY": api_key, "OPENAI_MODEL": model}


def _client() -> OpenAI:
    creds = get_openai_credentials()
    return OpenAI(api_key=creds["OPENAI_API_KEY"])


def chat_json(system_prompt: str, user_prompt: str, **kwargs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Minimal helper that calls Chat Completions and returns:
      { "content": <string>, "raw": <full SDK response as dict> }
    Adjust to Responses API if you prefer; the credential loading stays the same.
    """
    client = _client()
    model = get_openai_credentials()["OPENAI_MODEL"]

    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        # If you want structured JSON, uncomment:
        # response_format={"type": "json_object"},
        **kwargs,
    )
    choice = resp.choices[0]
    content = choice.message.content or ""
    return {"content": content, "raw": resp.model_dump()}