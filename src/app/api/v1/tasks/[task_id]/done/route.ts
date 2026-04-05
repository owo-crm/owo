import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { markTaskDone } from "@/lib/domain/tasks";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ task_id: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { task_id: taskId } = await params;
  if (!taskId) return fail("INVALID_TASK_ID", 400);

  try {
    const task = await markTaskDone(taskId, auth.session.businessId, auth.session.userId);
    return ok({ task });
  } catch (error) {
    if (error instanceof Error && error.message === "TASK_NOT_FOUND") {
      return fail("TASK_NOT_FOUND", 404);
    }
    console.error("Failed to mark task done", error);
    return fail("TASK_DONE_FAILED", 500);
  }
}
