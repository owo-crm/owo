import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  buildAttachmentContentUrl,
  deleteAttachment,
  getAttachments,
  uploadAttachment,
  type LeadAttachment,
} from "../api/attachments";
import { getExpenses } from "../api/expenses";
import { getBusinessMembers, getLeadStatuses } from "../api/businesses";
import {
  getInventoryItems,
  getInventoryMovementsForLead,
  getLeadInventoryRequirements,
} from "../api/inventory";
import { getIncomes } from "../api/incomes";
import { deleteLead, getLead, updateLead } from "../api/leads";
import { createTask, getTasks, markTaskDone } from "../api/tasks";
import { SelectField } from "../components/SelectField";
import { Spinner } from "../components/Spinner";
import {
  canAssignLeads,
  canDeleteLeads as canDeleteLeadsPermission,
  canManageAttachments as canManageAttachmentsPermission,
  canManageExpenses as canManageExpensesPermission,
  canManageInventory as canManageInventoryPermission,
  canViewAttachments,
  canViewDashboard,
  canViewInventory,
} from "../lib/permissions";
import { useAuthStore } from "../store/auth";
import { useBusinessStore } from "../store/business";

type LeadDetailsPageProps = {
  businessId: string;
  businessName: string;
  leadUid: string;
  currentRole?: string;
  currentPermissions?: string[];
  onClose: () => void;
  onOpenInventory?: () => void;
};

type AdditionalInfoRow = {
  id: string;
  key: string;
  value: string;
  originalKey: string | null;
};

type ActivityEntry = {
  id: string;
  type: string;
  body: string;
  created_at: string;
};

type LeadStatusSemantic = {
  name: string;
  color?: string | null;
  is_won: boolean;
  is_lost: boolean;
  requires_follow_up: boolean;
  hide_from_active: boolean;
};

type WorkflowHint = {
  message: string;
  tone: "warning" | "ok" | "soft";
};

const hiddenAdditionalInfoKeys = new Set([
  "id",
  "created_time",
  "ad_id",
  "ad_name",
  "adset_id",
  "adset_name",
  "campaign_id",
  "campaign_name",
  "form_id",
  "form_name",
  "is_organic",
  "platform",
  "inbox_url",
  "lead_status",
]);
const manualAdditionalInfoPrefix = "manual:";
const attachmentAccept =
  "image/*,.heic,.heif,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,text/plain,text/csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const attachmentFormatsLabel = "Photos, PDF, TXT, CSV, Word, Excel";

function makeAdditionalInfoRow(key = "", value = ""): AdditionalInfoRow {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    key,
    value,
    originalKey: null,
  };
}

function getDisplayAdditionalInfoKey(key: string) {
  return key.startsWith(manualAdditionalInfoPrefix) ? key.slice(manualAdditionalInfoPrefix.length).trim() : key;
}

function isVisibleAdditionalInfoKey(key: string) {
  const normalizedKey = key.trim();
  if (!normalizedKey || normalizedKey.startsWith("unnamed_column_") || hiddenAdditionalInfoKeys.has(normalizedKey)) {
    return false;
  }
  return getDisplayAdditionalInfoKey(normalizedKey) !== "";
}

function formatDateTime(value?: string | null, withTime = true) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString(
    "en-GB",
    withTime
      ? {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
  );
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function makeActivityEntry(type = "note", body = ""): ActivityEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    body,
    created_at: new Date().toISOString(),
  };
}

function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function getAttachmentExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
}

function isImageAttachment(attachment: LeadAttachment) {
  return (
    attachment.content_type?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(attachment.original_name)
  );
}

function getUploadErrorMessage(error: unknown) {
  const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return typeof detail === "string" && detail.trim() ? detail : "Could not upload attachment.";
}

function buildWorkflowRequirements({
  statusConfig,
  hasOwner,
  openTaskCount,
  hasNotes,
  missingInventoryUnits,
}: {
  statusConfig: LeadStatusSemantic | null | undefined;
  hasOwner: boolean;
  openTaskCount: number;
  hasNotes: boolean;
  missingInventoryUnits: number;
}) {
  const items: WorkflowHint[] = [];

  if (!hasOwner) {
    items.push({ message: "Assign this lead to someone from the team.", tone: "warning" });
  }

  if (statusConfig?.requires_follow_up && openTaskCount === 0) {
    items.push({ message: "This stage needs at least one next task.", tone: "warning" });
  }

  if (!statusConfig?.requires_follow_up && openTaskCount > 0 && !statusConfig?.is_won && !statusConfig?.is_lost) {
    items.push({ message: "If the team is waiting on a reply, move this lead into a follow-up stage.", tone: "soft" });
  }

  if (statusConfig?.is_won && missingInventoryUnits > 0) {
    items.push({ message: "Some required inventory is still missing for this deal.", tone: "warning" });
  }

  if (statusConfig?.is_lost && !hasNotes) {
    items.push({ message: "Add a short loss reason in notes.", tone: "warning" });
  }

  if (items.length === 0) {
    if (statusConfig?.is_won) {
      items.push({ message: "Won deal looks complete.", tone: "ok" });
    } else if (statusConfig?.is_lost) {
      items.push({ message: "This lost lead already has enough context.", tone: "ok" });
    } else if (statusConfig?.requires_follow_up) {
      items.push({ message: "This follow-up stage already has the next action in place.", tone: "ok" });
    } else {
      items.push({ message: "Nothing critical is missing right now.", tone: "ok" });
    }
  }

  return items;
}

export function LeadDetailsPage({
  businessId,
  businessName,
  leadUid,
  currentRole: currentRoleProp,
  currentPermissions: currentPermissionsProp,
  onClose,
  onOpenInventory,
}: LeadDetailsPageProps) {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const activeBusiness = useBusinessStore((state) =>
    state.businesses.find((business) => business.id === businessId),
  );
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("new");
  const [assignedTo, setAssignedTo] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [eventType, setEventType] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [notes, setNotes] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfoRow[]>([]);
  const [activityDraftType, setActivityDraftType] = useState("note");
  const [activityDraftBody, setActivityDraftBody] = useState("");
  const [activityHistory, setActivityHistory] = useState<ActivityEntry[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [isWorkflowActionModalOpen, setIsWorkflowActionModalOpen] = useState(false);
  const [workflowActionType, setWorkflowActionType] = useState<"activity" | "task">("activity");
  const [inventoryStatus, setInventoryStatus] = useState<string | null>(null);
  const [attachmentStatus, setAttachmentStatus] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Loading lead details...");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isLeadMenuOpen, setIsLeadMenuOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<LeadAttachment | null>(null);

  const leadQuery = useQuery({
    queryKey: ["lead", businessId, leadUid],
    queryFn: () => getLead(businessId, leadUid, token),
    enabled: Boolean(businessId && leadUid && token),
  });

  const membersQuery = useQuery({
    queryKey: ["business-members", businessId],
    queryFn: async () => (await getBusinessMembers(businessId, token)).items,
    enabled: Boolean(businessId && token),
  });

  const leadStatusesQuery = useQuery({
    queryKey: ["lead-statuses", businessId],
    queryFn: async () => (await getLeadStatuses(businessId, token)).items,
    enabled: Boolean(businessId && token),
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", businessId, leadQuery.data?.id],
    queryFn: () => getTasks(businessId, token, leadQuery.data?.id ?? null),
    enabled: Boolean(businessId && token && leadQuery.data?.id),
  });

  const expensesQuery = useQuery({
    queryKey: ["expenses", businessId, "lead", leadQuery.data?.id],
    queryFn: () => getExpenses(businessId, token, "all", leadQuery.data?.id ?? null),
    enabled: Boolean(businessId && token && leadQuery.data?.id),
  });

  const incomesQuery = useQuery({
    queryKey: ["incomes", businessId, "lead", leadQuery.data?.id],
    queryFn: () => getIncomes(businessId, token, leadQuery.data?.id ?? null),
    enabled: Boolean(businessId && token && leadQuery.data?.id),
  });

  const attachmentsQuery = useQuery({
    queryKey: ["attachments", businessId, leadUid],
    queryFn: () => getAttachments(businessId, leadUid, token),
    enabled: Boolean(businessId && leadUid && token),
  });

  const inventoryItemsQuery = useQuery({
    queryKey: ["inventory-items", businessId, "lead-details"],
    queryFn: () => getInventoryItems(businessId, token),
    enabled: Boolean(businessId && token && activeBusiness?.enabledModules.includes("inventory")),
  });

  const inventoryMovementsQuery = useQuery({
    queryKey: ["inventory-movements", businessId, "lead", leadQuery.data?.id],
    queryFn: () => getInventoryMovementsForLead(businessId, token, leadQuery.data?.id ?? null),
    enabled: Boolean(businessId && token && leadQuery.data?.id && activeBusiness?.enabledModules.includes("inventory")),
  });

  const inventoryRequirementsQuery = useQuery({
    queryKey: ["inventory-requirements", businessId, leadQuery.data?.id],
    queryFn: () => getLeadInventoryRequirements(businessId, leadQuery.data?.id ?? "", token),
    enabled: Boolean(businessId && token && leadQuery.data?.id && activeBusiness?.enabledModules.includes("inventory")),
  });

  const mappedAdditionalInfoLabels = useMemo(
    () =>
      Object.keys(activeBusiness?.sheetColumnMapping ?? {})
        .filter((key) => key.startsWith("additional_info:"))
        .map((key) => key.replace("additional_info:", "").trim())
        .filter(Boolean),
    [activeBusiness?.sheetColumnMapping],
  );

  useEffect(() => {
    if (!leadQuery.data) {
      return;
    }

    setName(leadQuery.data.name ?? "");
    setPhone(leadQuery.data.phone ?? "");
    setStatus(leadQuery.data.status);
    setAssignedTo(leadQuery.data.assigned_to ?? "");
    setEmail(leadQuery.data.email ?? "");
    setCity(leadQuery.data.city ?? "");
    setEventType(leadQuery.data.event_type ?? "");
    setContractValue(leadQuery.data.contract_value ? String(leadQuery.data.contract_value) : "");
    setNotes(leadQuery.data.notes ?? "");
    setEventDate(toDateInputValue(leadQuery.data.event_date));
    setActivityHistory(
      (leadQuery.data.call_history ?? [])
        .map((entry, index) => ({
          id: String(entry.id ?? `${index}-${entry.created_at ?? ""}`),
          type: String(entry.type ?? "note"),
          body: String(entry.body ?? ""),
          created_at: String(entry.created_at ?? leadQuery.data.updated_at),
        }))
        .filter((entry) => entry.body.trim() !== ""),
    );
    setAdditionalInfo(
      [
        ...mappedAdditionalInfoLabels.map((label) => {
          const matchingEntry = Object.entries(leadQuery.data.custom_fields ?? {}).find(
            ([key]) => getDisplayAdditionalInfoKey(key) === label,
          );
          return {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            key: label,
            value: matchingEntry ? String(matchingEntry[1] ?? "") : "",
            originalKey: matchingEntry?.[0] ?? label,
          };
        }),
        ...Object.entries(leadQuery.data.custom_fields ?? {})
          .filter(([key]) => isVisibleAdditionalInfoKey(key))
          .filter(([key]) => !mappedAdditionalInfoLabels.includes(getDisplayAdditionalInfoKey(key)))
          .map(([key, value]) => ({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            key: getDisplayAdditionalInfoKey(key),
            value: String(value ?? ""),
            originalKey: key,
          })),
      ],
    );
    setStatusText("Lead details loaded.");
  }, [leadQuery.data, mappedAdditionalInfoLabels]);

  const memberOptions = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...((membersQuery.data ?? []).map((member) => ({
        value: member.user_id,
        label: `${member.display_name} - ${member.role}`,
      })) ?? []),
    ],
    [membersQuery.data],
  );
  const leadStatusOptions = useMemo(
    () =>
      ((leadStatusesQuery.data ?? []).map((item) => ({
        value: item.name,
        label: item.name.replace(/_/g, " "),
      })) ?? []),
    [leadStatusesQuery.data],
  );
  const currentRole = useMemo(
    () => currentRoleProp ?? (membersQuery.data ?? []).find((member) => member.user_id === currentUser?.id)?.role ?? "member",
    [currentRoleProp, currentUser?.id, membersQuery.data],
  );
  const currentPermissions = currentPermissionsProp ?? (membersQuery.data ?? []).find((member) => member.user_id === currentUser?.id)?.custom_permissions ?? [];
  const canViewFinance = canViewDashboard(currentRole, currentPermissions);
  const canManageLeadAssignment = canAssignLeads(currentRole, currentPermissions);
  const canDeleteLead = canDeleteLeadsPermission(currentRole, currentPermissions);
  const canManageLeadExpenses = canManageExpensesPermission(currentRole, currentPermissions);
  const canViewLeadAttachments = canViewAttachments(currentRole, currentPermissions);
  const canManageAttachments = canManageAttachmentsPermission(currentRole, currentPermissions);
  const inventoryEnabled = activeBusiness?.enabledModules.includes("inventory") ?? false;
  const canViewLeadInventory = inventoryEnabled && canViewInventory(currentRole, currentPermissions);
  const canManageLeadInventory = inventoryEnabled && canManageInventoryPermission(currentRole, currentPermissions);

  function openWorkflowActionModal(type: "activity" | "task") {
    setWorkflowActionType(type);
    setIsWorkflowActionModalOpen(true);
  }

  function updateAdditionalInfoRow(index: number, field: "key" | "value", value: string) {
    setAdditionalInfo((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addAdditionalInfoRow() {
    setAdditionalInfo((current) => [...current, makeAdditionalInfoRow()]);
  }

  function removeAdditionalInfoRow(index: number) {
    setAdditionalInfo((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function addActivityEntry() {
    const body = activityDraftBody.trim();
    if (!body) {
      return;
    }

    setActivityHistory((current) => [
      makeActivityEntry(activityDraftType, body),
      ...current,
    ]);
    setActivityDraftBody("");
    setActivityDraftType("note");
  }

  async function handleCreateTask() {
    const title = taskTitle.trim();
    if (!title || !leadQuery.data?.id) {
      return;
    }
    try {
      const task = await createTask(
        {
          business_id: businessId,
          lead_id: leadQuery.data.id,
          title,
          deadline: taskDeadline ? new Date(taskDeadline).toISOString() : null,
          assigned_to: assignedTo || null,
        },
        token,
      );
      setTaskTitle("");
      setTaskDeadline("");
      setStatusText(`Task created: ${task.title}`);
      await queryClient.invalidateQueries({ queryKey: ["tasks", businessId, leadQuery.data.id] });
      await tasksQuery.refetch();
    } catch {
      setStatusText("Could not create a lead task. Check backend access.");
    }
  }

  async function createLeadTaskIfMissing(title: string, description: string) {
    if (!leadQuery.data?.id) {
      return;
    }

    const alreadyExists = leadTasks.some((task) => !task.done_at && task.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (alreadyExists) {
      return;
    }

    await createTask(
      {
        business_id: businessId,
        lead_id: leadQuery.data.id,
        title,
        description,
        assigned_to: assignedTo || null,
      },
      token,
    );
  }

  async function handleCreateInventoryTask() {
    if (!leadQuery.data?.id) {
      return;
    }

    const reservedItems = leadInventorySummary.filter((item) => item.reserved > 0);
    if (reservedItems.length === 0) {
      setInventoryStatus("Reserve at least one item before creating a prep task.");
      return;
    }

    const taskLabel =
      reservedItems.length === 1
        ? `Prepare reserved item: ${reservedItems[0].name}`
        : `Prepare ${reservedItems.length} reserved inventory items`;

    try {
      const task = await createTask(
        {
          business_id: businessId,
          lead_id: leadQuery.data.id,
          title: taskLabel,
          description: reservedItems
            .map((item) => `${item.name}: ${item.reserved} ${item.unit} reserved`)
            .join("; "),
          assigned_to: assignedTo || null,
        },
        token,
      );
      setInventoryStatus(`Inventory task created: ${task.title}`);
      await queryClient.invalidateQueries({ queryKey: ["tasks", businessId, leadQuery.data.id] });
      await tasksQuery.refetch();
    } catch {
      setInventoryStatus("Could not create the inventory preparation task.");
    }
  }

  async function handleMarkTaskDone(taskId: string) {
    try {
      await markTaskDone(taskId, businessId, token);
      setStatusText("Lead task marked as done.");
      await queryClient.invalidateQueries({ queryKey: ["tasks", businessId, leadQuery.data?.id] });
      await tasksQuery.refetch();
    } catch {
      setStatusText("Could not update the lead task.");
    }
  }

  async function handleDeleteLead() {
    try {
      setIsSaving(true);
      await deleteLead(businessId, leadUid, token);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads", businessId] }),
        queryClient.invalidateQueries({ queryKey: ["tasks", businessId] }),
        queryClient.invalidateQueries({ queryKey: ["incomes", businessId] }),
        queryClient.invalidateQueries({ queryKey: ["expenses", businessId] }),
      ]);
      setIsLeadMenuOpen(false);
      onClose();
    } catch {
      setStatusText("Could not delete this lead.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAttachmentUpload(file: File | null) {
    if (!file) {
      return;
    }
    try {
      setIsUploadingAttachment(true);
      const uploaded = await uploadAttachment(businessId, leadUid, file, token);
      setAttachmentStatus(`Attachment uploaded: ${uploaded.original_name}`);
      await queryClient.invalidateQueries({ queryKey: ["attachments", businessId, leadUid] });
      await attachmentsQuery.refetch();
    } catch (error) {
      setAttachmentStatus(getUploadErrorMessage(error));
    } finally {
      setIsUploadingAttachment(false);
    }
  }

  async function handleAttachmentDelete(attachmentId: string) {
    try {
      const result = await deleteAttachment(businessId, leadUid, attachmentId, token);
      setAttachmentStatus(result.message);
      await queryClient.invalidateQueries({ queryKey: ["attachments", businessId, leadUid] });
      await attachmentsQuery.refetch();
    } catch {
      setAttachmentStatus("Could not delete attachment.");
    }
  }

  async function handleCreateRestockInventoryTask() {
    if (!leadQuery.data?.id || totalMissingUnitsForLead <= 0) {
      setInventoryStatus("There is no missing inventory to restock.");
      return;
    }

    const missingLines = inventoryReadinessRows
      .filter((item) => item.missing > 0)
      .map((item) => `${item.itemName}: ${item.missing} ${item.unit} missing`);

    try {
      await createLeadTaskIfMissing("Restock missing inventory for this lead", missingLines.join("; "));
      setInventoryStatus("Restock task created for this lead.");
      await queryClient.invalidateQueries({ queryKey: ["tasks", businessId, leadQuery.data.id] });
      await tasksQuery.refetch();
    } catch {
      setInventoryStatus("Could not create the inventory restock task.");
    }
  }

  async function handleSave() {
    if (!token) {
      return;
    }

    try {
      setIsSaving(true);
      const cleanedAdditionalInfo = Object.fromEntries(
        additionalInfo
          .map((item) => ({
            key: item.key.trim(),
            value: item.value.trim(),
            originalKey: item.originalKey,
          }))
          .filter((item) => item.key && item.value)
          .map((item) => [
            item.originalKey && !item.originalKey.startsWith(manualAdditionalInfoPrefix)
              ? item.originalKey
              : `${manualAdditionalInfoPrefix}${item.key}`,
            item.value,
          ] as const),
      );
      const nextActivityHistory =
        lead?.status && lead.status !== status
          ? [
              makeActivityEntry(
                "status_change",
                `Status moved from ${lead.status.replace(/_/g, " ")} to ${status.replace(/_/g, " ")}.`,
              ),
              ...activityHistory,
            ]
          : activityHistory;

      const updatedLead = await updateLead(
        businessId,
        leadUid,
        {
          name,
          phone,
          email,
          city,
          event_type: eventType,
          ...(canManageLeadExpenses ? { contract_value: contractValue } : {}),
          status,
          ...(canManageLeadAssignment ? { assigned_to: assignedTo || null } : {}),
          notes,
          event_date: eventDate || null,
          call_history: nextActivityHistory,
          custom_fields: cleanedAdditionalInfo,
        },
        token,
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lead", businessId, leadUid] }),
        queryClient.invalidateQueries({ queryKey: ["leads", businessId] }),
      ]);
      setStatusText(`Saved. Lead ${updatedLead.uid} is now up to date.`);
    } catch {
      setStatusText("Could not save lead changes. Check backend logs and business access.");
    } finally {
      setIsSaving(false);
    }
  }

  const lead = leadQuery.data;
  const originalStatus = lead?.status ?? "new";
  const leadTasks = tasksQuery.data?.items ?? [];
  const leadExpenses = expensesQuery.data?.items ?? [];
  const leadIncomes = incomesQuery.data?.items ?? [];
  const leadExpenseTotal = leadExpenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const leadIncomeTotal = leadIncomes.reduce((sum, income) => sum + Number(income.amount ?? 0), 0);
  const openLeadTasks = leadTasks.filter((task) => !task.done_at);
  const attachments = attachmentsQuery.data?.items ?? [];
  const inventoryItems = inventoryItemsQuery.data?.items ?? [];
  const leadInventoryMovements = inventoryMovementsQuery.data?.items ?? [];
  const inventoryRequirements = inventoryRequirementsQuery.data?.items ?? [];
  const inventoryItemMap = useMemo(
    () => Object.fromEntries(inventoryItems.map((item) => [item.id, item])),
    [inventoryItems],
  );
  const leadInventorySummary = useMemo(() => {
    const summary = new Map<
      string,
      {
        itemId: string;
        name: string;
        unit: string;
        reserved: number;
        used: number;
      }
    >();

    leadInventoryMovements.forEach((movement) => {
      const item = inventoryItemMap[movement.item_id];
      if (!item) {
        return;
      }
      const current = summary.get(movement.item_id) ?? {
        itemId: movement.item_id,
        name: item.name,
        unit: item.unit,
        reserved: 0,
        used: 0,
      };
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

    return Array.from(summary.values()).filter((item) => item.reserved > 0 || item.used > 0);
  }, [inventoryItemMap, leadInventoryMovements]);
  const inventoryReadinessRows = inventoryRequirements.map((requirement) => {
    const item = inventoryItemMap[requirement.item_id];
    const summary = leadInventorySummary.find((entry) => entry.itemId === requirement.item_id);
    const required = Number(requirement.required_quantity ?? 0);
    const reserved = Number(summary?.reserved ?? 0);
    const used = Number(summary?.used ?? 0);
    const missing = Math.max(0, required - reserved - used);
    const ready = missing <= 0;
    return {
      ...requirement,
      itemName: item?.name ?? "Inventory item",
      unit: item?.unit ?? "pcs",
      required,
      reserved,
      used,
      missing,
      ready,
    };
  });
  const totalRequiredUnitsForLead = inventoryReadinessRows.reduce((sum, item) => sum + item.required, 0);
  const totalReservedUnitsForLead = inventoryReadinessRows.reduce((sum, item) => sum + item.reserved, 0);
  const totalUsedUnitsForLead = inventoryReadinessRows.reduce((sum, item) => sum + item.used, 0);
  const totalMissingUnitsForLead = inventoryReadinessRows.reduce((sum, item) => sum + item.missing, 0);
  const hasInventoryPrepTask = leadTasks.some(
    (task) => !task.done_at && /prepare reserved|reserved inventory|prepare inventory|restock missing inventory/i.test(task.title),
  );
  const inventoryReadinessLabel =
    totalRequiredUnitsForLead <= 0
      ? "No inventory plan yet"
      : totalMissingUnitsForLead > 0
        ? "Some required stock is still missing"
        : totalReservedUnitsForLead > 0 && !hasInventoryPrepTask
          ? "Reserved stock is ready for preparation"
          : totalUsedUnitsForLead > 0
            ? "Lead already has stock marked as used"
            : "Inventory is aligned with this lead"
  const inventoryReadinessSupport =
    totalRequiredUnitsForLead <= 0
      ? "Inventory for this lead is managed from the Inventory module."
      : totalMissingUnitsForLead > 0
        ? `${totalMissingUnitsForLead} units are still missing from the current reservation plan.`
        : totalUsedUnitsForLead > 0
          ? `${totalUsedUnitsForLead} units already used and ${Math.max(0, totalReservedUnitsForLead)} still reserved.`
          : `${totalReservedUnitsForLead} units are already reserved for this lead.`
  const currentStatusConfig = (leadStatusesQuery.data ?? []).find((item) => item.name === status);
  const workflowRequirements = useMemo(
    () =>
      buildWorkflowRequirements({
        statusConfig: currentStatusConfig,
        hasOwner: Boolean(assignedTo),
        openTaskCount: openLeadTasks.length,
        hasNotes: Boolean(notes.trim()),
        missingInventoryUnits: totalRequiredUnitsForLead > 0 ? totalMissingUnitsForLead : 0,
      }),
    [
      assignedTo,
      currentStatusConfig,
      notes,
      openLeadTasks.length,
      totalMissingUnitsForLead,
      totalRequiredUnitsForLead,
    ],
  );
  const assignedMember = (membersQuery.data ?? []).find((member) => member.user_id === assignedTo) ?? null;
  const activityFeed = useMemo(
    () =>
      [
        ...activityHistory.map((entry) => ({
          id: `activity-${entry.id}`,
          kind: "activity" as const,
          title: entry.type.replace("_", " "),
          body: entry.body,
          timestamp: entry.created_at,
          actionLabel: null,
          action: null,
          badge: entry.type === "follow_up" ? "Follow-up" : entry.type === "call" ? "Call" : "Note",
        })),
        ...leadTasks.map((task) => ({
          id: `task-${task.id}`,
          kind: "task" as const,
          title: task.title,
          body: task.description || (task.done_at ? "Task completed." : "Task linked to this lead."),
          timestamp: task.done_at ?? task.deadline ?? task.created_at,
          actionLabel: task.done_at ? null : "Mark done",
          action: task.done_at ? null : () => void handleMarkTaskDone(task.id),
          badge: task.done_at ? "Done" : "Task",
        })),
      ].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()),
    [activityHistory, leadTasks],
  );
  const visibleStatusText = statusText !== "Lead details loaded." ? statusText : null;
  const primaryWorkflowHint = workflowRequirements[0] ?? null;
  const heroName = name || lead?.name || "Unnamed lead";
  const heroInitials = heroName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "L";
  const sourceLabel = (lead?.source || "Manual").replace(/_/g, " ");
  const headerStatusColor = currentStatusConfig?.color ?? "#a855f7";
  const quickInfoPills = [
    { key: "phone", label: phone || "Phone not provided" },
    { key: "email", label: email || "Email not provided" },
    {
      key: "event",
      label: eventType || eventDate ? `${eventType || "Event"}${eventDate ? ` · ${formatDateTime(eventDate, false)}` : ""}` : "Event not set",
    },
  ];
  const historyEntries = useMemo(
    () =>
      [
        ...activityFeed.map((item) => ({
          id: item.id,
          kind: item.kind,
          title: item.title,
          body: item.body,
          timestamp: item.timestamp,
          badge: item.badge,
          actionLabel: item.actionLabel,
          action: item.action,
          amountLabel: null as string | null,
        })),
        ...leadIncomes.map((income) => ({
          id: `income-${income.id}`,
          kind: "income" as const,
          title: income.title,
          body: income.description || "Payment recorded.",
          timestamp: income.date,
          badge: "Income",
          actionLabel: null,
          action: null,
          amountLabel: `+ ${income.amount} PLN`,
        })),
        ...leadExpenses.map((expense) => ({
          id: `expense-${expense.id}`,
          kind: "expense" as const,
          title: expense.title,
          body: expense.description || "Cost recorded in dashboard.",
          timestamp: expense.date,
          badge: expense.expense_type === "recurring" ? "Recurring cost" : "Expense",
          actionLabel: null,
          action: null,
          amountLabel: `- ${expense.amount} PLN`,
        })),
      ].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()),
    [activityFeed, leadExpenses, leadIncomes],
  );

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <span className="section-heading__eyebrow">{businessName}</span>
          <h2>Lead details</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onClose}>
          Back
        </button>
      </div>

      {leadQuery.isLoading ? (
        <article className="panel">
          <h3>Loading live lead</h3>
          <p>Pulling the selected lead from the backend.</p>
          <Spinner label="Loading lead details..." />
        </article>
      ) : leadQuery.isError || !lead ? (
        <article className="panel">
          <h3>Could not load this lead</h3>
          <p>The selected lead could not be opened right now.</p>
        </article>
      ) : (
        <article className="panel lead-detail__panel lead-detail-view">
          <div className="lead-detail-view__topbar">
            <button type="button" className="ghost-button" onClick={onClose}>
              ← Back
            </button>
            <div className="toggle-group">
              <button type="button" className="primary-button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button type="button" className="ghost-button" onClick={() => setIsLeadMenuOpen(true)}>
                ⋯
              </button>
            </div>
          </div>

          <div className="lead-detail-view__hero">
            <span className="lead-detail-view__avatar">{heroInitials}</span>
            <div className="lead-detail-view__hero-copy">
              <h3>{heroName}</h3>
              <p>
                {lead.uid} · {sourceLabel}
              </p>
            </div>
          </div>

          <div className="lead-detail-view__status-strip">
            {(leadStatusesQuery.data ?? []).map((statusItem) => {
              const isActive = statusItem.name === status;
              return (
                <button
                  key={statusItem.name}
                  type="button"
                  className={isActive ? "lead-detail-view__status-item lead-detail-view__status-item--active" : "lead-detail-view__status-item"}
                  style={isActive ? { borderBottomColor: statusItem.color ?? headerStatusColor, color: "#f8fafc" } : undefined}
                  onClick={() => setStatus(statusItem.name)}
                >
                  {statusItem.name.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>

          <div className="lead-detail-view__quick-pills">
            {quickInfoPills.map((pill) => (
              <span key={pill.key} className="lead-detail-view__quick-pill">
                {pill.label}
              </span>
            ))}
          </div>

          <div className="lead-detail-view__quick-actions">
            <button
              type="button"
              className="lead-detail-view__quick-action"
              onClick={() => {
                setActivityDraftType("call");
                setActivityDraftBody("");
                openWorkflowActionModal("activity");
              }}
            >
              <span>☎</span>
              <strong>Call</strong>
            </button>
            <button
              type="button"
              className="lead-detail-view__quick-action"
              onClick={() => {
                setTaskTitle("Follow up with the client");
                openWorkflowActionModal("task");
              }}
            >
              <span>✓</span>
              <strong>Task</strong>
            </button>
            <button
              type="button"
              className="lead-detail-view__quick-action"
              onClick={() => {
                setActivityDraftType("note");
                setActivityDraftBody("");
                openWorkflowActionModal("activity");
              }}
            >
              <span>✎</span>
              <strong>Note</strong>
            </button>
            <button
              type="button"
              className="lead-detail-view__quick-action"
              onClick={() => {
                if (canViewLeadInventory && onOpenInventory) {
                  onOpenInventory();
                } else {
                  setIsDetailsModalOpen(true);
                }
              }}
            >
              <span>{canViewLeadInventory ? "[]" : "i"}</span>
              <strong>{canViewLeadInventory ? "Inventory" : "Details"}</strong>
            </button>
          </div>

          {primaryWorkflowHint ? (
            <p
              className={`lead-detail__workflow-hint${
                primaryWorkflowHint.tone === "ok"
                  ? " lead-detail__workflow-hint--ok"
                  : primaryWorkflowHint.tone === "soft"
                    ? " lead-detail__workflow-hint--soft"
                    : ""
              }`}
            >
              {primaryWorkflowHint.message}
            </p>
          ) : null}
          {visibleStatusText ? <p className="lead-detail__subline">{visibleStatusText}</p> : null}

          <div className="lead-detail__content">
            <section className="lead-detail__section lead-detail__section--flat">
              <div className="lead-detail__section-heading">
                <div>
                  <span className="section-heading__eyebrow">Contact & deal</span>
                </div>
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    setIsEditingDetails(true);
                    setIsDetailsModalOpen(true);
                  }}
                >
                  Edit
                </button>
              </div>

              <div className="lead-detail__form-grid">
                <SelectField label="Status" value={status} onChange={setStatus} options={leadStatusOptions} />
                <SelectField
                  label="Assigned to"
                  value={assignedTo}
                  onChange={setAssignedTo}
                  options={memberOptions}
                  searchable
                  searchPlaceholder="Search team members..."
                  disabled={!canManageLeadAssignment}
                />
              </div>

              <div className="lead-detail-view__row-list">
                <div className="lead-detail-view__row"><span>Name</span><strong>{heroName}</strong></div>
                <div className="lead-detail-view__row"><span>Phone</span><strong>{phone || "Not provided"}</strong></div>
                <div className="lead-detail-view__row"><span>Email</span><strong>{email || "Not provided"}</strong></div>
                <div className="lead-detail-view__row"><span>City</span><strong>{city || "Not set"}</strong></div>
                <div className="lead-detail-view__row"><span>Event type</span><strong>{eventType || "Not set"}</strong></div>
                <div className="lead-detail-view__row"><span>Event date</span><strong>{eventDate ? formatDateTime(eventDate, false) : "Not set"}</strong></div>
                <div className="lead-detail-view__row"><span>Deal value</span><strong>{contractValue ? `${contractValue} PLN` : "Pending"}</strong></div>
                <div className="lead-detail-view__row"><span>Assigned to</span><strong>{assignedMember?.display_name || "Unassigned"}</strong></div>
              </div>
            </section>

            <section className="lead-detail__section lead-detail__section--flat">
              <div className="lead-detail__section-heading">
                <div>
                  <span className="section-heading__eyebrow">Notes</span>
                </div>
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    setActivityDraftType("note");
                    setActivityDraftBody("");
                    openWorkflowActionModal("activity");
                  }}
                >
                  + Add note
                </button>
              </div>

              <label className="input-field">
                <textarea
                  className="input-field__control input-field__control--textarea"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Internal context, special requests, loss reason..."
                />
              </label>
              {!notes.trim() ? (
                <article className="panel panel--subtle">
                  <p>No summary note yet.</p>
                </article>
              ) : null}
            </section>

            <section className="lead-detail__section lead-detail__section--flat">
              <div className="lead-detail__section-heading">
                <div>
                  <span className="section-heading__eyebrow">History</span>
                </div>
              </div>

              {tasksQuery.isLoading || incomesQuery.isLoading || expensesQuery.isLoading ? <Spinner label="Loading history..." /> : null}
              {!tasksQuery.isLoading && !incomesQuery.isLoading && !expensesQuery.isLoading && historyEntries.length === 0 ? (
                <article className="panel panel--subtle">
                  <p>No history yet.</p>
                </article>
              ) : null}
              {!tasksQuery.isLoading && !incomesQuery.isLoading && !expensesQuery.isLoading ? (
                <div className="stack-list stack-list--tight">
                  {historyEntries.map((item) => (
                    <article key={item.id} className="panel panel--subtle activity-item">
                      <div className="activity-item__topline">
                        <strong>{item.title}</strong>
                        <span className="lead-card__meta-label">
                          {formatDateTime(item.timestamp)}
                        </span>
                      </div>
                      <p>{item.body}</p>
                      <div className="toggle-group">
                        <span className={`chip${item.badge === "Done" ? " chip--active" : ""}`}>{item.badge}</span>
                        {item.amountLabel ? (
                          <span className={`chip ${item.kind === "expense" ? "chip--muted" : "chip--active"}`}>{item.amountLabel}</span>
                        ) : null}
                        {item.actionLabel && item.action && item.actionLabel !== "Mark done" ? (
                          <button type="button" className="chip" onClick={item.action}>
                            {item.actionLabel}
                          </button>
                        ) : null}
                      </div>
                      {item.badge === "Task" && item.actionLabel === "Mark done" && item.action ? (
                        <div className="toggle-group">
                          <button type="button" className="chip" onClick={item.action}>
                            Mark done
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}
            </section>

            {canViewFinance ? (
              <section className="lead-detail__section lead-detail__section--flat">
                <div className="lead-detail__section-heading">
                  <div>
                    <span className="section-heading__eyebrow">Financials</span>
                  </div>
                  <span className="lead-card__tag">Dashboard-managed</span>
                </div>

                <div className="lead-detail__meta-strip">
                  <div className="lead-detail__meta-item">
                    <span className="lead-card__meta-label">Deal value</span>
                    <strong>{contractValue ? `${contractValue} PLN` : "Pending"}</strong>
                  </div>
                  <div className="lead-detail__meta-item">
                    <span className="lead-card__meta-label">Lead-linked income</span>
                    <strong>{leadIncomeTotal ? `${leadIncomeTotal} PLN` : "Shown in history"}</strong>
                  </div>
                  <div className="lead-detail__meta-item">
                    <span className="lead-card__meta-label">Linked costs</span>
                    <strong>{leadExpenseTotal ? `${leadExpenseTotal} PLN in dashboard` : "Shown in history"}</strong>
                  </div>
                </div>
                <article className="panel panel--subtle">
                  <p>Record income and costs in Dashboard. Lead-linked money still appears here in the client history.</p>
                </article>
              </section>
            ) : null}

            {canViewLeadInventory ? (
              <section className="lead-detail__section lead-detail__section--flat">
                <div className="lead-detail__section-heading">
                  <div>
                    <span className="section-heading__eyebrow">Inventory</span>
                  </div>
                  <span className="lead-card__tag">{inventoryReadinessRows.length ? `${inventoryReadinessRows.length} items` : "No plan"}</span>
                </div>

                <article className="panel panel--subtle">
                  <div className="lead-detail__section-heading">
                    <div>
                      <strong>{inventoryReadinessLabel}</strong>
                      <p>{inventoryReadinessSupport}</p>
                    </div>
                    <div className="toggle-group">
                      {canManageLeadInventory && totalMissingUnitsForLead > 0 && !hasInventoryPrepTask ? (
                        <button type="button" className="chip" onClick={() => void handleCreateRestockInventoryTask()}>
                          Create restock task
                        </button>
                      ) : null}
                      {canManageLeadInventory &&
                      totalMissingUnitsForLead <= 0 &&
                      totalReservedUnitsForLead > 0 &&
                      !hasInventoryPrepTask ? (
                        <button type="button" className="chip" onClick={() => void handleCreateInventoryTask()}>
                          Create prep task
                        </button>
                      ) : null}
                      {onOpenInventory ? (
                        <button type="button" className="ghost-button" onClick={onOpenInventory}>
                          Open in Inventory
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="toggle-group">
                    <span className="chip">{totalRequiredUnitsForLead} required</span>
                    <span className="chip">{totalReservedUnitsForLead} reserved</span>
                    {totalUsedUnitsForLead > 0 ? <span className="chip">{totalUsedUnitsForLead} used</span> : null}
                    {totalMissingUnitsForLead > 0 ? (
                      <span className="chip">{totalMissingUnitsForLead} missing</span>
                    ) : totalRequiredUnitsForLead > 0 ? (
                      <span className="chip chip--active">Ready</span>
                    ) : null}
                  </div>
                </article>

                {inventoryStatus ? <p className="settings-status">{inventoryStatus}</p> : null}

                {inventoryRequirementsQuery.isLoading || inventoryMovementsQuery.isLoading ? (
                  <Spinner label="Loading lead inventory..." />
                ) : null}
              </section>
            ) : null}

          </div>
        </article>
      )}

      {isLeadMenuOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true" onClick={() => setIsLeadMenuOpen(false)}>
          <article className="modal-card modal-card--info" onClick={(event) => event.stopPropagation()}>
            <div className="lead-detail__section-heading">
              <div>
                <h3>Lead actions</h3>
                <p>Open details or jump into the next operational step.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setIsLeadMenuOpen(false)}>
                Close
              </button>
            </div>
            <div className="business-switcher-sheet">
              <button
                type="button"
                className="business-switcher-sheet__item"
                onClick={() => {
                  setIsLeadMenuOpen(false);
                  setIsEditingDetails(true);
                  setIsDetailsModalOpen(true);
                }}
              >
                <div className="business-switcher-sheet__copy">
                  <strong>Edit details</strong>
                  <span>Client, deal, owner, and extra fields.</span>
                </div>
              </button>
              {canViewLeadInventory && onOpenInventory ? (
                <button
                  type="button"
                  className="business-switcher-sheet__item"
                  onClick={() => {
                    setIsLeadMenuOpen(false);
                    onOpenInventory();
                  }}
                >
                  <div className="business-switcher-sheet__copy">
                    <strong>Open inventory</strong>
                    <span>Manage stock for this lead from the main inventory module.</span>
                  </div>
                </button>
              ) : null}
              {canDeleteLead ? (
                <button
                  type="button"
                  className="business-switcher-sheet__item"
                  onClick={() => void handleDeleteLead()}
                >
                  <div className="business-switcher-sheet__copy">
                    <strong>Delete lead</strong>
                    <span>This removes the lead from the CRM.</span>
                  </div>
                </button>
              ) : null}
            </div>
          </article>
        </div>
      ) : null}

      {isWorkflowActionModalOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <article className="modal-card lead-detail__details-modal">
            <div className="lead-detail__section-heading">
              <div>
                <h3>{workflowActionType === "activity" ? "Add activity" : "Add task"}</h3>
                <p>
                  {workflowActionType === "activity"
                    ? "Log a note, call, or follow-up without stretching the lead screen."
                    : "Create the next action for this lead in a compact sheet."}
                </p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setIsWorkflowActionModalOpen(false)}>
                Close
              </button>
            </div>

            {workflowActionType === "activity" ? (
              <div className="stack-list stack-list--tight">
                <SelectField
                  label="Activity type"
                  value={activityDraftType}
                  onChange={setActivityDraftType}
                  options={[
                    { value: "note", label: "Note" },
                    { value: "call", label: "Call" },
                    { value: "follow_up", label: "Follow-up" },
                  ]}
                />
                <label className="input-field">
                  <span className="select-field__label">Activity text</span>
                  <input
                    className="input-field__control"
                    value={activityDraftBody}
                    onChange={(event) => setActivityDraftBody(event.target.value)}
                    placeholder="Summarize the call, note, or next step..."
                  />
                </label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      addActivityEntry();
                      setIsWorkflowActionModalOpen(false);
                    }}
                  >
                    Add activity
                  </button>
                  <button type="button" className="ghost-button" onClick={() => setIsWorkflowActionModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="stack-list stack-list--tight">
                <label className="input-field">
                  <span className="select-field__label">Task</span>
                  <input
                    className="input-field__control"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    placeholder="Call back, prepare offer, send invoice..."
                  />
                </label>
                <label className="input-field">
                  <span className="select-field__label">Deadline</span>
                  <input
                    type="datetime-local"
                    className="input-field__control"
                    value={taskDeadline}
                    onChange={(event) => setTaskDeadline(event.target.value)}
                  />
                </label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={async () => {
                      await handleCreateTask();
                      setIsWorkflowActionModalOpen(false);
                    }}
                  >
                    Add task
                  </button>
                  <button type="button" className="ghost-button" onClick={() => setIsWorkflowActionModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </article>
        </div>
      ) : null}

      {lead && isDetailsModalOpen ? (
        <div className="modal-shell" onClick={() => setIsDetailsModalOpen(false)}>
          <article className="modal-card lead-detail__details-modal" onClick={(event) => event.stopPropagation()}>
            <div className="lead-detail__section-heading">
              <div>
                <span className="section-heading__eyebrow">Lead details</span>
                <h3>{name || "Unnamed lead"}</h3>
              </div>
              <div className="toggle-group">
                <button type="button" className="chip" onClick={() => setIsEditingDetails((current) => !current)}>
                  {isEditingDetails ? "Stop editing" : "Edit"}
                </button>
                <button type="button" className="ghost-button" onClick={() => setIsDetailsModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>

            <div className="lead-detail__details-list">
              <div className="lead-detail__details-row">
                <span className="lead-card__meta-label">Client name</span>
                {isEditingDetails ? (
                  <input className="input-field__control" value={name} onChange={(event) => setName(event.target.value)} />
                ) : (
                  <strong>{name || "Not set"}</strong>
                )}
              </div>
              <div className="lead-detail__details-row">
                <span className="lead-card__meta-label">Phone</span>
                {isEditingDetails ? (
                  <input className="input-field__control" value={phone} onChange={(event) => setPhone(event.target.value)} />
                ) : (
                  <strong>{phone || "Not provided"}</strong>
                )}
              </div>
              <div className="lead-detail__details-row">
                <span className="lead-card__meta-label">Email</span>
                {isEditingDetails ? (
                  <input type="email" className="input-field__control" value={email} onChange={(event) => setEmail(event.target.value)} />
                ) : (
                  <strong>{email || "Not provided"}</strong>
                )}
              </div>
              <div className="lead-detail__details-row">
                <span className="lead-card__meta-label">Status</span>
                {isEditingDetails ? (
                  <SelectField label="" value={status} onChange={setStatus} options={leadStatusOptions} />
                ) : (
                  <strong>{status.replace(/_/g, " ")}</strong>
                )}
              </div>
              <div className="lead-detail__details-row">
                <span className="lead-card__meta-label">Owner</span>
                {isEditingDetails ? (
                  <SelectField
                    label=""
                    value={assignedTo}
                    onChange={setAssignedTo}
                    options={memberOptions}
                    searchable
                    searchPlaceholder="Search team members..."
                    disabled={!canManageLeadAssignment}
                  />
                ) : (
                  <strong>{assignedMember?.display_name || "Unassigned"}</strong>
                )}
              </div>
              <div className="lead-detail__details-row">
                <span className="lead-card__meta-label">Type</span>
                {isEditingDetails ? (
                  <input className="input-field__control" value={eventType} onChange={(event) => setEventType(event.target.value)} />
                ) : (
                  <strong>{eventType || "Not set"}</strong>
                )}
              </div>
              <div className="lead-detail__details-row">
                <span className="lead-card__meta-label">City</span>
                {isEditingDetails ? (
                  <input className="input-field__control" value={city} onChange={(event) => setCity(event.target.value)} />
                ) : (
                  <strong>{city || "Not set"}</strong>
                )}
              </div>
              <div className="lead-detail__details-row">
                <span className="lead-card__meta-label">Event date</span>
                {isEditingDetails ? (
                  <input type="date" className="input-field__control" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
                ) : (
                  <strong>{eventDate ? formatDateTime(eventDate, false) : "Not set"}</strong>
                )}
              </div>
              {canViewFinance ? (
                <div className="lead-detail__details-row">
                  <span className="lead-card__meta-label">Deal value</span>
                  {isEditingDetails ? (
                    <input
                      className="input-field__control"
                      inputMode="decimal"
                      value={contractValue}
                      onChange={(event) => setContractValue(event.target.value)}
                    />
                  ) : (
                    <strong>{contractValue ? `${contractValue} PLN` : "Pending"}</strong>
                  )}
                </div>
              ) : null}
              <div className="lead-detail__details-row">
                <span className="lead-card__meta-label">Source</span>
                <strong>{lead.source}</strong>
              </div>
              <div className="lead-detail__details-row">
                <span className="lead-card__meta-label">Last update</span>
                <strong>{formatDateTime(lead.updated_at)}</strong>
              </div>
            </div>

            <label className="input-field">
              <span className="select-field__label">Notes</span>
              <textarea
                className="input-field__control input-field__control--textarea"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                readOnly={!isEditingDetails}
              />
            </label>

            <div className="lead-detail__modal-section">
              <div className="lead-detail__section-heading">
                <div>
                  <strong>Additional info</strong>
                  <p>Extra client fields stay in the same details flow.</p>
                </div>
                {isEditingDetails ? (
                  <button type="button" className="ghost-button" onClick={addAdditionalInfoRow}>
                    Add field
                  </button>
                ) : null}
              </div>
              <div className="stack-list stack-list--tight">
                {additionalInfo.length === 0 ? (
                  <article className="panel panel--subtle">
                    <p>No additional info yet.</p>
                  </article>
                ) : (
                  additionalInfo.map((item, index) => (
                    <div key={item.id} className="lead-detail__extra-row">
                      <label className="input-field">
                        <span className="select-field__label">Field name</span>
                        <input
                          className="input-field__control"
                          value={item.key}
                          onChange={(event) => updateAdditionalInfoRow(index, "key", event.target.value)}
                          readOnly={!isEditingDetails}
                        />
                      </label>
                      <label className="input-field">
                        <span className="select-field__label">Value</span>
                        <input
                          className="input-field__control"
                          value={item.value}
                          onChange={(event) => updateAdditionalInfoRow(index, "value", event.target.value)}
                          readOnly={!isEditingDetails}
                        />
                      </label>
                      {isEditingDetails ? (
                        <button type="button" className="ghost-button" onClick={() => removeAdditionalInfoRow(index)}>
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            {canViewLeadAttachments ? (
              <div className="lead-detail__modal-section">
                <div className="lead-detail__section-heading">
                  <div>
                    <strong>Gallery</strong>
                    <p>{attachmentFormatsLabel} up to 10 MB.</p>
                  </div>
                </div>
                {attachmentStatus ? <p className="settings-status">{attachmentStatus}</p> : null}
                {attachmentsQuery.isLoading ? <Spinner label="Loading attachments..." /> : null}
                <div className="lead-attachment__gallery">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="lead-attachment__tile-wrap">
                      {isImageAttachment(attachment) ? (
                        <button type="button" className="lead-attachment__tile" onClick={() => setPreviewAttachment(attachment)}>
                          <img
                            src={buildAttachmentContentUrl(leadUid, attachment.id)}
                            alt={attachment.original_name}
                            className="lead-attachment__thumb"
                            loading="lazy"
                          />
                        </button>
                      ) : (
                        <a
                          className="lead-attachment__tile lead-attachment__tile--doc"
                          href={buildAttachmentContentUrl(leadUid, attachment.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>{getAttachmentExtension(attachment.original_name)}</span>
                        </a>
                      )}
                      <span className="lead-attachment__caption">{attachment.original_name}</span>
                      {canManageAttachments ? (
                        <button type="button" className="lead-attachment__delete" onClick={() => void handleAttachmentDelete(attachment.id)}>
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {canManageAttachments ? (
                    <label className="lead-attachment__tile lead-attachment__tile--upload">
                      <input
                        type="file"
                        accept={attachmentAccept}
                        hidden
                        onChange={(event) => {
                          const selectedFile = event.target.files?.[0] ?? null;
                          void handleAttachmentUpload(selectedFile);
                          event.currentTarget.value = "";
                        }}
                      />
                      <span>{isUploadingAttachment ? "..." : "+"}</span>
                    </label>
                  ) : null}
                </div>
                {!attachmentsQuery.isLoading && attachments.length === 0 && !canManageAttachments ? (
                  <article className="panel panel--subtle">
                    <p>No attachments yet.</p>
                  </article>
                ) : null}
              </div>
            ) : null}

            {isEditingDetails ? (
              <div className="toggle-group">
                <button type="button" className="primary-button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            ) : null}
          </article>
        </div>
      ) : null}

      {previewAttachment ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <article className="modal-card lead-attachment__preview-modal">
            <div className="lead-detail__section-heading">
              <div>
                <h3>{previewAttachment.original_name}</h3>
                <p>
                  {formatAttachmentSize(previewAttachment.size_bytes)}
                  {" · "}
                  {previewAttachment.content_type || "image"}
                </p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setPreviewAttachment(null)}>
                Close
              </button>
            </div>

            <img
              src={buildAttachmentContentUrl(leadUid, previewAttachment.id)}
              alt={previewAttachment.original_name}
              className="lead-attachment__preview-full"
            />

            <div className="toggle-group">
              <a
                className="chip"
                href={buildAttachmentContentUrl(leadUid, previewAttachment.id)}
                target="_blank"
                rel="noreferrer"
              >
                Open in browser
              </a>
              <a
                className="ghost-button"
                href={buildAttachmentContentUrl(leadUid, previewAttachment.id, { download: true })}
              >
                Download
              </a>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
