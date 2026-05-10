import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { getSettings, patchSettings } from "@/lib/domain/settings";

export const runtime = "nodejs";

type PatchSettingsBody = {
  company_name?: string;
  email_address?: string | null;
  phone_number?: string | null;
  timezone?: string;
  language?: string;
  notifications?: {
    email_alerts?: boolean;
    push_alerts?: boolean;
    task_reminders?: boolean;
  };
  security?: {
    two_factor?: boolean;
    session_timeout?: string;
  };
  appearance?: {
    theme_mode?: string;
    density?: string;
  };
};

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const settings = await getSettings(auth.session.businessId);
    return ok({ settings });
  } catch (error) {
    console.error("Failed to get settings", error);
    return fail("SETTINGS_READ_FAILED", 500);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as PatchSettingsBody;
    const updated = await patchSettings({
      businessId: auth.session.businessId,
      ...(body.company_name !== undefined ? { companyName: body.company_name.trim() } : {}),
      ...(body.email_address !== undefined ? { emailAddress: body.email_address?.trim() || null } : {}),
      ...(body.phone_number !== undefined ? { phoneNumber: body.phone_number?.trim() || null } : {}),
      ...(body.timezone !== undefined ? { timezone: body.timezone.trim() } : {}),
      ...(body.language !== undefined ? { language: body.language.trim() } : {}),
      notifications: body.notifications,
      security: body.security,
      appearance: body.appearance,
    });

    return ok({ settings: updated });
  } catch (error) {
    console.error("Failed to patch settings", error);
    return fail("SETTINGS_PATCH_FAILED", 500);
  }
}
