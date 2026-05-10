"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, ReceiptText, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiFetch } from "@/lib/api/client-session";
import type { FinanceKpiSnapshot, Invoice, Payment, PnlSeriesPoint } from "@/lib/types/domain";
import { EntityDrawer } from "./EntityDrawer";
import { LeadSearchSelect } from "./LeadSearchSelect";

type FinanceSummaryResponse = {
  ok: boolean;
  kpis: FinanceKpiSnapshot;
  series: PnlSeriesPoint[];
};

type InvoicesResponse = {
  ok: boolean;
  invoices: Invoice[];
};

type PaymentsResponse = {
  ok: boolean;
  payments: Payment[];
};

const defaultKpis: FinanceKpiSnapshot = {
  revenue: 0,
  expenses: 0,
  net: 0,
  outstanding: 0,
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function statusBadge(status: Invoice["status"]) {
  if (status === "paid") return "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-200";
  if (status === "overdue") return "border border-red-200 bg-red-50 text-red-700 dark:border-red-400/25 dark:bg-red-500/15 dark:text-red-200";
  if (status === "sent") return "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/25 dark:bg-blue-500/15 dark:text-blue-200";
  return "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-400/25 dark:bg-slate-500/15 dark:text-slate-200";
}

function numberStringOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function FinancePage() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const [kpis, setKpis] = useState<FinanceKpiSnapshot>(defaultKpis);
  const [series, setSeries] = useState<PnlSeriesPoint[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const [invoiceDraft, setInvoiceDraft] = useState({
    number: "",
    customer_name: "",
    lead_uid: "",
    lead_label: "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    subtotal: "",
    tax: "",
    total: "",
    notes: "",
  });

  const [invoiceEditDraft, setInvoiceEditDraft] = useState({
    customer_name: "",
    lead_uid: "",
    lead_label: "",
    due_date: "",
    status: "draft" as Invoice["status"],
    notes: "",
  });

  const [paymentDraft, setPaymentDraft] = useState({
    invoice_id: "",
    amount: "",
    paid_at: new Date().toISOString().slice(0, 10),
    method: "bank_transfer",
    reference: "",
    notes: "",
  });

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null,
    [invoices, selectedInvoiceId],
  );

  useEffect(() => {
    if (!selectedInvoice) return;
    setInvoiceEditDraft({
      customer_name: selectedInvoice.customer_name ?? "",
      lead_uid: selectedInvoice.lead_uid ?? "",
      lead_label: selectedInvoice.lead_name ?? "",
      due_date: selectedInvoice.due_date.slice(0, 10),
      status: selectedInvoice.status,
      notes: selectedInvoice.notes ?? "",
    });
  }, [selectedInvoice]);

  const refresh = async (nextPeriod = period) => {
    setLoading(true);
    try {
      const [summaryRes, invoicesRes, paymentsRes] = await Promise.all([
        apiFetch(`/api/v1/finance/summary?period=${nextPeriod}`),
        apiFetch("/api/v1/finance/invoices"),
        apiFetch("/api/v1/finance/payments"),
      ]);
      const summaryJson = (await summaryRes.json()) as FinanceSummaryResponse;
      const invoicesJson = (await invoicesRes.json()) as InvoicesResponse;
      const paymentsJson = (await paymentsRes.json()) as PaymentsResponse;
      if (summaryJson.ok) {
        setKpis(summaryJson.kpis);
        setSeries(summaryJson.series);
      }
      if (invoicesJson.ok) setInvoices(invoicesJson.invoices);
      if (paymentsJson.ok) setPayments(paymentsJson.payments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const recentPayments = useMemo(() => payments.slice(0, 6), [payments]);

  const submitInvoice = async () => {
    const subtotal = numberStringOrNull(invoiceDraft.subtotal);
    const tax = numberStringOrNull(invoiceDraft.tax) ?? 0;
    const total = numberStringOrNull(invoiceDraft.total);
    if (!invoiceDraft.number.trim()) {
      setFormError("Invoice number is required.");
      return;
    }
    if (subtotal === null || subtotal <= 0) {
      setFormError("Subtotal must be greater than 0.");
      return;
    }
    if (tax < 0) {
      setFormError("Tax must be 0 or greater.");
      return;
    }
    if (total === null || total <= 0) {
      setFormError("Total must be greater than 0.");
      return;
    }

    setActionPending(true);
    setFormError(null);
    try {
      const response = await apiFetch("/api/v1/finance/invoices", {
        method: "POST",
        body: JSON.stringify({
          number: invoiceDraft.number,
          customer_name: invoiceDraft.customer_name || null,
          lead_uid: invoiceDraft.lead_uid || null,
          issue_date: invoiceDraft.issue_date,
          due_date: invoiceDraft.due_date,
          subtotal,
          tax,
          total,
          notes: invoiceDraft.notes || null,
          currency: "USD",
        }),
      });
      const json = (await response.json()) as { ok: true } | { ok: false; error: string };
      if (!response.ok || !json.ok) throw new Error("Failed to create invoice");
      setShowInvoiceModal(false);
      setInvoiceDraft({
        number: "",
        customer_name: "",
        lead_uid: "",
        lead_label: "",
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        subtotal: "",
        tax: "",
        total: "",
        notes: "",
      });
      await refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create invoice");
    } finally {
      setActionPending(false);
    }
  };

  const submitPayment = async () => {
    const amount = numberStringOrNull(paymentDraft.amount);
    if (!paymentDraft.invoice_id) {
      setFormError("Invoice is required.");
      return;
    }
    if (amount === null || amount <= 0) {
      setFormError("Amount must be greater than 0.");
      return;
    }

    setActionPending(true);
    setFormError(null);
    try {
      const response = await apiFetch("/api/v1/finance/payments", {
        method: "POST",
        body: JSON.stringify({
          invoice_id: paymentDraft.invoice_id,
          amount,
          paid_at: paymentDraft.paid_at,
          method: paymentDraft.method,
          reference: paymentDraft.reference || null,
          notes: paymentDraft.notes || null,
          currency: "USD",
        }),
      });
      const json = (await response.json()) as { ok: true } | { ok: false; error: string };
      if (!response.ok || !json.ok) throw new Error("Failed to add payment");

      setShowPaymentModal(false);
      setPaymentDraft({
        invoice_id: "",
        amount: "",
        paid_at: new Date().toISOString().slice(0, 10),
        method: "bank_transfer",
        reference: "",
        notes: "",
      });
      await refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to add payment");
    } finally {
      setActionPending(false);
    }
  };

  const saveInvoiceEdit = async () => {
    if (!selectedInvoiceId) return;
    if (!invoiceEditDraft.due_date) {
      setFormError("Due date is required.");
      return;
    }

    setActionPending(true);
    setFormError(null);
    try {
      const response = await apiFetch(`/api/v1/finance/invoices/${selectedInvoiceId}`, {
        method: "PATCH",
        body: JSON.stringify({
          customer_name: invoiceEditDraft.customer_name || null,
          lead_uid: invoiceEditDraft.lead_uid || null,
          due_date: invoiceEditDraft.due_date,
          status: invoiceEditDraft.status,
          notes: invoiceEditDraft.notes || null,
        }),
      });
      const json = (await response.json()) as { ok: true } | { ok: false; error: string };
      if (!response.ok || !json.ok) throw new Error("Failed to update invoice");
      await refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to update invoice");
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--app-text)]">Finance</h1>
          <p className="mt-1 text-[var(--app-muted)]">Invoices, payments and paid-flow P&L.</p>
        </div>
        <button
          onClick={() => setShowInvoiceModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white hover:bg-[#244ee2]"
        >
          <Plus size={18} />
          New invoice
        </button>
      </div>

      {formError ? <p className="text-sm text-red-500">{formError}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Revenue (paid)", value: kpis.revenue, icon: Wallet },
          { label: "Expenses (paid)", value: kpis.expenses, icon: ReceiptText },
          { label: "Net P&L", value: kpis.net, icon: Wallet },
          { label: "Outstanding", value: kpis.outstanding, icon: ReceiptText },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--app-muted)]">{item.label} ({period})</p>
                <div className="rounded-lg bg-[#2D5CFE]/10 p-2 text-[#2D5CFE]">
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--app-text)]">{currencyFormatter.format(item.value)}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--app-text)]">P&L (paid only)</h2>
          <div className="inline-flex rounded-lg border border-[var(--app-border)] bg-[var(--app-muted-surface)] p-1">
            <button onClick={() => setPeriod("weekly")} className={`rounded-md px-3 py-1.5 text-sm ${period === "weekly" ? "bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm" : "text-[var(--app-muted)]"}`}>Weekly</button>
            <button onClick={() => setPeriod("monthly")} className={`rounded-md px-3 py-1.5 text-sm ${period === "monthly" ? "bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm" : "text-[var(--app-muted)]"}`}>Monthly</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="period" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip formatter={(value) => currencyFormatter.format(Number(value ?? 0))} />
            <Bar dataKey="revenue" fill="#22c55e" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
          <div className="border-b border-[var(--app-border)] px-5 py-4">
            <h2 className="text-lg font-semibold text-[var(--app-text)]">Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-[var(--app-border)] bg-[var(--app-muted-surface)]">
                  {["Number", "Customer / Lead", "Issue / Due", "Total", "Paid", "Balance", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="cursor-pointer border-b border-[var(--app-border)] last:border-b-0 hover:bg-[var(--app-muted-surface)]"
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--app-text)]">{invoice.number}</td>
                    <td className="px-4 py-3 text-sm text-[var(--app-text)]">
                      <p>{invoice.customer_name || "No customer name"}</p>
                      <p className="text-xs text-[var(--app-muted)]">{invoice.lead_name ? `Lead: ${invoice.lead_name}` : "No lead link"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--app-muted)]">
                      <p>{new Date(invoice.issue_date).toLocaleDateString()}</p>
                      <p>{new Date(invoice.due_date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--app-text)]">{currencyFormatter.format(invoice.total)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--app-text)]">{currencyFormatter.format(invoice.paid_amount)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--app-text)]">{currencyFormatter.format(invoice.balance)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(invoice.status)}`}>{invoice.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[var(--app-text)]">Recent payments</h2>
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-muted-surface)] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--app-text)]">{currencyFormatter.format(payment.amount)}</p>
                  <span className="text-xs text-[var(--app-muted)]">{payment.method}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {payment.invoice_number} • {new Date(payment.paid_at).toLocaleDateString()}
                </p>
                {payment.reference ? <p className="mt-1 text-xs text-[var(--app-muted)]">Ref: {payment.reference}</p> : null}
              </div>
            ))}
            {!loading && recentPayments.length === 0 ? <p className="text-sm text-[var(--app-muted)]">No payments yet.</p> : null}
          </div>
        </div>
      </div>

      <EntityDrawer
        open={Boolean(selectedInvoiceId)}
        onClose={() => setSelectedInvoiceId(null)}
        title={selectedInvoice?.number ?? "Invoice details"}
        subtitle={selectedInvoice?.customer_name ?? selectedInvoice?.lead_name ?? "No customer name"}
        footer={
          <div className="flex justify-end gap-2">
            <button className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text)]" onClick={() => setSelectedInvoiceId(null)}>
              Close
            </button>
            <button className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text)] disabled:opacity-60" onClick={() => {
              if (!selectedInvoiceId) return;
              setPaymentDraft((prev) => ({ ...prev, invoice_id: selectedInvoiceId }));
              setShowPaymentModal(true);
            }} disabled={actionPending || !selectedInvoiceId}>
              Add payment
            </button>
            <button className="rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void saveInvoiceEdit()} disabled={actionPending || !selectedInvoiceId}>
              {actionPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        }
      >
        {!selectedInvoice ? (
          <div className="text-sm text-[var(--app-muted)]">Loading invoice...</div>
        ) : (
          <div className="space-y-3">
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Invoice number
              <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-muted-surface)] px-3 py-2 text-sm text-[var(--app-muted)]" value={selectedInvoice.number} readOnly />
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Customer name
              <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={invoiceEditDraft.customer_name} onChange={(event) => setInvoiceEditDraft((prev) => ({ ...prev, customer_name: event.target.value }))} />
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Linked lead
              <div className="mt-1">
                <LeadSearchSelect
                  value={invoiceEditDraft.lead_uid}
                  selectedLabel={invoiceEditDraft.lead_label}
                  onChange={(leadUid, leadLabel) =>
                    setInvoiceEditDraft((prev) => ({
                      ...prev,
                      lead_uid: leadUid,
                      lead_label: leadLabel ?? "",
                    }))
                  }
                />
              </div>
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Due date
              <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" type="date" value={invoiceEditDraft.due_date} onChange={(event) => setInvoiceEditDraft((prev) => ({ ...prev, due_date: event.target.value }))} />
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Status
              <select className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={invoiceEditDraft.status} onChange={(event) => setInvoiceEditDraft((prev) => ({ ...prev, status: event.target.value as Invoice["status"] }))}>
                <option value="draft">draft</option>
                <option value="sent">sent</option>
                <option value="paid">paid</option>
                <option value="overdue">overdue</option>
              </select>
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Notes
              <textarea className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={invoiceEditDraft.notes} onChange={(event) => setInvoiceEditDraft((prev) => ({ ...prev, notes: event.target.value }))} />
            </label>
          </div>
        )}
      </EntityDrawer>

      {showInvoiceModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowInvoiceModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="mb-4 text-xl font-semibold text-[var(--app-text)]">New invoice</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Invoice number*
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="INV-2026-001" value={invoiceDraft.number} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, number: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Customer name
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="Acme Corp" value={invoiceDraft.customer_name} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, customer_name: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Linked lead (optional)
                <div className="mt-1">
                  <LeadSearchSelect
                    value={invoiceDraft.lead_uid}
                    selectedLabel={invoiceDraft.lead_label}
                    onChange={(leadUid, leadLabel) =>
                      setInvoiceDraft((prev) => ({
                        ...prev,
                        lead_uid: leadUid,
                        lead_label: leadLabel ?? "",
                      }))
                    }
                  />
                </div>
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Issue date*
                <input type="date" className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={invoiceDraft.issue_date} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, issue_date: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Due date*
                <input type="date" className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={invoiceDraft.due_date} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, due_date: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Subtotal (USD)*
                <input type="number" step="0.01" className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="1000.00" value={invoiceDraft.subtotal} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, subtotal: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Tax (optional)
                <input type="number" step="0.01" className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="230.00" value={invoiceDraft.tax} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, tax: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Total (USD)*
                <input type="number" step="0.01" className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="1230.00" value={invoiceDraft.total} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, total: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)] md:col-span-2">
                Notes
                <textarea className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="Optional invoice note." value={invoiceDraft.notes} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, notes: event.target.value }))} />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text)]" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
              <button className="rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void submitInvoice()} disabled={actionPending}>{actionPending ? "Creating..." : "Create invoice"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {showPaymentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="mb-4 text-xl font-semibold text-[var(--app-text)]">Add payment</h3>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Invoice*
                <select className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={paymentDraft.invoice_id} onChange={(event) => setPaymentDraft((prev) => ({ ...prev, invoice_id: event.target.value }))}>
                  <option value="">Select invoice</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>{invoice.number} ({currencyFormatter.format(invoice.balance)} due)</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Amount (USD)*
                <input type="number" step="0.01" className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="500.00" value={paymentDraft.amount} onChange={(event) => setPaymentDraft((prev) => ({ ...prev, amount: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Paid at*
                <input type="date" className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={paymentDraft.paid_at} onChange={(event) => setPaymentDraft((prev) => ({ ...prev, paid_at: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Method
                <select className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={paymentDraft.method} onChange={(event) => setPaymentDraft((prev) => ({ ...prev, method: event.target.value }))}>
                  <option value="bank_transfer">bank_transfer</option>
                  <option value="card">card</option>
                  <option value="cash">cash</option>
                </select>
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Reference
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="TXN-..." value={paymentDraft.reference} onChange={(event) => setPaymentDraft((prev) => ({ ...prev, reference: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Notes
                <textarea className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="Optional payment note." value={paymentDraft.notes} onChange={(event) => setPaymentDraft((prev) => ({ ...prev, notes: event.target.value }))} />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text)]" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void submitPayment()} disabled={actionPending}>{actionPending ? "Saving..." : "Add payment"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
