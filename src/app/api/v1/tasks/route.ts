import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { createTask, listTasks } from "@/lib/domain/tasks";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type CreateTaskBody = {
  title?: string;
  note?: string;
  lead_uid?: string;
  assignee_id?: string;
  due_at?: string;
};

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const includeDone = url.searchParams.get("include_done") === "true";
    const assigneeId = url.searchParams.get("assignee_id");
    const leadUid = url.searchParams.get("lead_uid");
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "100", 10);

    const tasks = await listTasks({
      businessId: auth.session.businessId,
      includeDone,
      assigneeId: assigneeId || null,
      leadUid: leadUid || null,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 300) : 100,
    });

    return ok({ tasks });
  } catch (error) {
    console.error("Failed to list tasks", error);
    return fail("TASKS_LIST_FAILED", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as CreateTaskBody;
    const title = body.title?.trim();
    if (!title) {
      return fail("TITLE_REQUIRED", 400);
    }

    let leadId: string | null = null;
    if (body.lead_uid?.trim()) {
      const lead = await prisma.lead.findFirst({
        where: {
          uid: body.lead_uid.trim(),
          businessId: auth.session.businessId,
          archivedAt: null,
        },
        select: { id: true },
      });
      if (!lead) {
        return fail("LEAD_NOT_FOUND", 404);
      }
      leadId = lead.id;
    }

    const task = await createTask({
      businessId: auth.session.businessId,
      title,
      note: body.note?.trim() || null,
      leadId,
      assigneeId: body.assignee_id || null,
      createdById: auth.session.userId,
      dueAt: body.due_at ? new Date(body.due_at) : null,
    });

    return ok({ task }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task", error);
    return fail("TASK_CREATE_FAILED", 500);
  }
}
