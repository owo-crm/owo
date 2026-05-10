import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { deleteLeadNote, patchLeadNote } from "@/lib/domain/leads";

export const runtime = "nodejs";

type PatchLeadNoteBody = {
  text?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string; note_id: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { uid, note_id: noteId } = await params;
  if (!uid || !noteId) return fail("INVALID_NOTE_REFERENCE", 400);

  try {
    const body = (await request.json()) as PatchLeadNoteBody;
    const text = body.text?.trim();
    if (!text) return fail("TEXT_REQUIRED", 400);

    const note = await patchLeadNote({
      uid,
      noteId,
      businessId: auth.session.businessId,
      actorUserId: auth.session.userId,
      text,
    });

    return ok({ note });
  } catch (error) {
    if (error instanceof Error && error.message === "LEAD_NOT_FOUND") {
      return fail("LEAD_NOT_FOUND", 404);
    }
    if (error instanceof Error && error.message === "LEAD_NOTE_NOT_FOUND") {
      return fail("LEAD_NOTE_NOT_FOUND", 404);
    }
    if (error instanceof Error && error.message === "LEAD_NOTES_NOT_READY") {
      return fail("LEAD_NOTES_NOT_READY", 503);
    }
    if (error instanceof Error && error.message === "INVALID_AUTHOR") {
      return fail("INVALID_AUTHOR", 400);
    }
    console.error("Failed to patch lead note", error);
    return fail("LEAD_NOTE_PATCH_FAILED", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uid: string; note_id: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { uid, note_id: noteId } = await params;
  if (!uid || !noteId) return fail("INVALID_NOTE_REFERENCE", 400);

  try {
    const deleted = await deleteLeadNote({
      uid,
      noteId,
      businessId: auth.session.businessId,
      actorUserId: auth.session.userId,
    });
    return ok({ deleted });
  } catch (error) {
    if (error instanceof Error && error.message === "LEAD_NOT_FOUND") {
      return fail("LEAD_NOT_FOUND", 404);
    }
    if (error instanceof Error && error.message === "LEAD_NOTE_NOT_FOUND") {
      return fail("LEAD_NOTE_NOT_FOUND", 404);
    }
    if (error instanceof Error && error.message === "LEAD_NOTES_NOT_READY") {
      return fail("LEAD_NOTES_NOT_READY", 503);
    }
    console.error("Failed to delete lead note", error);
    return fail("LEAD_NOTE_DELETE_FAILED", 500);
  }
}
