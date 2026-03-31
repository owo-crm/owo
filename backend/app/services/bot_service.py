from collections.abc import Sequence
from urllib.parse import urlparse

from aiogram import Bot
from aiogram.types import BotCommand, MenuButtonCommands, MenuButtonWebApp, WebAppInfo

from app.config import Settings
from app.schemas.admin import TelegramBotActionResponse, TelegramBotStatusResponse


class BotService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def is_configured(self) -> bool:
        return bool(self.settings.bot_token)

    def get_expected_webhook_url(self) -> str | None:
        if not self.settings.base_url:
            return None
        return f"{self.settings.base_url.rstrip('/')}/webhook/telegram"

    def is_base_url_public(self) -> bool:
        base_url = self.settings.base_url.strip()
        if not base_url:
            return False
        parsed = urlparse(base_url)
        hostname = (parsed.hostname or "").lower()
        if parsed.scheme != "https":
            return False
        return hostname not in {"localhost", "127.0.0.1", "0.0.0.0"}

    def _expected_commands(self) -> list[BotCommand]:
        return [
            BotCommand(command="start", description="Open the bot"),
            BotCommand(command="help", description="Show available commands"),
            BotCommand(command="inbox", description="See recent business events"),
            BotCommand(command="workspace", description="Show active workspace"),
            BotCommand(command="today", description="Show your tasks for today"),
            BotCommand(command="tasks", description="Show open workspace tasks"),
            BotCommand(command="leads", description="Show latest leads"),
        ]

    async def _get_bot(self) -> Bot:
        return Bot(token=self.settings.bot_token)

    async def get_runtime_status(self) -> TelegramBotStatusResponse:
        base_url = self.settings.base_url.strip() or None
        expected_webhook_url = self.get_expected_webhook_url()
        base_url_public = self.is_base_url_public()
        mini_app_url = self.settings.mini_app_url.strip() or None
        mini_app_configured = bool(mini_app_url)

        if not self.is_configured():
            return TelegramBotStatusResponse(
                configured=False,
                base_url=base_url,
                base_url_public=base_url_public,
                mini_app_url=mini_app_url,
                mini_app_configured=mini_app_configured,
                expected_webhook_url=expected_webhook_url,
                setup_ready=False,
                recommended_next_step="Add BOT_TOKEN first.",
            )

        bot = await self._get_bot()
        try:
            me = await bot.get_me()
            webhook_info = await bot.get_webhook_info()
            commands = await bot.get_my_commands()
            menu_button = await bot.get_chat_menu_button()
        finally:
            await bot.session.close()

        commands_match_expected = [
            (command.command, command.description) for command in commands
        ] == [
            (command.command, command.description) for command in self._expected_commands()
        ]
        menu_button_configured = isinstance(menu_button, (MenuButtonWebApp, MenuButtonCommands))
        menu_button_matches_expected = False
        if isinstance(menu_button, MenuButtonWebApp) and mini_app_url:
            menu_button_matches_expected = (
                (menu_button.text or "").strip() == "Open Barowo"
                and menu_button.web_app.url == mini_app_url
            )
        elif isinstance(menu_button, MenuButtonCommands) and not mini_app_url:
            menu_button_matches_expected = True

        webhook_url = webhook_info.url or None
        webhook_matches_expected = bool(expected_webhook_url and webhook_url == expected_webhook_url)
        webhook_has_secret = bool(getattr(webhook_info, "has_custom_certificate", False) or self.settings.bot_webhook_secret)
        setup_ready = bool(
            base_url_public
            and webhook_matches_expected
            and commands_match_expected
            and menu_button_matches_expected
        )

        recommended_next_step = None
        if not base_url_public:
            recommended_next_step = "Set BASE_URL to a public HTTPS URL before syncing the webhook."
        elif not webhook_matches_expected:
            recommended_next_step = "Sync the webhook."
        elif not commands_match_expected or not menu_button_matches_expected:
            recommended_next_step = "Sync bot commands."

        return TelegramBotStatusResponse(
            configured=True,
            base_url=base_url,
            base_url_public=base_url_public,
            mini_app_url=mini_app_url,
            mini_app_configured=mini_app_configured,
            bot_id=me.id,
            bot_username=me.username,
            bot_display_name=me.full_name,
            webhook_url=webhook_url,
            expected_webhook_url=expected_webhook_url,
            webhook_matches_expected=webhook_matches_expected,
            webhook_has_secret=bool(self.settings.bot_webhook_secret),
            pending_update_count=webhook_info.pending_update_count,
            last_error_message=webhook_info.last_error_message or None,
            commands_count=len(commands),
            commands_match_expected=commands_match_expected,
            menu_button_configured=menu_button_configured,
            menu_button_matches_expected=menu_button_matches_expected,
            setup_ready=setup_ready,
            recommended_next_step=recommended_next_step,
        )

    async def sync_webhook(self) -> TelegramBotActionResponse:
        if not self.is_configured():
            return TelegramBotActionResponse(
                ok=False,
                action="sync_webhook",
                message="BOT_TOKEN is missing.",
                status=await self.get_runtime_status(),
            )

        expected_webhook_url = self.get_expected_webhook_url()
        if not expected_webhook_url or not self.is_base_url_public():
            return TelegramBotActionResponse(
                ok=False,
                action="sync_webhook",
                message="BASE_URL must be a public HTTPS URL before syncing the webhook.",
                status=await self.get_runtime_status(),
            )

        bot = await self._get_bot()
        try:
            await bot.set_webhook(
                url=expected_webhook_url,
                secret_token=self.settings.bot_webhook_secret or None,
                allowed_updates=["message"],
                drop_pending_updates=False,
            )
        finally:
            await bot.session.close()

        return TelegramBotActionResponse(
            ok=True,
            action="sync_webhook",
            message="Webhook synced.",
            status=await self.get_runtime_status(),
        )

    async def clear_webhook(self) -> TelegramBotActionResponse:
        if not self.is_configured():
            return TelegramBotActionResponse(
                ok=False,
                action="clear_webhook",
                message="BOT_TOKEN is missing.",
                status=await self.get_runtime_status(),
            )

        bot = await self._get_bot()
        try:
            await bot.delete_webhook(drop_pending_updates=False)
        finally:
            await bot.session.close()

        return TelegramBotActionResponse(
            ok=True,
            action="clear_webhook",
            message="Webhook cleared.",
            status=await self.get_runtime_status(),
        )

    async def sync_commands(self) -> TelegramBotActionResponse:
        if not self.is_configured():
            return TelegramBotActionResponse(
                ok=False,
                action="sync_commands",
                message="BOT_TOKEN is missing.",
                status=await self.get_runtime_status(),
            )

        bot = await self._get_bot()
        try:
            await bot.set_my_commands(self._expected_commands())
            if self.settings.mini_app_url.strip():
                await bot.set_chat_menu_button(
                    menu_button=MenuButtonWebApp(
                        text="Open Barowo",
                        web_app=WebAppInfo(url=self.settings.mini_app_url.strip()),
                    )
                )
            else:
                await bot.set_chat_menu_button(menu_button=MenuButtonCommands())
        finally:
            await bot.session.close()

        return TelegramBotActionResponse(
            ok=True,
            action="sync_commands",
            message="Bot commands synced.",
            status=await self.get_runtime_status(),
        )

    async def sync_setup(self) -> TelegramBotActionResponse:
        if not self.is_configured():
            return TelegramBotActionResponse(
                ok=False,
                action="sync_setup",
                message="BOT_TOKEN is missing.",
                status=await self.get_runtime_status(),
            )

        webhook_result = await self.sync_webhook()
        commands_result = await self.sync_commands()
        ok = webhook_result.ok and commands_result.ok
        message = (
            "Telegram setup synced."
            if ok
            else f"{webhook_result.message} {commands_result.message}".strip()
        )
        return TelegramBotActionResponse(
            ok=ok,
            action="sync_setup",
            message=message,
            status=await self.get_runtime_status(),
        )

    async def deliver_event(
        self,
        *,
        event_type: str,
        payload: dict,
        recipient_telegram_ids: Sequence[int] | None = None,
    ) -> bool:
        if not self.is_configured() or not recipient_telegram_ids:
            return False

        message = self._format_event_message(event_type=event_type, payload=payload)
        sent_any = False
        bot = await self._get_bot()
        try:
            for telegram_id in dict.fromkeys(recipient_telegram_ids):
                try:
                    await bot.send_message(chat_id=telegram_id, text=message)
                    sent_any = True
                except Exception:
                    continue
        finally:
            await bot.session.close()
        return sent_any

    async def send_plain_text(self, *, telegram_id: int, text: str) -> bool:
        if not self.is_configured():
            return False
        bot = await self._get_bot()
        try:
            await bot.send_message(chat_id=telegram_id, text=text)
            return True
        except Exception:
            return False
        finally:
            await bot.session.close()

    def _format_event_message(self, *, event_type: str, payload: dict) -> str:
        lead = payload.get("lead") if isinstance(payload.get("lead"), dict) else {}
        task = payload.get("task") if isinstance(payload.get("task"), dict) else {}
        template = payload.get("template") if isinstance(payload.get("template"), dict) else {}
        expense = payload.get("expense") if isinstance(payload.get("expense"), dict) else {}
        income = payload.get("income") if isinstance(payload.get("income"), dict) else {}
        lead_name = lead.get("name") or "Unnamed"
        lead_uid = lead.get("uid") or "no uid"
        task_title = task.get("title") or "Untitled task"
        deadline = task.get("deadline")
        deadline_line = f"\nDeadline: {deadline}" if deadline else ""

        if event_type == "lead_created":
            return f"New lead\n{lead_name} ({lead_uid})"
        if event_type == "lead_assigned":
            return f"Lead assigned\n{lead_name} ({lead_uid})"
        if event_type == "lead_status_changed":
            return f"Lead status changed\n{lead_name} ({lead_uid})\nNew stage: {lead.get('status') or 'unknown'}"
        if event_type == "task_created":
            return f"New task\n{task_title}{deadline_line}"
        if event_type == "task_done":
            return f"Task completed\n{task_title}"
        if event_type == "task_overdue_detected":
            return f"Task overdue\n{task_title}{deadline_line}"
        if event_type == "inventory_missing_detected":
            missing_units = payload.get("missing_units")
            return f"Missing inventory\nLead {payload.get('lead_uid') or lead_uid}\nMissing: {missing_units or 'unknown'}"
        if event_type == "inventory_low_stock_detected":
            item = payload.get("item") if isinstance(payload.get("item"), dict) else {}
            return f"Low stock\n{item.get('name') or 'Inventory item'}\nAvailable: {item.get('available_quantity') or '0'} {item.get('unit') or ''}".strip()
        if event_type == "inventory_template_applied":
            return f"Inventory template applied\n{template.get('name') or 'Template'}"
        if event_type == "expense_created":
            return f"Expense recorded\n{expense.get('title') or 'Expense'}\nAmount: {expense.get('amount') or '0'}"
        if event_type == "income_created":
            return f"Income recorded\n{income.get('title') or 'Income'}\nAmount: {income.get('amount') or '0'}"
        if event_type == "recurring_plan_due":
            return f"Recurring expense due\n{expense.get('title') or 'Recurring plan'}"
        if event_type == "recurring_plan_paused":
            return f"Recurring plan paused\n{expense.get('title') or 'Recurring plan'}"
        if event_type == "recurring_plan_resumed":
            return f"Recurring plan resumed\n{expense.get('title') or 'Recurring plan'}"
        if event_type == "recurring_plan_archived":
            return f"Recurring plan archived\n{expense.get('title') or 'Recurring plan'}"
        if event_type == "sheet_sync_completed":
            return "Google Sheet sync completed"
        return f"Business event\n{event_type.replace('_', ' ')}"
