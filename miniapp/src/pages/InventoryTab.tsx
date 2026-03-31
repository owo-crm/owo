import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applyInventoryTemplate,
  createInventoryItem,
  createInventoryMovement,
  createInventoryTemplate,
  deleteInventoryTemplate,
  getInventoryItems,
  getInventoryMovements,
  getInventoryMovementsForLead,
  getLeadInventoryRequirements,
  getInventoryTemplates,
  type InventoryTemplateApplyResult,
  updateInventoryTemplate,
  updateInventoryItem,
} from "../api/inventory";
import { getLeads } from "../api/leads";
import { SelectField } from "../components/SelectField";
import { Spinner } from "../components/Spinner";
import { canManageInventory } from "../lib/permissions";
import { useAuthStore } from "../store/auth";

type InventoryTabProps = {
  businessId: string;
  businessName: string;
  currentRole: string;
  currentPermissions: string[];
};

type TemplateRow = {
  id: string;
  itemId: string;
  quantity: string;
  note: string;
};

type ApplySummaryState = {
  leadId: string;
  leadLabel: string;
  templateId: string;
  templateName: string;
  result: InventoryTemplateApplyResult;
};

function quantityLabel(value: string, unit: string) {
  return `${Number(value || 0).toLocaleString("en-GB")} ${unit}`;
}

function makeTemplateRow(): TemplateRow {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    itemId: "",
    quantity: "",
    note: "",
  };
}

export function InventoryTab({ businessId, businessName, currentRole, currentPermissions }: InventoryTabProps) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const canManage = canManageInventory(currentRole, currentPermissions);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [inventoryView, setInventoryView] = useState<"stock" | "templates" | "movements">("stock");
  const [search, setSearch] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemSku, setItemSku] = useState("");
  const [itemUnit, setItemUnit] = useState("pcs");
  const [itemQuantity, setItemQuantity] = useState("0");
  const [itemMinQuantity, setItemMinQuantity] = useState("0");
  const [itemNotes, setItemNotes] = useState("");
  const [movementItemId, setMovementItemId] = useState("");
  const [movementType, setMovementType] = useState("stock_in");
  const [movementQuantity, setMovementQuantity] = useState("");
  const [movementLeadId, setMovementLeadId] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [movementNote, setMovementNote] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateEventType, setTemplateEventType] = useState("");
  const [templateNote, setTemplateNote] = useState("");
  const [templateRows, setTemplateRows] = useState<TemplateRow[]>([makeTemplateRow()]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [inventoryStatus, setInventoryStatus] = useState<string | null>(null);
  const [applySummary, setApplySummary] = useState<ApplySummaryState | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  const itemsQuery = useQuery({
    queryKey: ["inventory-items", businessId, search],
    queryFn: () => getInventoryItems(businessId, token, search),
    enabled: Boolean(businessId && token),
  });

  const movementsQuery = useQuery({
    queryKey: ["inventory-movements", businessId],
    queryFn: () => getInventoryMovements(businessId, token),
    enabled: Boolean(businessId && token),
  });

  const leadsQuery = useQuery({
    queryKey: ["leads", businessId, "inventory-link"],
    queryFn: () => getLeads(businessId, token),
    enabled: Boolean(businessId && token),
  });

  const templatesQuery = useQuery({
    queryKey: ["inventory-templates", businessId],
    queryFn: () => getInventoryTemplates(businessId, token),
    enabled: Boolean(businessId && token),
  });

  const selectedLeadRequirementsQuery = useQuery({
    queryKey: ["inventory-requirements", businessId, selectedLeadId],
    queryFn: () => getLeadInventoryRequirements(businessId, selectedLeadId, token),
    enabled: Boolean(businessId && token && selectedLeadId),
  });

  const selectedLeadMovementsQuery = useQuery({
    queryKey: ["inventory-movements", businessId, "lead", selectedLeadId],
    queryFn: () => getInventoryMovementsForLead(businessId, token, selectedLeadId),
    enabled: Boolean(businessId && token && selectedLeadId),
  });

  const items = itemsQuery.data?.items ?? [];
  const movements = movementsQuery.data?.items ?? [];
  const leads = leadsQuery.data?.items ?? [];
  const templates = templatesQuery.data?.items ?? [];
  const lowStockItems = items.filter((item) => item.low_stock);
  const reservedItems = items.filter((item) => Number(item.reserved_quantity ?? 0) > 0);
  const typedTemplates = templates.filter((template) => template.event_type_match?.trim());
  const recentMovements = movements.filter((movement) => {
    const createdAt = new Date(movement.created_at).getTime();
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return now - createdAt <= sevenDays;
  });

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.name}${item.sku ? ` (${item.sku})` : ""}`,
  }));
  const leadOptions = [
    { value: "", label: "Not linked to a lead" },
    ...leads.map((lead) => ({
      value: lead.id,
      label: `${lead.name?.trim() || lead.uid} (${lead.uid})`,
    })),
  ];
  const itemMap = useMemo(() => Object.fromEntries(items.map((item) => [item.id, item])), [items]);
  const leadMap = useMemo(() => Object.fromEntries(leads.map((lead) => [lead.id, lead])), [leads]);
  const requiresLeadLink = movementType === "reserve" || movementType === "use" || movementType === "release";
  const selectedLeadRequirements = selectedLeadRequirementsQuery.data?.items ?? [];
  const selectedLeadMovements = selectedLeadMovementsQuery.data?.items ?? [];
  const selectedLeadInventorySummary = useMemo(() => {
    const summary = new Map<
      string,
      {
        reserved: number;
        used: number;
      }
    >();

    selectedLeadMovements.forEach((movement) => {
      const current = summary.get(movement.item_id) ?? { reserved: 0, used: 0 };
      const quantity = Number(movement.quantity ?? 0);
      if (movement.movement_type === "reserve") {
        current.reserved += quantity;
      } else if (movement.movement_type === "release") {
        current.reserved -= quantity;
      } else if (movement.movement_type === "use") {
        current.reserved -= quantity;
        current.used += quantity;
      }
      summary.set(movement.item_id, current);
    });

    return summary;
  }, [selectedLeadMovements]);
  const selectedLeadReadinessRows = selectedLeadRequirements.map((requirement) => {
    const item = itemMap[requirement.item_id];
    const summary = selectedLeadInventorySummary.get(requirement.item_id);
    const required = Number(requirement.required_quantity ?? 0);
    const reserved = Number(summary?.reserved ?? 0);
    const used = Number(summary?.used ?? 0);
    const missing = Math.max(0, required - reserved - used);
    return {
      id: requirement.id,
      itemName: item?.name ?? "Inventory item",
      unit: item?.unit ?? "pcs",
      required,
      reserved,
      used,
      missing,
      note: requirement.note ?? "",
    };
  });
  const selectedLeadTotals = selectedLeadReadinessRows.reduce(
    (accumulator, row) => ({
      required: accumulator.required + row.required,
      reserved: accumulator.reserved + row.reserved,
      used: accumulator.used + row.used,
      missing: accumulator.missing + row.missing,
    }),
    { required: 0, reserved: 0, used: 0, missing: 0 },
  );

  async function refreshInventory() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inventory-items", businessId] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-movements", businessId] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-templates", businessId] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-requirements", businessId] }),
      queryClient.invalidateQueries({ queryKey: ["tasks", businessId] }),
    ]);
  }

  function resetItemForm() {
    setEditingItemId(null);
    setItemName("");
    setItemSku("");
    setItemUnit("pcs");
    setItemQuantity("0");
    setItemMinQuantity("0");
    setItemNotes("");
    setIsItemModalOpen(false);
  }

  async function handleCreateItem() {
    if (!itemName.trim()) {
      setInventoryStatus("Enter an item name first.");
      return;
    }
    try {
      const created = await createInventoryItem(
        businessId,
        {
          name: itemName.trim(),
          sku: itemSku.trim() || null,
          unit: itemUnit.trim() || "pcs",
          current_quantity: itemQuantity.trim() || "0",
          min_quantity: itemMinQuantity.trim() || "0",
          notes: itemNotes.trim() || null,
        },
        token,
      );
      setInventoryStatus(`Inventory item created: ${created.name}`);
      setMovementItemId(created.id);
      resetItemForm();
      await refreshInventory();
    } catch {
      setInventoryStatus("Could not create the inventory item.");
    }
  }

  async function handleSaveItem() {
    if (!editingItemId || !itemName.trim()) {
      setInventoryStatus("Choose an item and enter a name first.");
      return;
    }
    try {
      const updated = await updateInventoryItem(
        businessId,
        editingItemId,
        {
          name: itemName.trim(),
          sku: itemSku.trim() || null,
          unit: itemUnit.trim() || "pcs",
          min_quantity: itemMinQuantity.trim() || "0",
          notes: itemNotes.trim() || null,
        },
        token,
      );
      setInventoryStatus(`Inventory item updated: ${updated.name}`);
      resetItemForm();
      await refreshInventory();
    } catch {
      setInventoryStatus("Could not update the inventory item.");
    }
  }

  async function handleCreateMovement() {
    if (!movementItemId || !movementQuantity.trim()) {
      setInventoryStatus("Choose an item and quantity first.");
      return false;
    }
    if (requiresLeadLink && !movementLeadId) {
      setInventoryStatus("This movement type should be linked to a lead.");
      return false;
    }
    try {
      await createInventoryMovement(
        businessId,
        movementItemId,
        {
          movement_type: movementType,
          quantity: movementQuantity.trim(),
          lead_id: movementLeadId || null,
          note: movementNote.trim() || null,
        },
        token,
      );
      setInventoryStatus("Stock movement recorded.");
      setMovementQuantity("");
      setMovementLeadId("");
      setMovementNote("");
      await refreshInventory();
      return true;
    } catch {
      setInventoryStatus("Could not save the stock movement.");
      return false;
    }
  }

  async function handleArchiveItem(itemId: string) {
    try {
      await updateInventoryItem(businessId, itemId, { is_active: false }, token);
      setInventoryStatus("Inventory item archived.");
      await refreshInventory();
    } catch {
      setInventoryStatus("Could not archive this inventory item.");
    }
  }

  function startEditingItem(itemId: string) {
    const item = itemMap[itemId];
    if (!item) {
      return;
    }
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemSku(item.sku ?? "");
    setItemUnit(item.unit);
    setItemQuantity(String(item.current_quantity ?? "0"));
    setItemMinQuantity(String(item.min_quantity ?? "0"));
    setItemNotes(item.notes ?? "");
    setInventoryStatus(`Editing item: ${item.name}`);
    setIsItemModalOpen(true);
  }

  function updateTemplateRow(rowId: string, patch: Partial<TemplateRow>) {
    setTemplateRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  function addTemplateRow() {
    setTemplateRows((current) => [...current, makeTemplateRow()]);
  }

  function removeTemplateRow(rowId: string) {
    setTemplateRows((current) => (current.length > 1 ? current.filter((row) => row.id !== rowId) : current));
  }

  async function handleCreateTemplate() {
    const cleanedRows = templateRows
      .map((row) => ({
        item_id: row.itemId,
        required_quantity: row.quantity.trim(),
        note: row.note.trim() || null,
      }))
      .filter((row) => row.item_id && row.required_quantity);

    if (!templateName.trim()) {
      setInventoryStatus("Enter a template name first.");
      return;
    }
    if (cleanedRows.length === 0) {
      setInventoryStatus("Add at least one item to the template.");
      return;
    }

    try {
      const payload = {
        name: templateName.trim(),
        event_type_match: templateEventType.trim() || null,
        note: templateNote.trim() || null,
        items: cleanedRows,
      };
      const saved = editingTemplateId
        ? await updateInventoryTemplate(businessId, editingTemplateId, payload, token)
        : await createInventoryTemplate(businessId, payload, token);
      setInventoryStatus(`Inventory template ${editingTemplateId ? "updated" : "created"}: ${saved.name}`);
      setEditingTemplateId(null);
      setTemplateName("");
      setTemplateEventType("");
      setTemplateNote("");
      setTemplateRows([makeTemplateRow()]);
      setIsTemplateModalOpen(false);
      await refreshInventory();
    } catch {
      setInventoryStatus("Could not create the inventory template.");
    }
  }

  function startEditingTemplate(templateId: string) {
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) {
      return;
    }
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateEventType(template.event_type_match ?? "");
    setTemplateNote(template.note ?? "");
    setTemplateRows(
      template.items.length > 0
        ? template.items.map((row) => ({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            itemId: row.item_id,
            quantity: row.required_quantity,
            note: row.note ?? "",
          }))
        : [makeTemplateRow()],
    );
    setInventoryStatus(`Editing template: ${template.name}`);
    setIsTemplateModalOpen(true);
  }

  function resetTemplateForm() {
    setEditingTemplateId(null);
    setTemplateName("");
    setTemplateEventType("");
    setTemplateNote("");
    setTemplateRows([makeTemplateRow()]);
    setIsTemplateModalOpen(false);
  }

  async function handleDeleteTemplate(templateId: string) {
    try {
      const result = await deleteInventoryTemplate(businessId, templateId, token);
      setInventoryStatus(result.message);
      await refreshInventory();
    } catch {
      setInventoryStatus("Could not delete the inventory template.");
    }
  }

  async function handleApplyTemplateToLead(templateId: string) {
    if (!selectedLeadId) {
      setInventoryStatus("Choose a lead first before applying a template.");
      return;
    }
    const selectedTemplate = templates.find((template) => template.id === templateId);
    const selectedLead = leadMap[selectedLeadId];
    try {
      setApplyingTemplateId(templateId);
      const result = await applyInventoryTemplate(businessId, templateId, selectedLeadId, token);
      setInventoryStatus(result.message);
      setApplySummary({
        leadId: selectedLeadId,
        leadLabel: selectedLead?.name?.trim() || selectedLead?.uid || "Selected lead",
        templateId,
        templateName: selectedTemplate?.name ?? "Template",
        result,
      });
      await Promise.all([
        refreshInventory(),
        queryClient.invalidateQueries({ queryKey: ["leads", businessId] }),
        selectedLeadRequirementsQuery.refetch(),
        selectedLeadMovementsQuery.refetch(),
      ]);
    } catch {
      setInventoryStatus("Could not apply this inventory template to the selected lead.");
    } finally {
      setApplyingTemplateId(null);
    }
  }

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <span className="section-heading__eyebrow">{businessName}</span>
          <h2>Inventory</h2>
          <p className="section-heading__support">One place for stock, reusable templates, and real warehouse movements.</p>
        </div>
      </div>

      <div className="metrics-grid metrics-grid--compact">
        <article className="metric-card">
          <span className="metric-card__label">Stock items</span>
          <strong className="metric-card__value">{items.length}</strong>
          <span className="metric-card__trend">{lowStockItems.length} low stock</span>
        </article>
        <article className="metric-card">
          <span className="metric-card__label">Templates</span>
          <strong className="metric-card__value">{templates.length}</strong>
          <span className="metric-card__trend">{typedTemplates.length} linked to lead types</span>
        </article>
        <article className="metric-card">
          <span className="metric-card__label">In motion</span>
          <strong className="metric-card__value">{reservedItems.length}</strong>
          <span className="metric-card__trend">{recentMovements.length} moves in the last 7 days</span>
        </article>
      </div>

      <div className="lead-chip-row">
        <button
          type="button"
          className={`lead-chip${inventoryView === "stock" ? " lead-chip--active" : ""}`}
          onClick={() => setInventoryView("stock")}
        >
          Stock
        </button>
        <button
          type="button"
          className={`lead-chip${inventoryView === "templates" ? " lead-chip--active" : ""}`}
          onClick={() => setInventoryView("templates")}
        >
          Templates
        </button>
        <button
          type="button"
          className={`lead-chip${inventoryView === "movements" ? " lead-chip--active" : ""}`}
          onClick={() => setInventoryView("movements")}
        >
          Movements
        </button>
      </div>

      {inventoryStatus ? <p className="settings-status">{inventoryStatus}</p> : null}

      {inventoryView === "stock" ? (
        <div className="content-stack">
          <article className="panel panel--subtle inventory-hint">
            <p>Start with the items your team actually counts: gear, materials, or repeatable stock units.</p>
          </article>

          <label className="input-field">
            <span className="select-field__label">Search stock</span>
            <input
              className="input-field__control"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find item by name or SKU..."
            />
          </label>

          {lowStockItems.length > 0 ? (
            <article className="panel panel--subtle">
              <div className="section-heading section-heading--compact">
                <div>
                  <h3>Low stock</h3>
                  <p>{lowStockItems.length} item{lowStockItems.length === 1 ? "" : "s"} need attention.</p>
                </div>
              </div>
              <div className="lead-chip-row lead-chip-row--scroll">
                {lowStockItems.slice(0, 6).map((item) => (
                  <span key={item.id} className="chip chip--active">
                    {item.name}
                  </span>
                ))}
              </div>
            </article>
          ) : null}

          <article className="panel">
            <div className="lead-detail__section-heading">
              <div>
                <h3>Stock items</h3>
                <p>Track what is on hand, what is reserved, and what is close to empty.</p>
              </div>
              {canManage ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    resetItemForm();
                    setIsItemModalOpen(true);
                  }}
                >
                  Add stock item
                </button>
              ) : null}
            </div>
            {itemsQuery.isLoading ? <Spinner label="Loading inventory..." /> : null}
            <div className="stack-list stack-list--tight">
              {!itemsQuery.isLoading && items.length === 0 ? (
                <article className="panel panel--subtle">
                  <h3>No stock items yet</h3>
                  <p>Add the first item you want to track in Barowo.</p>
                </article>
              ) : null}
              {items.map((item) => (
                <article key={item.id} className="panel panel--subtle inventory-card">
                  <div className="activity-item__topline">
                    <strong>{item.name}</strong>
                    {Number(item.available_quantity ?? 0) > 0 ? (
                      <span className="lead-card__meta-label">{quantityLabel(item.available_quantity, item.unit)} free</span>
                    ) : null}
                  </div>
                  <div className="inventory-card__meta">
                    {item.sku ? <span className="chip">SKU {item.sku}</span> : null}
                    <span className="chip">On hand {quantityLabel(item.current_quantity, item.unit)}</span>
                    <span className="chip">Reserved {quantityLabel(item.reserved_quantity, item.unit)}</span>
                    <span className="chip">Min {quantityLabel(item.min_quantity, item.unit)}</span>
                    {item.low_stock ? <span className="chip chip--active">Low stock</span> : null}
                  </div>
                  {item.notes ? <p>{item.notes}</p> : null}
                  {canManage ? (
                    <div className="toggle-group inventory-card__actions">
                      <button
                        type="button"
                        className="chip"
                        onClick={() => {
                          setMovementItemId(item.id);
                          setIsMovementModalOpen(true);
                          setInventoryView("movements");
                        }}
                      >
                        Move
                      </button>
                      <button type="button" className="chip" onClick={() => startEditingItem(item.id)}>
                        Edit
                      </button>
                      <button type="button" className="ghost-button" onClick={() => void handleArchiveItem(item.id)}>
                        Archive
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {inventoryView === "templates" ? (
        <div className="content-stack">
          <article className="panel panel--subtle inventory-hint">
            <p>Use templates for repeatable setups. Apply one to a lead when the same service needs the same stock again.</p>
          </article>

          <article className="panel">
            <div className="lead-detail__section-heading">
              <div>
                <h3>Apply to lead</h3>
                <p>Choose a lead, then apply a saved template in one short flow.</p>
              </div>
            </div>
            <div className="stack-list stack-list--tight">
              <SelectField
                label="Lead"
                value={selectedLeadId}
                onChange={setSelectedLeadId}
                options={leadOptions}
                presentation="sheet"
                searchable
                searchPlaceholder="Search lead..."
              />
              {applySummary ? (
                <article className="panel panel--subtle">
                  <div className="activity-item__topline">
                    <strong>{applySummary.templateName}</strong>
                    <span className="lead-card__meta-label">{applySummary.leadLabel}</span>
                  </div>
                  <p>{applySummary.result.message}</p>
                  <div className="lead-chip-row lead-chip-row--scroll">
                    <span className="chip">{applySummary.result.requirements_created} rows</span>
                    <span className="chip">{applySummary.result.reserved_units} reserved</span>
                    <span className="chip">{applySummary.result.missing_units} missing</span>
                    {applySummary.result.prep_task_created ? <span className="chip chip--active">Prep task</span> : null}
                    {applySummary.result.restock_task_created ? <span className="chip chip--active">Restock task</span> : null}
                  </div>
                </article>
              ) : null}
              {selectedLeadId ? (
                <article className="panel panel--subtle">
                  <div className="activity-item__topline">
                    <strong>Lead plan</strong>
                    <span className="lead-card__meta-label">{leadMap[selectedLeadId]?.name?.trim() || leadMap[selectedLeadId]?.uid || "Selected lead"}</span>
                  </div>
                  {selectedLeadRequirementsQuery.isLoading || selectedLeadMovementsQuery.isLoading ? (
                    <Spinner label="Loading lead plan..." />
                  ) : selectedLeadReadinessRows.length === 0 ? (
                    <p>No inventory plan yet. Apply a template to start.</p>
                  ) : (
                    <>
                      <div className="lead-chip-row lead-chip-row--scroll">
                        <span className="chip">Required {selectedLeadTotals.required}</span>
                        <span className="chip">Reserved {selectedLeadTotals.reserved}</span>
                        <span className="chip">Used {selectedLeadTotals.used}</span>
                        <span className={selectedLeadTotals.missing > 0 ? "chip chip--active" : "chip"}>Missing {selectedLeadTotals.missing}</span>
                      </div>
                      <div className="stack-list stack-list--tight">
                        {selectedLeadReadinessRows.map((row) => (
                          <article key={row.id} className="panel panel--subtle inventory-card">
                            <div className="activity-item__topline">
                              <strong>{row.itemName}</strong>
                              <span className="lead-card__meta-label">{row.unit}</span>
                            </div>
                            <div className="lead-chip-row lead-chip-row--scroll">
                              <span className="chip">Required {row.required}</span>
                              <span className="chip">Reserved {row.reserved}</span>
                              <span className="chip">Used {row.used}</span>
                              <span className={row.missing > 0 ? "chip chip--active" : "chip"}>Missing {row.missing}</span>
                            </div>
                            {row.note ? <p>{row.note}</p> : null}
                          </article>
                        ))}
                      </div>
                    </>
                  )}
                </article>
              ) : (
                <article className="panel panel--subtle">
                  <p>Select a lead to inspect its inventory plan and apply a template.</p>
                </article>
              )}
            </div>
          </article>

          <article className="panel">
            <div className="lead-detail__section-heading">
              <div>
                <h3>Templates</h3>
                <p>Reusable inventory plans for services, events, and repeatable offers.</p>
              </div>
              {canManage ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    resetTemplateForm();
                    setIsTemplateModalOpen(true);
                  }}
                >
                  Add template
                </button>
              ) : null}
            </div>
            {templatesQuery.isLoading ? <Spinner label="Loading templates..." /> : null}
            <div className="stack-list stack-list--tight">
              {!templatesQuery.isLoading && templates.length === 0 ? (
                <article className="panel panel--subtle">
                  <h3>No templates yet</h3>
                  <p>Create the first reusable stock plan for your team.</p>
                </article>
              ) : null}
              {templates.map((template) => (
                <article key={template.id} className="panel panel--subtle inventory-card">
                  <div className="activity-item__topline">
                    <strong>{template.name}</strong>
                    <span className="lead-card__meta-label">{template.event_type_match || "Manual template"}</span>
                  </div>
                  <p>{template.note || `${template.items.length} rows in this template.`}</p>
                  <div className="lead-chip-row lead-chip-row--scroll">
                    {template.items.slice(0, 3).map((row, index) => {
                      const item = itemMap[row.item_id];
                      return (
                        <span key={`${template.id}-${index}`} className="chip">
                          {item?.name ?? "Item"} - {row.required_quantity}
                        </span>
                      );
                    })}
                    {template.items.length > 3 ? <span className="chip">+{template.items.length - 3} more</span> : null}
                  </div>
                  <div className="toggle-group inventory-card__actions">
                    {canManage ? (
                      <button
                        type="button"
                        className="chip"
                        onClick={() => void handleApplyTemplateToLead(template.id)}
                        disabled={!selectedLeadId || applyingTemplateId === template.id}
                      >
                        {applyingTemplateId === template.id ? "Applying..." : "Apply to lead"}
                      </button>
                    ) : null}
                    <button type="button" className="chip" onClick={() => startEditingTemplate(template.id)}>
                      Edit
                    </button>
                    <button type="button" className="ghost-button" onClick={() => void handleDeleteTemplate(template.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {inventoryView === "movements" ? (
        <div className="content-stack">
          <article className="panel panel--subtle inventory-hint">
            <p>Use movements whenever stock changes in real life: incoming deliveries, reservations for a lead, release, or actual usage.</p>
          </article>

          <article className="panel">
            <div className="lead-detail__section-heading">
              <div>
                <h3>Movements</h3>
                <p>Record what comes in, goes out, gets reserved, or gets used.</p>
              </div>
              {canManage ? (
                <button type="button" className="ghost-button" onClick={() => setIsMovementModalOpen(true)}>
                  Add movement
                </button>
              ) : null}
            </div>
            {movementsQuery.isLoading ? <Spinner label="Loading inventory movements..." /> : null}
            <div className="stack-list stack-list--tight">
              {!movementsQuery.isLoading && movements.length === 0 ? (
                <article className="panel panel--subtle">
                  <h3>No movements yet</h3>
                  <p>Start by recording the first stock movement.</p>
                </article>
              ) : null}
              {movements.map((movement) => {
                const item = itemMap[movement.item_id];
                const lead = movement.lead_id ? leadMap[movement.lead_id] : null;
                return (
                  <article key={movement.id} className="panel panel--subtle inventory-card">
                    <div className="activity-item__topline">
                      <strong>{item?.name ?? "Inventory item"}</strong>
                      <span className="lead-card__meta-label">{new Date(movement.created_at).toLocaleString("en-GB")}</span>
                    </div>
                    <div className="lead-chip-row lead-chip-row--scroll">
                      <span className="chip">{movement.movement_type.replace("_", " ")}</span>
                      <span className="chip">{quantityLabel(movement.quantity, item?.unit ?? "pcs")}</span>
                      {lead ? <span className="chip">Lead {lead.name?.trim() || lead.uid}</span> : null}
                    </div>
                    {movement.note ? <p>{movement.note}</p> : null}
                  </article>
                );
              })}
            </div>
          </article>
        </div>
      ) : null}

      {canManage && isTemplateModalOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card lead-detail__details-modal">
            <div className="lead-detail__section-heading">
              <div>
                <h3>{editingTemplateId ? "Edit inventory template" : "Create inventory template"}</h3>
                <p>Keep template building focused without stretching the main inventory page.</p>
              </div>
              <button type="button" className="ghost-button" onClick={resetTemplateForm}>
                Close
              </button>
            </div>
            <div className="lead-detail__activity-composer">
              <label className="input-field lead-detail__activity-input">
                <span className="select-field__label">Template name</span>
                <input className="input-field__control" value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
              </label>
              <label className="input-field">
                <span className="select-field__label">Match lead type</span>
                <input className="input-field__control" value={templateEventType} onChange={(event) => setTemplateEventType(event.target.value)} />
              </label>
              <label className="input-field lead-detail__activity-input">
                <span className="select-field__label">Template note</span>
                <input className="input-field__control" value={templateNote} onChange={(event) => setTemplateNote(event.target.value)} />
              </label>
            </div>
            <div className="stack-list stack-list--tight">
              {templateRows.map((row) => (
                <div key={row.id} className="lead-detail__activity-composer">
                  <SelectField
                    label="Item"
                    value={row.itemId}
                    onChange={(value) => updateTemplateRow(row.id, { itemId: value })}
                    options={itemOptions}
                    presentation="sheet"
                    searchable
                    searchPlaceholder="Search stock item..."
                  />
                  <label className="input-field">
                    <span className="select-field__label">Required qty</span>
                    <input
                      className="input-field__control"
                      value={row.quantity}
                      onChange={(event) => updateTemplateRow(row.id, { quantity: event.target.value })}
                    />
                  </label>
                  <label className="input-field lead-detail__activity-input">
                    <span className="select-field__label">Row note</span>
                    <input
                      className="input-field__control"
                      value={row.note}
                      onChange={(event) => updateTemplateRow(row.id, { note: event.target.value })}
                    />
                  </label>
                  <button type="button" className="chip" onClick={() => removeTemplateRow(row.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="toggle-group">
              <button type="button" className="chip" onClick={addTemplateRow}>
                Add row
              </button>
              <button type="button" className="primary-button" onClick={() => void handleCreateTemplate()}>
                {editingTemplateId ? "Save template" : "Create template"}
              </button>
              <button type="button" className="ghost-button" onClick={resetTemplateForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {canManage && isItemModalOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card lead-detail__details-modal">
            <div className="lead-detail__section-heading">
              <div>
                <h3>{editingItemId ? "Edit stock item" : "Add stock item"}</h3>
                <p>Create or update a product, material, or service unit you want to track.</p>
              </div>
              <button type="button" className="ghost-button" onClick={resetItemForm}>
                Close
              </button>
            </div>
            <div className="lead-detail__activity-composer">
              <label className="input-field lead-detail__activity-input">
                <span className="select-field__label">Item name</span>
                <input className="input-field__control" value={itemName} onChange={(event) => setItemName(event.target.value)} />
              </label>
              <label className="input-field">
                <span className="select-field__label">SKU</span>
                <input className="input-field__control" value={itemSku} onChange={(event) => setItemSku(event.target.value)} />
              </label>
              <label className="input-field">
                <span className="select-field__label">Unit</span>
                <input className="input-field__control" value={itemUnit} onChange={(event) => setItemUnit(event.target.value)} />
              </label>
            </div>
            <div className="lead-detail__activity-composer">
              {!editingItemId ? (
                <label className="input-field">
                  <span className="select-field__label">Opening quantity</span>
                  <input className="input-field__control" value={itemQuantity} onChange={(event) => setItemQuantity(event.target.value)} />
                </label>
              ) : null}
              <label className="input-field">
                <span className="select-field__label">Low stock threshold</span>
                <input className="input-field__control" value={itemMinQuantity} onChange={(event) => setItemMinQuantity(event.target.value)} />
              </label>
              <label className="input-field lead-detail__activity-input">
                <span className="select-field__label">Notes</span>
                <input className="input-field__control" value={itemNotes} onChange={(event) => setItemNotes(event.target.value)} />
              </label>
            </div>
            <div className="toggle-group">
              <button type="button" className="primary-button" onClick={() => void (editingItemId ? handleSaveItem() : handleCreateItem())}>
                {editingItemId ? "Save item" : "Add item"}
              </button>
              <button type="button" className="ghost-button" onClick={resetItemForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {canManage && isMovementModalOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card lead-detail__details-modal">
            <div className="lead-detail__section-heading">
              <div>
                <h3>Record stock movement</h3>
                <p>Use stock in/out, reserve items for a lead, release them, or mark them as used.</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setIsMovementModalOpen(false);
                  setMovementQuantity("");
                  setMovementNote("");
                }}
              >
                Close
              </button>
            </div>
            <div className="lead-detail__activity-composer">
              <SelectField
                label="Item"
                value={movementItemId}
                onChange={setMovementItemId}
                options={itemOptions}
                presentation="sheet"
                searchable
                searchPlaceholder="Search stock item..."
              />
              <SelectField
                label="Movement type"
                value={movementType}
                onChange={setMovementType}
                options={[
                  { value: "stock_in", label: "Stock in" },
                  { value: "stock_out", label: "Stock out" },
                  { value: "reserve", label: "Reserve for lead" },
                  { value: "release", label: "Release reservation" },
                  { value: "use", label: "Use / consume" },
                  { value: "adjustment", label: "Adjustment" },
                ]}
                presentation="sheet"
              />
              <label className="input-field">
                <span className="select-field__label">{movementType === "adjustment" ? "Set quantity to" : "Quantity"}</span>
                <input className="input-field__control" value={movementQuantity} onChange={(event) => setMovementQuantity(event.target.value)} />
              </label>
            </div>
            <div className="lead-detail__activity-composer">
              <SelectField
                label="Linked lead"
                value={movementLeadId}
                onChange={setMovementLeadId}
                options={leadOptions}
                presentation="sheet"
                searchable
                searchPlaceholder="Search lead..."
              />
              <label className="input-field lead-detail__activity-input">
                <span className="select-field__label">Note</span>
                <input className="input-field__control" value={movementNote} onChange={(event) => setMovementNote(event.target.value)} />
              </label>
            </div>
            {requiresLeadLink ? <p className="settings-status">Reserve, release, and use actions should be linked to a lead.</p> : null}
            <div className="toggle-group">
              <button
                type="button"
                className="primary-button"
                onClick={async () => {
                  const saved = await handleCreateMovement();
                  if (saved) {
                    setIsMovementModalOpen(false);
                  }
                }}
              >
                Save movement
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setIsMovementModalOpen(false);
                  setMovementQuantity("");
                  setMovementNote("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

