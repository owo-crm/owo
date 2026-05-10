import type { MemberRole } from "@/generated/prisma/enums";
import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { addTeamMember } from "@/lib/domain/team";

export const runtime = "nodejs";

type AddTeamMemberBody = {
  display_name?: string;
  email?: string | null;
  telegram_id?: string | null;
  role?: MemberRole;
};

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as AddTeamMemberBody;
    const displayName = body.display_name?.trim();
    if (!displayName) {
      return fail("DISPLAY_NAME_REQUIRED", 400);
    }

    const member = await addTeamMember({
      businessId: auth.session.businessId,
      displayName,
      email: body.email?.trim() || null,
      telegramId: body.telegram_id?.trim() || null,
      role: body.role ?? "OPERATOR",
    });

    return ok({ member }, { status: 201 });
  } catch (error) {
    console.error("Failed to add team member", error);
    return fail("TEAM_MEMBER_CREATE_FAILED", 500);
  }
}
