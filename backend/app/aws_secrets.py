# app/aws_secrets.py
from __future__ import annotations
import json
import os
from functools import lru_cache

import boto3
from botocore.config import Config


class SecretsError(RuntimeError):
    pass


def _region() -> str:
    # priority: explicit env → AWS_REGION → default
    return os.getenv("AWS_SECRETS_REGION") or os.getenv("AWS_REGION") or "us-east-1"


@lru_cache(maxsize=8)
def get_secret_map(secret_name: str) -> dict:
    """
    Fetch a JSON secret from AWS Secrets Manager and return as dict.
    Results are cached in-process to avoid repeated calls.
    """
    try:
        client = boto3.client("secretsmanager", config=Config(region_name=_region()))
        resp = client.get_secret_value(SecretId=secret_name)
        raw = resp.get("SecretString")
        if not raw:
            raise SecretsError(f"Secret {secret_name} has no SecretString")
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise SecretsError(f"Secret {secret_name} is not a JSON object")
        return data
    except Exception as e:
        raise SecretsError(f"Failed to read secret {secret_name}: {e}") from e


def getenv_or_secret(key: str, default: str | None = None) -> str | None:
    """
    Return value from environment if present; otherwise (optionally) read from
    the JSON secret specified by AWS_OPENAI_SECRET (or OPENAI_SECRET_NAME).
    """
    val = os.getenv(key)
    if val:
        return val

    secret_name = (
        os.getenv("AWS_OPENAI_SECRET")
        or os.getenv("OPENAI_SECRET_NAME")
        or os.getenv("OPENAI_SECRETS_NAME")
        or os.getenv("OPENAI_SECRET")  # tolerate variations
        or os.getenv("OPENAI_API_KEY")  # (if someone set the key directly)
    )
    if not secret_name:
        return default

    try:
        secret_map = get_secret_map(secret_name)
        return secret_map.get(key, default)
    except SecretsError:
        return default