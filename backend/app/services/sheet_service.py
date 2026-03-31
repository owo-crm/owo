import json
import re
import unicodedata

import gspread
from gspread.exceptions import APIError, SpreadsheetNotFound, WorksheetNotFound

from app.config import Settings

FIELD_SYNONYMS: dict[str, tuple[str, ...]] = {
    "name": (
        "name",
        "full name",
        "full_name",
        "customer name",
        "imie",
        "imie nazwisko",
        "full customer name",
    ),
    "phone": (
        "phone",
        "phone number",
        "phone_number",
        "telefon",
        "nr telefonu",
        "numer telefonu",
        "mobile",
    ),
    "email": ("email", "e-mail", "adres email", "adres e mail", "mail"),
    "city": ("city", "miasto", "location", "lokalizacja"),
    "event_date": ("event date", "event_date", "data wydarzenia", "date", "termin"),
    "event_type": (
        "event type",
        "event_type",
        "typ wydarzenia",
        "rodzaj wydarzenia",
        "event",
        "typ eventu",
    ),
    "notes": (
        "notes",
        "note",
        "message",
        "lead message",
        "lead_message",
        "wiadomosc",
        "uwagi",
        "komentarz",
    ),
}


class SheetService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def verify_sheet(
        self,
        sheet_id: str,
        sheet_tab_name: str | None = None,
    ) -> tuple[bool, str, str | None, list[str], str | None]:
        if not self.settings.google_service_account_email:
            return False, "GOOGLE_SERVICE_ACCOUNT_EMAIL is not configured yet.", None, [], None
        if not sheet_id:
            return False, "Sheet ID is required.", None, [], None

        try:
            spreadsheet = self._open_spreadsheet(sheet_id)
            available_tabs = self._get_tab_names(spreadsheet)
            worksheet = self._resolve_worksheet(spreadsheet, sheet_tab_name)
        except SpreadsheetNotFound:
            return False, "Sheet ID not found. Double-check the ID.", None, [], None
        except WorksheetNotFound:
            return False, "Sheet tab not found. Choose one of the available tabs.", None, [], None
        except APIError as exc:
            return False, self._api_error_message(exc), None, [], None
        except Exception:
            return False, "Unable to verify sheet access right now.", None, [], None

        return True, "Sheet verified successfully.", spreadsheet.title, available_tabs, worksheet.title

    async def get_sheet_tabs(
        self,
        sheet_id: str,
        selected_tab_name: str | None = None,
    ) -> tuple[str | None, list[str], str | None, str]:
        if not sheet_id:
            return None, [], None, "Sheet ID is required."

        try:
            spreadsheet = self._open_spreadsheet(sheet_id)
            available_tabs = self._get_tab_names(spreadsheet)
            worksheet = self._resolve_worksheet(spreadsheet, selected_tab_name)
        except SpreadsheetNotFound:
            return None, [], None, "Sheet ID not found. Double-check the ID."
        except WorksheetNotFound:
            return None, [], None, "Selected tab was not found in this sheet."
        except APIError as exc:
            return None, [], None, self._api_error_message(exc)
        except Exception:
            return None, [], None, "Unable to load available sheet tabs right now."

        return spreadsheet.title, available_tabs, worksheet.title, "Sheet tabs loaded successfully."

    async def suggest_mapping(
        self,
        sheet_id: str,
        sheet_tab_name: str | None = None,
    ) -> tuple[str | None, str | None, list[str], dict[str, str], str]:
        if not sheet_id:
            return None, None, [], {}, "Sheet ID is required."

        try:
            headers, sheet_title, selected_tab_name = self._get_headers_title_and_tab(sheet_id, sheet_tab_name)
        except SpreadsheetNotFound:
            return None, None, [], {}, "Sheet ID not found. Double-check the ID."
        except WorksheetNotFound:
            return None, None, [], {}, "Selected tab was not found in this sheet."
        except APIError as exc:
            return None, None, [], {}, self._api_error_message(exc)
        except Exception:
            return None, None, [], {}, "Unable to read sheet headers right now."

        return (
            sheet_title,
            selected_tab_name,
            headers,
            self._build_suggested_mapping(headers),
            "Headers loaded successfully.",
        )

    def suggest_mapping_from_headers(self, headers: list[str]) -> dict[str, str]:
        return self._build_suggested_mapping(headers)

    async def get_row_records(
        self,
        sheet_id: str,
        sheet_tab_name: str | None = None,
    ) -> tuple[str | None, str | None, list[dict[str, object]]]:
        spreadsheet = self._open_spreadsheet(sheet_id)
        worksheet = self._resolve_worksheet(spreadsheet, sheet_tab_name)
        values = worksheet.get_all_values()
        if not values:
            return spreadsheet.title, worksheet.title, []

        headers = self._prepare_headers(values)
        raw_rows = values[1:]
        filtered_rows = [
            self._row_to_record(headers, row)
            for row in raw_rows
            if any(str(value).strip() for value in row if value is not None)
        ]
        return spreadsheet.title, worksheet.title, filtered_rows

    def _get_headers(self, sheet_id: str, sheet_tab_name: str | None = None) -> list[str]:
        headers, _, _ = self._get_headers_title_and_tab(sheet_id, sheet_tab_name)
        return headers

    def _get_headers_title_and_tab(self, sheet_id: str, sheet_tab_name: str | None = None) -> tuple[list[str], str, str]:
        spreadsheet = self._open_spreadsheet(sheet_id)
        worksheet = self._resolve_worksheet(spreadsheet, sheet_tab_name)
        values = worksheet.get_all_values()
        headers = self._prepare_headers(values)
        return headers, spreadsheet.title, worksheet.title

    def _open_spreadsheet(self, sheet_id: str):
        credentials = self.settings.google_service_account_dict()
        client = gspread.service_account_from_dict(credentials)
        return client.open_by_key(sheet_id)

    def _resolve_worksheet(self, spreadsheet, sheet_tab_name: str | None):
        if sheet_tab_name:
            return spreadsheet.worksheet(sheet_tab_name)
        return spreadsheet.sheet1

    def _get_tab_names(self, spreadsheet) -> list[str]:
        return [worksheet.title for worksheet in spreadsheet.worksheets()]

    def _prepare_headers(self, values: list[list[str]]) -> list[str]:
        if not values:
            return []

        max_len = max(len(row) for row in values)
        first_row = list(values[0]) + [""] * (max_len - len(values[0]))
        return self._make_unique_headers(first_row)

    def _make_unique_headers(self, raw_headers: list[str]) -> list[str]:
        seen: dict[str, int] = {}
        unique_headers: list[str] = []

        for index, header in enumerate(raw_headers, start=1):
            base_header = str(header).strip() or f"unnamed_column_{index}"
            count = seen.get(base_header, 0) + 1
            seen[base_header] = count
            unique_headers.append(base_header if count == 1 else f"{base_header}_{count}")

        return unique_headers

    def _row_to_record(self, headers: list[str], row: list[object]) -> dict[str, object]:
        padded_row = list(row) + [""] * (len(headers) - len(row))
        return {header: padded_row[index] for index, header in enumerate(headers)}

    def _build_suggested_mapping(self, headers: list[str]) -> dict[str, str]:
        normalized_headers = {header: self._normalize(header) for header in headers}
        mapping: dict[str, str] = {}

        for target_field, synonyms in FIELD_SYNONYMS.items():
            synonym_set = {self._normalize(item) for item in synonyms}
            for original_header, normalized_header in normalized_headers.items():
                if normalized_header in synonym_set:
                    mapping[target_field] = original_header
                    break

        return mapping

    def _normalize(self, value: str) -> str:
        lowered = value.strip().lower().replace("_", " ")
        ascii_value = (
            unicodedata.normalize("NFKD", lowered)
            .encode("ascii", "ignore")
            .decode("ascii")
        )
        cleaned = re.sub(r"[^a-z0-9 ]+", "", ascii_value)
        return re.sub(r"\s+", " ", cleaned).strip()

    def _api_error_message(self, exc: APIError) -> str:
        payload = getattr(exc, "response", None)
        if payload is not None:
            try:
                data = payload.json()
                message = data.get("error", {}).get("message")
                if message and "permission" in message.lower():
                    return (
                        f"Please share the sheet with {self.settings.google_service_account_email} first."
                    )
            except json.JSONDecodeError:
                pass

        return "Unable to access the sheet. Check sharing permissions and tab contents."
