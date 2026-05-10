import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { listAutomationRuns } from "@/lib/domain/automation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const scenarioId = url.searchParams.get("scenario_id");
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "30", 10);

    const runs = await listAutomationRuns({
      businessId: auth.session.businessId,
      scenarioId: scenarioId || null,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 30,
    });

    return ok({ runs });
  } catch (error) {
    console.error("Failed to list automation runs", error);
    return fail("AUTOMATION_RUNS_READ_FAILED", 500);
  }
}
