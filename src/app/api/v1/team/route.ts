import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { listTeamMembers } from "@/lib/domain/team";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const members = await listTeamMembers(auth.session.businessId);
    return ok({ members });
  } catch (error) {
    console.error("Failed to list team members", error);
    return fail("TEAM_LIST_FAILED", 500);
  }
}
