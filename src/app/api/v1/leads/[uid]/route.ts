import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { archiveLead, getLeadByUid, patchLead } from "@/lib/domain/leads";

export const runtime = "nodejs";

type PatchLeadBody = {
  full_name?: string;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
  owner_id?: string | null;
  status_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { uid } = await params;
  if (!uid) return fail("INVALID_UID", 400);

  try {
    const lead = await getLeadByUid(uid, auth.session.businessId);
    return ok({ lead });
  } catch (error) {
    if (error instanceof Error && error.message === "LEAD_NOT_FOUND") {
      return fail("LEAD_NOT_FOUND", 404);
    }
    console.error("Failed to load lead", error);
    return fail("LEAD_READ_FAILED", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { uid } = await params;
  if (!uid) return fail("INVALID_UID", 400);

  try {
    const body = (await request.json()) as PatchLeadBody;
    const lead = await patchLead({
      uid,
      businessId: auth.session.businessId,
      actorUserId: auth.session.userId,
      fullName: body.full_name,
      phone: body.phone,
      email: body.email,
      note: body.note,
      ownerId: body.owner_id,
      statusId: body.status_id,
      metadata: body.metadata,
    });

    return ok({ lead });
  } catch (error) {
    if (error instanceof Error && error.message === "LEAD_NOT_FOUND") {
      return fail("LEAD_NOT_FOUND", 404);
    }
    console.error("Failed to patch lead", error);
    return fail("LEAD_PATCH_FAILED", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { uid } = await params;
  if (!uid) return fail("INVALID_UID", 400);

  try {
    await archiveLead(uid, auth.session.businessId, auth.session.userId);
    return ok({ uid });
  } catch (error) {
    if (error instanceof Error && error.message === "LEAD_NOT_FOUND") {
      return fail("LEAD_NOT_FOUND", 404);
    }
    console.error("Failed to archive lead", error);
    return fail("LEAD_DELETE_FAILED", 500);
  }
}
