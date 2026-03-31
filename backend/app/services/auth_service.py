import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qsl

from jose import jwt

from app.config import Settings


def create_access_token(user_id: str, telegram_id: int, settings: Settings) -> str:
    expires_at = datetime.now(UTC) + timedelta(hours=24)
    payload = {
        "user_id": user_id,
        "telegram_id": telegram_id,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def parse_init_data(init_data: str) -> dict[str, str]:
    return dict(parse_qsl(init_data, keep_blank_values=True))


def validate_telegram_init_data(init_data: str, settings: Settings) -> dict[str, object]:
    if settings.environment != "production" and init_data.startswith("debug:"):
        telegram_id = init_data.removeprefix("debug:").strip() or "1"
        return {
            "id": int(telegram_id),
            "username": f"debug_{telegram_id}",
            "first_name": "Debug",
            "last_name": "User",
            "language_code": "en",
        }

    parsed = parse_init_data(init_data)
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise ValueError("Missing Telegram hash")

    auth_date = parsed.get("auth_date")
    if not auth_date:
        raise ValueError("Missing Telegram auth_date")

    auth_dt = datetime.fromtimestamp(int(auth_date), tz=UTC)
    if datetime.now(UTC) - auth_dt > timedelta(hours=1):
        raise ValueError("Telegram initData is too old")

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(parsed.items()))
    secret_key = hashlib.sha256(settings.bot_token.encode("utf-8")).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calculated_hash, received_hash):
        raise ValueError("Invalid Telegram signature")

    user_raw = parsed.get("user")
    if not user_raw:
        raise ValueError("Missing Telegram user payload")

    return json.loads(user_raw)
