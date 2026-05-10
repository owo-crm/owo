import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { createFinancePayment, listFinancePayments } from "@/lib/domain/finance";

export const runtime = "nodejs";

type CreatePaymentBody = {
  invoice_id?: string;
  amount?: number;
  currency?: string;
  paid_at?: string;
  method?: string;
  reference?: string | null;
  notes?: string | null;
};

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const payments = await listFinancePayments(auth.session.businessId, 100);
    return ok({ payments });
  } catch (error) {
    console.error("Failed to list finance payments", error);
    return fail("FINANCE_PAYMENTS_LIST_FAILED", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as CreatePaymentBody;
    if (!body.invoice_id) return fail("INVOICE_ID_REQUIRED", 400);
    if (!Number.isFinite(body.amount)) return fail("PAYMENT_AMOUNT_REQUIRED", 400);
    if (!body.paid_at) return fail("PAID_AT_REQUIRED", 400);
    if (!body.method?.trim()) return fail("PAYMENT_METHOD_REQUIRED", 400);

    const payment = await createFinancePayment({
      businessId: auth.session.businessId,
      invoiceId: body.invoice_id,
      amount: Number(body.amount),
      currency: body.currency?.trim() || "USD",
      paidAt: new Date(body.paid_at),
      method: body.method.trim(),
      reference: body.reference ?? null,
      notes: body.notes ?? null,
    });

    return ok({ payment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVOICE_NOT_FOUND") return fail("INVOICE_NOT_FOUND", 404);
      if (error.message === "INVALID_PAYMENT_AMOUNT") return fail("INVALID_PAYMENT_AMOUNT", 400);
      if (error.message === "CURRENCY_MISMATCH") return fail("CURRENCY_MISMATCH", 409);
    }
    console.error("Failed to create finance payment", error);
    return fail("FINANCE_PAYMENT_CREATE_FAILED", 500);
  }
}

