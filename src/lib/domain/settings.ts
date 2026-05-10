import { prisma } from "@/lib/db";
import type { SettingsDto } from "@/lib/types/domain";

function toSettingsDto(settings: {
  companyName: string;
  emailAddress: string | null;
  phoneNumber: string | null;
  timezone: string;
  language: string;
  notificationEmailAlerts: boolean;
  notificationPushAlerts: boolean;
  notificationTaskReminders: boolean;
  securityTwoFactor: boolean;
  securitySessionTimeout: string;
  appearanceThemeMode: string;
  appearanceDensity: string;
  updatedAt: Date;
}): SettingsDto {
  return {
    company_name: settings.companyName,
    email_address: settings.emailAddress,
    phone_number: settings.phoneNumber,
    timezone: settings.timezone,
    language: settings.language,
    notifications: {
      email_alerts: settings.notificationEmailAlerts,
      push_alerts: settings.notificationPushAlerts,
      task_reminders: settings.notificationTaskReminders,
    },
    security: {
      two_factor: settings.securityTwoFactor,
      session_timeout: settings.securitySessionTimeout,
    },
    appearance: {
      theme_mode: settings.appearanceThemeMode,
      density: settings.appearanceDensity,
    },
    updated_at: settings.updatedAt.toISOString(),
  };
}

async function ensureSettingsRow(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });

  if (!business) {
    throw new Error("BUSINESS_NOT_FOUND");
  }

  const existing = await prisma.businessSettings.findUnique({
    where: { businessId },
  });

  if (existing) return existing;

  return prisma.businessSettings.create({
    data: {
      businessId,
      companyName: business.name,
    },
  });
}

export async function getSettings(businessId: string) {
  const settings = await ensureSettingsRow(businessId);
  return toSettingsDto(settings);
}

export async function patchSettings(input: {
  businessId: string;
  companyName?: string;
  emailAddress?: string | null;
  phoneNumber?: string | null;
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
}) {
  await ensureSettingsRow(input.businessId);

  const updated = await prisma.businessSettings.update({
    where: { businessId: input.businessId },
    data: {
      ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
      ...(input.emailAddress !== undefined ? { emailAddress: input.emailAddress } : {}),
      ...(input.phoneNumber !== undefined ? { phoneNumber: input.phoneNumber } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.notifications?.email_alerts !== undefined
        ? { notificationEmailAlerts: input.notifications.email_alerts }
        : {}),
      ...(input.notifications?.push_alerts !== undefined
        ? { notificationPushAlerts: input.notifications.push_alerts }
        : {}),
      ...(input.notifications?.task_reminders !== undefined
        ? { notificationTaskReminders: input.notifications.task_reminders }
        : {}),
      ...(input.security?.two_factor !== undefined
        ? { securityTwoFactor: input.security.two_factor }
        : {}),
      ...(input.security?.session_timeout !== undefined
        ? { securitySessionTimeout: input.security.session_timeout }
        : {}),
      ...(input.appearance?.theme_mode !== undefined
        ? { appearanceThemeMode: input.appearance.theme_mode }
        : {}),
      ...(input.appearance?.density !== undefined
        ? { appearanceDensity: input.appearance.density }
        : {}),
    },
  });

  return toSettingsDto(updated);
}
