import { ok, fail } from "@/lib/api/http";
import { createAuthToken } from "@/lib/auth/token";
import { ensureUserWithMembership } from "@/lib/domain/business";
import type { AuthenticatedUser } from "@/lib/types/domain";

export const runtime = "nodejs";

type RequestBody = {
  telegram_init_data?: string;
  active_business_id?: string;
  debug?: {
    telegram_id?: string;
    display_name?: string;
    email?: string;
  };
};

function parseTelegramInitData(initData: string) {
  try {
    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");
    if (!userRaw) {
      return null;
    }

    const user = JSON.parse(userRaw) as {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };

    if (!user.id) {
      return null;
    }

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();

    return {
      telegramId: String(user.id),
      displayName: fullName || user.username || `telegram-${user.id}`,
      email: null,
    };
  } catch {
    return null;
  }
}

function canUseDevBypass(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const token = process.env.DEV_AUTH_BYPASS_TOKEN?.trim();
  if (!token) {
    return false;
  }

  return request.headers.get("x-dev-auth-token") === token;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    let identity: { telegramId: string; displayName: string; email: string | null } | null =
      null;

    if (body.telegram_init_data) {
      identity = parseTelegramInitData(body.telegram_init_data);
    }

    if (!identity && body.debug && canUseDevBypass(request)) {
      if (body.debug.telegram_id && body.debug.display_name) {
        identity = {
          telegramId: body.debug.telegram_id,
          displayName: body.debug.display_name,
          email: body.debug.email ?? null,
        };
      }
    }

    if (!identity) {
      return fail("UNAUTHENTICATED", 401, {
        hint: "Provide valid telegram_init_data or enabled debug bypass.",
      });
    }

    const resolved = await ensureUserWithMembership({
      telegramId: identity.telegramId,
      displayName: identity.displayName,
      email: identity.email,
    });

    const active =
      resolved.memberships.find((item) => item.businessId === body.active_business_id) ??
      resolved.memberships[0];

    if (!active) {
      return fail("NO_BUSINESS_CONTEXT", 409);
    }

    const token = createAuthToken({
      sub: resolved.user.id,
      business_id: active.businessId,
      role: active.role,
    });

    const user: AuthenticatedUser = {
      id: resolved.user.id,
      telegram_id: resolved.user.telegramId,
      email: resolved.user.email,
      display_name: resolved.user.displayName,
      is_platform_admin: resolved.user.isPlatformAdmin,
    };

    return ok({
      user,
      businesses: resolved.memberships.map((item) => ({
        business_id: item.businessId,
        business_name: item.businessName,
        role: item.role,
      })),
      active_business_id: active.businessId,
      token,
    });
  } catch (error) {
    console.error("Auth validate failed", error);
    return fail("AUTH_VALIDATE_FAILED", 500);
  }
}

