"use client";

import { Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client-session";
import type { StockItemDto } from "@/lib/types/domain";
import { EntityDrawer } from "./EntityDrawer";

type StockResponse = {
  ok: boolean;
  items: StockItemDto[];
};

type StockItemResponse = {
  ok: boolean;
  item: StockItemDto;
};

type StockDraft = {
  sku: string;
  name: string;
  category: string;
  qty: string;
  min_qty: string;
  price: string;
};

const emptyDraft: StockDraft = {
  sku: "",
  name: "",
  category: "",
  qty: "",
  min_qty: "",
  price: "",
};

function toNumberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function StockPage() {
  const [stock, setStock] = useState<StockItemDto[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<StockDraft>(emptyDraft);
  const [editDraft, setEditDraft] = useState<StockDraft>(emptyDraft);

  const selectedItem = useMemo(
    () => stock.find((item) => item.id === selectedItemId) ?? null,
    [stock, selectedItemId],
  );

  const filtered = useMemo(
    () =>
      stock.filter((item) => {
        const q = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }),
    [stock, search],
  );

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/v1/stock/items");
      const json = (await response.json()) as StockResponse | { ok: false; error: string };
      if (!response.ok || !json.ok) {
        throw new Error("Failed to load stock");
      }
      setStock(json.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load stock");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!selectedItem) return;
    setEditDraft({
      sku: selectedItem.sku,
      name: selectedItem.name,
      category: selectedItem.category,
      qty: String(selectedItem.qty),
      min_qty: String(selectedItem.min_qty),
      price: String(selectedItem.price),
    });
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItemId) return;
    if (!filtered.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(null);
    }
  }, [filtered, selectedItemId]);

  const addItem = async () => {
    const sku = draft.sku.trim();
    const name = draft.name.trim();
    const category = draft.category.trim();
    const qty = toNumberOrNull(draft.qty);
    const minQty = toNumberOrNull(draft.min_qty);
    const price = toNumberOrNull(draft.price);

    if (!sku || !name || !category) {
      setError("SKU, name and category are required.");
      return;
    }
    if (qty === null || qty < 0) {
      setError("Quantity must be 0 or greater.");
      return;
    }
    if (minQty === null || minQty < 0) {
      setError("Min threshold must be 0 or greater.");
      return;
    }
    if (price === null || price <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch("/api/v1/stock/items", {
        method: "POST",
        body: JSON.stringify({
          sku,
          name,
          category,
          qty,
          min_qty: minQty,
          price,
        }),
      });
      const json = (await response.json()) as StockItemResponse | { ok: false; error: string };
      if (!response.ok || !json.ok) {
        throw new Error("Failed to create stock item");
      }
      setShowAdd(false);
      setDraft(emptyDraft);
      await refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create stock item");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!selectedItemId) return;
    const sku = editDraft.sku.trim();
    const name = editDraft.name.trim();
    const category = editDraft.category.trim();
    const qty = toNumberOrNull(editDraft.qty);
    const minQty = toNumberOrNull(editDraft.min_qty);
    const price = toNumberOrNull(editDraft.price);

    if (!sku || !name || !category) {
      setError("SKU, name and category are required.");
      return;
    }
    if (qty === null || qty < 0) {
      setError("Quantity must be 0 or greater.");
      return;
    }
    if (minQty === null || minQty < 0) {
      setError("Min threshold must be 0 or greater.");
      return;
    }
    if (price === null || price <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/v1/stock/items/${selectedItemId}`, {
        method: "PATCH",
        body: JSON.stringify({
          sku,
          name,
          category,
          qty,
          min_qty: minQty,
          price,
        }),
      });
      const json = (await response.json()) as StockItemResponse | { ok: false; error: string };
      if (!response.ok || !json.ok) {
        throw new Error("Failed to update stock item");
      }
      await refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update stock item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--app-text)]">Stock</h1>
          <p className="mt-1 text-[var(--app-muted)]">Inventory synced with API.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white hover:bg-[#244ee2]"
        >
          <Plus size={18} />
          Add item
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-[var(--app-muted)]" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search SKU, name, category..."
            className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-muted-surface)] py-2 pl-9 pr-3 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)] focus:border-[#2D5CFE]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--app-muted)]">Items</p>
          <p className="mt-2 text-3xl font-bold text-[var(--app-text)]">{stock.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--app-muted)]">Low stock</p>
          <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-300">
            {stock.filter((item) => item.qty > 0 && item.qty <= item.min_qty).length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--app-muted)]">Out of stock</p>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
            {stock.filter((item) => item.qty === 0).length}
          </p>
        </div>
      </div>

      {error ? <div className="text-sm text-red-500">{error}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-[var(--app-muted)]">Loading stock...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[var(--app-border)] bg-[var(--app-muted-surface)]">
                  {["SKU", "Name", "Category", "Qty", "Min", "Price", "Status"].map((header) => (
                    <th key={header} className="px-5 py-4 text-left text-sm font-semibold text-[var(--app-muted)]">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const status = item.qty === 0 ? "Out" : item.qty <= item.min_qty ? "Low" : "In stock";
                  return (
                    <tr
                      key={item.id}
                      className="cursor-pointer border-b border-[var(--app-border)] last:border-b-0 hover:bg-[var(--app-muted-surface)]"
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-[var(--app-text)]">{item.sku}</td>
                      <td className="px-5 py-4 text-sm text-[var(--app-text)]">{item.name}</td>
                      <td className="px-5 py-4 text-sm text-[var(--app-muted)]">{item.category}</td>
                      <td className="px-5 py-4 text-sm text-[var(--app-text)]">{item.qty}</td>
                      <td className="px-5 py-4 text-sm text-[var(--app-muted)]">{item.min_qty}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-[var(--app-text)]">${item.price}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          status === "In stock"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-200"
                            : status === "Low"
                              ? "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/15 dark:text-amber-200"
                              : "border border-red-200 bg-red-50 text-red-700 dark:border-red-400/25 dark:bg-red-500/15 dark:text-red-200"
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EntityDrawer
        open={Boolean(selectedItemId)}
        onClose={() => setSelectedItemId(null)}
        title={selectedItem?.name ?? "Stock item"}
        subtitle={selectedItem?.sku}
        footer={
          <div className="flex justify-end gap-2">
            <button className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text)]" onClick={() => setSelectedItemId(null)}>
              Close
            </button>
            <button className="rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void saveEdit()} disabled={saving || !selectedItemId}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        }
      >
        {!selectedItem ? (
          <div className="text-sm text-[var(--app-muted)]">Loading item...</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <label className="text-xs font-medium text-[var(--app-muted)]">
              SKU*
              <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={editDraft.sku} onChange={(event) => setEditDraft((prev) => ({ ...prev, sku: event.target.value }))} />
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Name*
              <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={editDraft.name} onChange={(event) => setEditDraft((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Category*
              <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="Office, Hardware, Package..." value={editDraft.category} onChange={(event) => setEditDraft((prev) => ({ ...prev, category: event.target.value }))} />
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Quantity (≥ 0)*
              <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" type="number" value={editDraft.qty} onChange={(event) => setEditDraft((prev) => ({ ...prev, qty: event.target.value }))} />
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Min stock threshold (≥ 0)*
              <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" type="number" value={editDraft.min_qty} onChange={(event) => setEditDraft((prev) => ({ ...prev, min_qty: event.target.value }))} />
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Unit price (USD)*
              <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" type="number" step="0.01" value={editDraft.price} onChange={(event) => setEditDraft((prev) => ({ ...prev, price: event.target.value }))} />
            </label>
          </div>
        )}
      </EntityDrawer>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--app-text)]">Add Stock Item</h2>
              <button className="rounded-lg p-2 hover:bg-[var(--app-muted-surface)]" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-[var(--app-muted)]">
                SKU*
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="SKU-1001" value={draft.sku} onChange={(event) => setDraft((prev) => ({ ...prev, sku: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Name*
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="Starter package" value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Category*
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="Packages" value={draft.category} onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Quantity (≥ 0)*
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" type="number" placeholder="0" value={draft.qty} onChange={(event) => setDraft((prev) => ({ ...prev, qty: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Min stock threshold (≥ 0)*
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" type="number" placeholder="5" value={draft.min_qty} onChange={(event) => setDraft((prev) => ({ ...prev, min_qty: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Unit price (USD)*
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" type="number" step="0.01" placeholder="99.00" value={draft.price} onChange={(event) => setDraft((prev) => ({ ...prev, price: event.target.value }))} />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text)]" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void addItem()} disabled={saving}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
