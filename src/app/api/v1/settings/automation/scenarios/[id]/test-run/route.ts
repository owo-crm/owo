import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { testAutomationScenario } from "@/lib/domain/automation";

export const runtime = "nodejs";

type TestRunBody = {
  lead_uid?: string | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  if (!id) return fail("SCENARIO_ID_REQUIRED", 400);

  try {
    const body = (await request.json()) as TestRunBody;
    const result = await testAutomationScenario({
      businessId: auth.session.businessId,
      scenarioId: id,
      leadUid: body.lead_uid?.trim() || null,
    });
    return ok({ result });
  } catch (error) {
    if (error instanceof Error && error.message === "SCENARIO_NOT_FOUND") {
      return fail("SCENARIO_NOT_FOUND", 404);
    }
    console.error("Failed to run automation scenario test", error);
    return fail("AUTOMATION_TEST_RUN_FAILED", 500);
  }
}
