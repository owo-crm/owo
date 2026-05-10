import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { patchFinanceInvoice } from "@/lib/domain/finance";

export const runtime = "nodejs";

type PatchInvoiceBody = {
  status?: "draft" | "sent" | "paid" | "overdue";
  customer_name?: string | null;
  due_date?: string;
  notes?: string | null;
  lead_uid?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  if (!id) return fail("INVOICE_ID_REQUIRED", 400);

  try {
    const body = (await request.json()) as PatchInvoiceBody;
    const invoice = await patchFinanceInvoice({
      id,
      businessId: auth.session.businessId,
      status: body.status,
      customerName: body.customer_name,
      dueDate: body.due_date ? new Date(body.due_date) : undefined,
      notes: body.notes,
      leadUid: body.lead_uid,
    });
    return ok({ invoice });
  } catch (error) {
    if (error instanceof Error && error.message === "INVOICE_NOT_FOUND") {
      return fail("INVOICE_NOT_FOUND", 404);
    }
    if (error instanceof Error && error.message === "LEAD_NOT_FOUND") {
      return fail("LEAD_NOT_FOUND", 404);
    }
    console.error("Failed to patch finance invoice", error);
    return fail("FINANCE_INVOICE_PATCH_FAILED", 500);
  }
}
