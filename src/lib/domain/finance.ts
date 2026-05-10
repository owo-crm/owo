import type { FinanceInvoiceStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import type {
  FinanceKpiSnapshot,
  Invoice,
  InvoiceStatus,
  Payment,
  PnlSeriesPoint,
} from "@/lib/types/domain";

function toNumber(value: { toString(): string } | number) {
  return typeof value === "number" ? value : Number(value.toString());
}

function toInvoiceStatus(status: FinanceInvoiceStatus): InvoiceStatus {
  return status;
}

function startOfPeriod(period: "weekly" | "monthly") {
  const now = new Date();
  if (period === "weekly") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function isOverdue(status: InvoiceStatus, dueDate: Date) {
  return status !== "paid" && dueDate.getTime() < Date.now();
}

function normalizeInvoiceStatus(status: InvoiceStatus, dueDate: Date, balance: number): InvoiceStatus {
  if (balance <= 0) return "paid";
  if (isOverdue(status, dueDate)) return "overdue";
  if (status === "paid" || status === "overdue") {
    return dueDate.getTime() < Date.now() ? "overdue" : "sent";
  }
  return status;
}

export async function listFinanceInvoices(businessId: string) {
  const invoices = await prisma.financeInvoice.findMany({
    where: { businessId },
    include: {
      lead: {
        select: { uid: true, fullName: true },
      },
      payments: {
        select: {
          amount: true,
        },
      },
    },
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
  });

  return invoices.map<Invoice>((invoice) => {
    const paidAmount = invoice.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    const total = toNumber(invoice.total);
    const subtotal = toNumber(invoice.subtotal);
    const tax = toNumber(invoice.tax);
    const balance = Number((total - paidAmount).toFixed(2));
    const status = normalizeInvoiceStatus(toInvoiceStatus(invoice.status), invoice.dueDate, balance);

    return {
      id: invoice.id,
      business_id: invoice.businessId,
      lead_uid: invoice.lead?.uid ?? null,
      lead_name: invoice.lead?.fullName ?? null,
      customer_name: invoice.customerName,
      number: invoice.number,
      currency: invoice.currency,
      issue_date: invoice.issueDate.toISOString(),
      due_date: invoice.dueDate.toISOString(),
      status,
      subtotal,
      tax,
      total,
      paid_amount: paidAmount,
      balance,
      is_overdue: status === "overdue",
      notes: invoice.notes,
      created_at: invoice.createdAt.toISOString(),
      updated_at: invoice.updatedAt.toISOString(),
    };
  });
}

export async function listFinancePayments(businessId: string, limit = 50) {
  const payments = await prisma.financePayment.findMany({
    where: { businessId },
    include: {
      invoice: {
        select: {
          number: true,
        },
      },
    },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return payments.map<Payment>((payment) => ({
    id: payment.id,
    business_id: payment.businessId,
    invoice_id: payment.invoiceId,
    invoice_number: payment.invoice.number,
    amount: toNumber(payment.amount),
    currency: payment.currency,
    paid_at: payment.paidAt.toISOString(),
    method: payment.method,
    reference: payment.reference,
    notes: payment.notes,
    created_at: payment.createdAt.toISOString(),
    updated_at: payment.updatedAt.toISOString(),
  }));
}

export async function createFinanceInvoice(input: {
  businessId: string;
  leadUid?: string | null;
  customerName?: string | null;
  number: string;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  status?: InvoiceStatus;
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string | null;
}) {
  if (input.total <= 0 || input.subtotal < 0) {
    throw new Error("INVALID_INVOICE_TOTAL");
  }

  let leadId: string | null = null;
  if (input.leadUid?.trim()) {
    const lead = await prisma.lead.findFirst({
      where: { businessId: input.businessId, uid: input.leadUid.trim(), archivedAt: null },
      select: { id: true },
    });
    if (!lead) throw new Error("LEAD_NOT_FOUND");
    leadId = lead.id;
  }

  const created = await prisma.financeInvoice.create({
    data: {
      businessId: input.businessId,
      leadId,
      customerName: input.customerName ?? null,
      number: input.number,
      currency: input.currency.toUpperCase(),
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      status: input.status ?? "draft",
      subtotal: input.subtotal,
      tax: input.tax ?? 0,
      total: input.total,
      notes: input.notes ?? null,
    },
  });

  const [invoice] = await listFinanceInvoices(input.businessId).then((items) =>
    items.filter((item) => item.id === created.id),
  );
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  return invoice;
}

export async function patchFinanceInvoice(input: {
  id: string;
  businessId: string;
  status?: InvoiceStatus;
  customerName?: string | null;
  dueDate?: Date;
  notes?: string | null;
  leadUid?: string | null;
}) {
  const existing = await prisma.financeInvoice.findFirst({
    where: { id: input.id, businessId: input.businessId },
    include: {
      payments: { select: { amount: true } },
    },
  });

  if (!existing) throw new Error("INVOICE_NOT_FOUND");

  const paidAmount = existing.payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const balance = toNumber(existing.total) - paidAmount;
  const dueDate = input.dueDate ?? existing.dueDate;
  const nextStatus = normalizeInvoiceStatus(
    input.status ?? toInvoiceStatus(existing.status),
    dueDate,
    balance,
  );

  let leadId: string | null | undefined;
  if (input.leadUid !== undefined) {
    const leadUid = input.leadUid?.trim();
    if (!leadUid) {
      leadId = null;
    } else {
      const lead = await prisma.lead.findFirst({
        where: { businessId: input.businessId, uid: leadUid, archivedAt: null },
        select: { id: true },
      });
      if (!lead) throw new Error("LEAD_NOT_FOUND");
      leadId = lead.id;
    }
  }

  const updated = await prisma.financeInvoice.update({
    where: { id: existing.id },
    data: {
      ...(input.customerName !== undefined ? { customerName: input.customerName } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(leadId !== undefined ? { leadId } : {}),
      status: nextStatus,
    },
  });

  const [invoice] = await listFinanceInvoices(input.businessId).then((items) =>
    items.filter((item) => item.id === updated.id),
  );
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  return invoice;
}

export async function createFinancePayment(input: {
  businessId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paidAt: Date;
  method: string;
  reference?: string | null;
  notes?: string | null;
}) {
  if (input.amount <= 0) throw new Error("INVALID_PAYMENT_AMOUNT");

  const invoice = await prisma.financeInvoice.findFirst({
    where: { id: input.invoiceId, businessId: input.businessId },
    include: { payments: { select: { amount: true } } },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  if (invoice.currency !== input.currency.toUpperCase()) throw new Error("CURRENCY_MISMATCH");

  const payment = await prisma.financePayment.create({
    data: {
      businessId: input.businessId,
      invoiceId: input.invoiceId,
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      paidAt: input.paidAt,
      method: input.method,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
    },
    include: {
      invoice: { select: { number: true } },
    },
  });

  const refreshedInvoice = await prisma.financeInvoice.findUnique({
    where: { id: input.invoiceId },
    include: { payments: { select: { amount: true } } },
  });

  if (refreshedInvoice) {
    const paidAmount = refreshedInvoice.payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
    const balance = toNumber(refreshedInvoice.total) - paidAmount;
    const status = normalizeInvoiceStatus(
      toInvoiceStatus(refreshedInvoice.status),
      refreshedInvoice.dueDate,
      balance,
    );
    if (status !== refreshedInvoice.status) {
      await prisma.financeInvoice.update({
        where: { id: refreshedInvoice.id },
        data: { status },
      });
    }
  }

  return {
    id: payment.id,
    business_id: payment.businessId,
    invoice_id: payment.invoiceId,
    invoice_number: payment.invoice.number,
    amount: toNumber(payment.amount),
    currency: payment.currency,
    paid_at: payment.paidAt.toISOString(),
    method: payment.method,
    reference: payment.reference,
    notes: payment.notes,
    created_at: payment.createdAt.toISOString(),
    updated_at: payment.updatedAt.toISOString(),
  } satisfies Payment;
}

export async function getFinanceSummary(businessId: string, period: "weekly" | "monthly") {
  const start = startOfPeriod(period);

  const payments = await prisma.financePayment.findMany({
    where: { businessId, paidAt: { gte: start } },
    select: { amount: true, paidAt: true, invoice: { select: { leadId: true } } },
  });

  // Treat payment flows consistently:
  // - revenue = paid amounts linked to lead-origin invoices
  // - expenses = paid amounts linked to non-lead invoices
  const revenue = payments.reduce((sum, payment) => {
    const amount = toNumber(payment.amount);
    return payment.invoice.leadId ? sum + amount : sum;
  }, 0);

  const expenses = payments.reduce((sum, payment) => {
    const amount = toNumber(payment.amount);
    return payment.invoice.leadId ? sum : sum + amount;
  }, 0);

  const allInvoices = await listFinanceInvoices(businessId);
  const outstanding = allInvoices.reduce((sum, inv) => sum + Math.max(inv.balance, 0), 0);
  const kpis: FinanceKpiSnapshot = {
    revenue: Number(revenue.toFixed(2)),
    expenses: Number(expenses.toFixed(2)),
    net: Number((revenue - expenses).toFixed(2)),
    outstanding: Number(outstanding.toFixed(2)),
  };

  const buckets = new Map<string, { revenue: number; expenses: number }>();
  const fmt = (date: Date) =>
    period === "weekly"
      ? `W${Math.ceil(date.getDate() / 7)}`
      : date.toLocaleDateString("en-US", { month: "short" });

  for (const payment of payments) {
    const key = fmt(payment.paidAt);
    const bucket = buckets.get(key) ?? { revenue: 0, expenses: 0 };
    const amount = toNumber(payment.amount);
    if (payment.invoice.leadId) {
      bucket.revenue += amount;
    } else {
      bucket.expenses += amount;
    }
    buckets.set(key, bucket);
  }

  const series = Array.from(buckets.entries()).map<PnlSeriesPoint>(([periodKey, values]) => ({
    period: periodKey,
    revenue: Number(values.revenue.toFixed(2)),
    expenses: Number(values.expenses.toFixed(2)),
  }));

  return { kpis, series };
}
