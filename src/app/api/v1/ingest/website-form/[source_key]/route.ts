import { fail, ok } from "@/lib/api/http";
import { ingestLead } from "@/lib/domain/ingestion";
import type { IngestionRequest } from "@/lib/types/domain";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ source_key: string }> },
) {
  const { source_key: sourceKey } = await params;
  if (!sourceKey) {
    return fail("SOURCE_KEY_REQUIRED", 400);
  }

  try {
    const body = (await request.json()) as IngestionRequest;
    const result = await ingestLead({
      family: "website_form",
      sourceKey,
      payload: body,
    });

    return ok({
      accepted: result.accepted,
      action: result.action,
      lead_uid: result.lead_uid,
      warnings: result.warnings,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SOURCE_NOT_FOUND_OR_INACTIVE") {
        return fail("SOURCE_NOT_FOUND", 404);
      }
      if (error.message === "FULL_NAME_REQUIRED") {
        return fail("FULL_NAME_REQUIRED", 400);
      }
    }

    console.error("Website-form ingestion failed", error);
    return fail("INGEST_FAILED", 500);
  }
}
