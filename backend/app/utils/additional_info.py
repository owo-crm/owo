MANUAL_ADDITIONAL_INFO_PREFIX = "manual:"
RAW_BUFFER_FIELD_PREFIXES = ("unnamed_column_",)
RAW_BUFFER_FIELD_NAMES = {
    "id",
    "created_time",
    "ad_id",
    "ad_name",
    "adset_id",
    "adset_name",
    "campaign_id",
    "campaign_name",
    "form_id",
    "form_name",
    "is_organic",
    "platform",
    "inbox_url",
    "lead_status",
}


def mapped_additional_info_labels(mapping: dict[str, str] | None) -> set[str]:
    if not mapping:
        return set()
    return {
        str(key).removeprefix("additional_info:").strip()
        for key in mapping.keys()
        if str(key).startswith("additional_info:") and str(key).removeprefix("additional_info:").strip()
    }


def clean_additional_info_fields(
    custom_fields: dict[str, object] | None,
    *,
    allowed_labels: set[str] | None = None,
) -> dict[str, str]:
    cleaned_fields: dict[str, str] = {}

    for key, value in (custom_fields or {}).items():
        cleaned_key = str(key).strip()
        cleaned_value = _string_or_none(value)
        if not cleaned_key or cleaned_value is None:
            continue

        if cleaned_key in RAW_BUFFER_FIELD_NAMES:
            continue
        if cleaned_key.startswith(RAW_BUFFER_FIELD_PREFIXES):
            continue

        if cleaned_key.startswith(MANUAL_ADDITIONAL_INFO_PREFIX):
            manual_label = cleaned_key.removeprefix(MANUAL_ADDITIONAL_INFO_PREFIX).strip()
            if manual_label:
                cleaned_fields[f"{MANUAL_ADDITIONAL_INFO_PREFIX}{manual_label}"] = cleaned_value
            continue

        if allowed_labels is not None and cleaned_key not in allowed_labels:
            continue

        cleaned_fields[cleaned_key] = cleaned_value

    return cleaned_fields


def _string_or_none(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
