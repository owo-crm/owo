import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { getLeadOutcomesSeries } from "@/lib/domain/leads";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") === "weekly" ? "weekly" : "monthly";
    const series = await getLeadOutcomesSeries({
      businessId: auth.session.businessId,
      period,
    });

    return ok({ period, series });
  } catch (error) {
    console.error("Failed to get lead outcomes series", error);
    return fail("LEAD_OUTCOMES_FAILED", 500);
  }
}

