import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { getLeadDetailByUid } from "@/lib/domain/leads";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { uid } = await params;
  if (!uid) return fail("INVALID_UID", 400);

  try {
    const detail = await getLeadDetailByUid({
      uid,
      businessId: auth.session.businessId,
    });

    return ok({ detail });
  } catch (error) {
    if (error instanceof Error && error.message === "LEAD_NOT_FOUND") {
      return fail("LEAD_NOT_FOUND", 404);
    }
    console.error("Failed to load lead detail", error);
    return fail("LEAD_DETAIL_READ_FAILED", 500);
  }
}

