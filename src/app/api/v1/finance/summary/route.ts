import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { getFinanceSummary } from "@/lib/domain/finance";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") === "weekly" ? "weekly" : "monthly";
    const summary = await getFinanceSummary(auth.session.businessId, period);
    return ok({ period, ...summary });
  } catch (error) {
    console.error("Failed to get finance summary", error);
    return fail("FINANCE_SUMMARY_FAILED", 500);
  }
}

