"""Supabase client initialization for backend-only access."""

from __future__ import annotations

import base64
import json
from functools import lru_cache

from supabase import Client, create_client

from config import settings


class SupabaseConfigurationError(RuntimeError):
    """Raised when Supabase is not configured safely for backend use."""


def _decode_jwt_payload(token: str) -> dict[str, object]:
    try:
        _, payload, _ = token.split(".", maxsplit=2)
        padding = "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(f"{payload}{padding}".encode("utf-8"))
        return json.loads(decoded.decode("utf-8"))
    except (ValueError, json.JSONDecodeError):
        return {}


def _validate_server_side_key(service_role_key: str) -> None:
    if not service_role_key:
        raise SupabaseConfigurationError("SUPABASE_SERVICE_ROLE_KEY is not configured.")

    if service_role_key.startswith("sb_publishable_"):
        raise SupabaseConfigurationError(
            "SUPABASE_SERVICE_ROLE_KEY must be a server-side key, not a publishable key."
        )

    if service_role_key.count(".") == 2:
        payload = _decode_jwt_payload(service_role_key)
        role = payload.get("role")
        if role and role != "service_role":
            raise SupabaseConfigurationError(
                "SUPABASE_SERVICE_ROLE_KEY must be a service_role key, not an anon key."
            )


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Create and cache a Supabase client configured with the service role key."""
    if not settings.SUPABASE_URL:
        raise SupabaseConfigurationError("SUPABASE_URL is not configured.")

    _validate_server_side_key(settings.SUPABASE_SERVICE_ROLE_KEY)

    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    except Exception as exc:  # pragma: no cover - depends on environment/network state
        raise SupabaseConfigurationError("Failed to initialize the Supabase client.") from exc
