import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { createLeadNote, listLeadNotes } from "@/lib/domain/leads";

export const runtime = "nodejs";

type CreateLeadNoteBody = {
  text?: string;
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
    const notes = await listLeadNotes({
      uid,
      businessId: auth.session.businessId,
    });
    return ok({ notes });
  } catch (error) {
    if (error instanceof Error && error.message === "LEAD_NOT_FOUND") {
      return fail("LEAD_NOT_FOUND", 404);
    }
    if (error instanceof Error && error.message === "LEAD_NOTES_NOT_READY") {
      return fail("LEAD_NOTES_NOT_READY", 503);
    }
    console.error("Failed to load lead notes", error);
    return fail("LEAD_NOTES_READ_FAILED", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { uid } = await params;
  if (!uid) return fail("INVALID_UID", 400);

  try {
    const body = (await request.json()) as CreateLeadNoteBody;
    const text = body.text?.trim();
    if (!text) return fail("TEXT_REQUIRED", 400);

    const note = await createLeadNote({
      uid,
      businessId: auth.session.businessId,
      actorUserId: auth.session.userId,
      text,
    });

    return ok({ note }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "LEAD_NOT_FOUND") {
      return fail("LEAD_NOT_FOUND", 404);
    }
    if (error instanceof Error && error.message === "LEAD_NOTES_NOT_READY") {
      return fail("LEAD_NOTES_NOT_READY", 503);
    }
    if (error instanceof Error && error.message === "INVALID_AUTHOR") {
      return fail("INVALID_AUTHOR", 400);
    }
    console.error("Failed to create lead note", error);
    return fail("LEAD_NOTE_CREATE_FAILED", 500);
  }
}
