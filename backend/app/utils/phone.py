import re


def normalize_phone(value: object) -> str | None:
    if value is None:
        return None

    raw_text = str(value).strip()
    if not raw_text:
        return None

    digits_only = re.sub(r"\D+", "", raw_text)
    if not digits_only:
        return None

    if digits_only.startswith("00"):
        digits_only = digits_only[2:]

    return f"+{digits_only}"
