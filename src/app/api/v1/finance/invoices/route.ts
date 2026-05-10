import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { createFinanceInvoice, listFinanceInvoices } from "@/lib/domain/finance";

export const runtime = "nodejs";

type CreateInvoiceBody = {
  lead_uid?: string | null;
  customer_name?: string | null;
  number?: string;
  currency?: string;
  issue_date?: string;
  due_date?: string;
  status?: "draft" | "sent" | "paid" | "overdue";
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string | null;
};

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const invoices = await listFinanceInvoices(auth.session.businessId);
    return ok({ invoices });
  } catch (error) {
    console.error("Failed to list finance invoices", error);
    return fail("FINANCE_INVOICES_LIST_FAILED", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as CreateInvoiceBody;
    if (!body.number?.trim()) return fail("INVOICE_NUMBER_REQUIRED", 400);
    if (!body.issue_date) return fail("ISSUE_DATE_REQUIRED", 400);
    if (!body.due_date) return fail("DUE_DATE_REQUIRED", 400);
    if (!Number.isFinite(body.total)) return fail("TOTAL_REQUIRED", 400);
    if (!Number.isFinite(body.subtotal)) return fail("SUBTOTAL_REQUIRED", 400);

    const invoice = await createFinanceInvoice({
      businessId: auth.session.businessId,
      leadUid: body.lead_uid ?? null,
      customerName: body.customer_name ?? null,
      number: body.number.trim(),
      currency: body.currency?.trim() || "USD",
      issueDate: new Date(body.issue_date),
      dueDate: new Date(body.due_date),
      status: body.status ?? "draft",
      subtotal: Number(body.subtotal),
      tax: Number(body.tax ?? 0),
      total: Number(body.total),
      notes: body.notes ?? null,
    });

    return ok({ invoice }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "LEAD_NOT_FOUND") return fail("LEAD_NOT_FOUND", 404);
      if (error.message === "INVALID_INVOICE_TOTAL") return fail("INVALID_INVOICE_TOTAL", 400);
    }
    console.error("Failed to create finance invoice", error);
    return fail("FINANCE_INVOICE_CREATE_FAILED", 500);
  }
}

