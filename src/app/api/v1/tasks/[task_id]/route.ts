import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { patchTask } from "@/lib/domain/tasks";
import { prisma } from "@/lib/db";
import { createBusinessEvent } from "@/lib/domain/events";

export const runtime = "nodejs";

type PatchTaskBody = {
  title?: string;
  note?: string | null;
  due_at?: string | null;
  assignee_id?: string | null;
  lead_uid?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ task_id: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { task_id: taskId } = await params;
  if (!taskId) return fail("INVALID_TASK_ID", 400);

  try {
    const body = (await request.json()) as PatchTaskBody;
    let leadId: string | null | undefined;
    if (body.lead_uid !== undefined) {
      const leadUid = body.lead_uid?.trim();
      if (!leadUid) {
        leadId = null;
      } else {
        const lead = await prisma.lead.findFirst({
          where: {
            uid: leadUid,
            businessId: auth.session.businessId,
            archivedAt: null,
          },
          select: { id: true },
        });
        if (!lead) return fail("LEAD_NOT_FOUND", 404);
        leadId = lead.id;
      }
    }

    const task = await patchTask(taskId, auth.session.businessId, auth.session.userId, {
      title: body.title?.trim(),
      note: body.note,
      dueAt: body.due_at === null ? null : body.due_at ? new Date(body.due_at) : undefined,
      assigneeId: body.assignee_id,
      leadId,
    });

    return ok({ task });
  } catch (error) {
    if (error instanceof Error && error.message === "TASK_NOT_FOUND") {
      return fail("TASK_NOT_FOUND", 404);
    }
    if (error instanceof Error && error.message === "LEAD_NOT_FOUND") {
      return fail("LEAD_NOT_FOUND", 404);
    }
    console.error("Failed to patch task", error);
    return fail("TASK_PATCH_FAILED", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ task_id: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { task_id: taskId } = await params;
  if (!taskId) return fail("INVALID_TASK_ID", 400);

  try {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, businessId: auth.session.businessId },
      select: { id: true, leadId: true },
    });

    if (!existing) {
      return fail("TASK_NOT_FOUND", 404);
    }

    await prisma.task.delete({ where: { id: existing.id } });
    await createBusinessEvent({
      businessId: auth.session.businessId,
      type: "task.deleted",
      actorUserId: auth.session.userId,
      leadId: existing.leadId,
      taskId: existing.id,
    });

    return ok({ task_id: existing.id });
  } catch (error) {
    console.error("Failed to delete task", error);
    return fail("TASK_DELETE_FAILED", 500);
  }
}
