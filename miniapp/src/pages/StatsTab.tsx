import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Repeat2, TrendingUp, Wallet2 } from "lucide-react";

import { getBusinessMembers, getLeadStatuses } from "../api/businesses";
import {
  archiveRecurringExpensePlan,
  createExpense,
  deleteExpense,
  getExpenses,
  getRecurringExpensePlans,
  pauseRecurringExpensePlan,
  resumeRecurringExpensePlan,
  updateExpense,
  type Expense,
} from "../api/expenses";
import { createIncome, deleteIncome, getIncomes, updateIncome } from "../api/incomes";
import { getLeads } from "../api/leads";
import { createTask, getTasks, markTaskDone, updateTask } from "../api/tasks";
import { SelectField } from "../components/SelectField";
import { Spinner } from "../components/Spinner";
import { canManageAllTasks, canManageExpenses as canManageExpensesPermission, canManageOwnTasks } from "../lib/permissions";
import { taskQueryKeys } from "../lib/taskQueryKeys";
import { useAuthStore } from "../store/auth";

type StatsTabProps = {
  businessId: string;
  businessName: string;
  currentRole: string;
  currentPermissions: string[];
  onOpenLead?: (uid: string) => void;
  onOpenTasks?: () => void;
};

type TrendPoint = {
  label: string;
  total: number;
};

type MoneyHistoryItem = {
  id: string;
  kind: "income" | "expense";
  title: string;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  lead_id?: string | null;
  expense_type?: string;
  recurring_interval?: string | null;
};

type CalendarEntry = {
  id: string;
  sourceId?: string;
  kind: "task" | "income" | "expense";
  title: string;
  dateKey: string;
  timestamp: string;
  amount?: number;
  stateLabel: string;
  leadLabel: string;
  leadUid?: string | null;
  assignedTo?: string | null;
  assignedLabel?: string | null;
  isDone?: boolean;
};

function formatDueDate(value?: string | null) {
  if (!value) {
    return "No due date";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("en-GB")} PLN`;
}

function formatShortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatMonthLabel(value: Date) {
  return value.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function formatDateRangeLabel(start: Date, end: Date) {
  return `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
}

function normalizeDateKey(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCalendarDays(anchorMonth: Date) {
  const monthStart = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index) => {
    const value = new Date(gridStart);
    value.setDate(gridStart.getDate() + index);
    return value;
  });
}

function buildWeekDays(anchorDateKey: string) {
  const anchor = new Date(`${anchorDateKey}T12:00:00`);
  const weekStart = new Date(anchor);
  weekStart.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, index) => {
    const value = new Date(weekStart);
    value.setDate(weekStart.getDate() + index);
    return value;
  });
}

function buildLeadTrend(createdAtValues: string[]) {
  const validDates = createdAtValues
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (validDates.length === 0) {
    return [];
  }

  const latest = validDates[validDates.length - 1];
  const points: TrendPoint[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const bucket = new Date(latest.getFullYear(), latest.getMonth() - offset, 1);
    const nextBucket = new Date(latest.getFullYear(), latest.getMonth() - offset + 1, 1);
    const total = validDates.filter((value) => value >= bucket && value < nextBucket).length;
    points.push({
      label: bucket.toLocaleDateString("en-GB", { month: "short" }),
      total,
    });
  }

  return points;
}

function formatRecurringIntervalLabel(value?: string | null) {
  switch (value) {
    case "weekly":
      return "Weekly";
    case "quarterly":
      return "Quarterly";
    case "monthly":
    default:
      return "Monthly";
  }
}

export function StatsTab({ businessId, businessName, currentRole, currentPermissions, onOpenLead, onOpenTasks }: StatsTabProps) {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [historyFilter, setHistoryFilter] = useState("all");
  const [recordKind, setRecordKind] = useState<"expense" | "income">("expense");
  const [expenseType, setExpenseType] = useState("one_time");
  const [recurringInterval, setRecurringInterval] = useState("monthly");
  const [linkedLeadId, setLinkedLeadId] = useState("");
  const [recordTitle, setRecordTitle] = useState("");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [recordDescription, setRecordDescription] = useState("");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isEditingRecurringTemplate, setIsEditingRecurringTemplate] = useState(false);
  const [recordStatus, setRecordStatus] = useState<string | null>(null);
  const [isMoneyModalOpen, setIsMoneyModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskLeadId, setTaskLeadId] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDeadline, setTaskDeadline] = useState(() => `${normalizeDateKey(new Date().toISOString())}T12:00`);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => normalizeDateKey(new Date().toISOString()));
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week" | "upcoming">("month");
  const [calendarKindFilter, setCalendarKindFilter] = useState("all");
  const [calendarTaskStateFilter, setCalendarTaskStateFilter] = useState("open");
  const [calendarTaskAssignedFilter, setCalendarTaskAssignedFilter] = useState("all");
  const [moneyTab, setMoneyTab] = useState<"overview" | "history" | "recurring">("overview");

  const leadsQuery = useQuery({
    queryKey: ["leads", businessId, "dashboard"],
    queryFn: () => getLeads(businessId, token),
    enabled: Boolean(businessId && token),
  });

  const leadStatusesQuery = useQuery({
    queryKey: ["lead-statuses", businessId],
    queryFn: async () => (await getLeadStatuses(businessId, token)).items,
    enabled: Boolean(businessId && token),
  });

  const membersQuery = useQuery({
    queryKey: ["business-members", businessId, "dashboard-calendar"],
    queryFn: async () => (await getBusinessMembers(businessId, token)).items,
    enabled: Boolean(businessId && token),
  });

  const expensesQuery = useQuery({
    queryKey: ["expenses", businessId, "dashboard"],
    queryFn: () => getExpenses(businessId, token, "all"),
    enabled: Boolean(businessId && token),
  });

  const recurringPlansQuery = useQuery({
    queryKey: ["expenses", businessId, "recurring-plans"],
    queryFn: () => getRecurringExpensePlans(businessId, token),
    enabled: Boolean(businessId && token),
  });

  const tasksQuery = useQuery({
    queryKey: taskQueryKeys.calendar(businessId),
    queryFn: () => getTasks(businessId, token, null, "all"),
    enabled: Boolean(businessId && token),
  });

  const incomesQuery = useQuery({
    queryKey: ["incomes", businessId],
    queryFn: () => getIncomes(businessId, token),
    enabled: Boolean(businessId && token),
  });

  const leads = leadsQuery.data?.items ?? [];
  const leadMap = useMemo(
    () =>
      Object.fromEntries(
        leads.map((lead) => [
          lead.id,
          {
            name: lead.name?.trim() || lead.uid,
            uid: lead.uid,
          },
        ]),
      ),
    [leads],
  );
  const members = membersQuery.data ?? [];
  const memberMap = useMemo(
    () =>
      Object.fromEntries(
        members.map((member) => [
          member.user_id,
          {
            display_name: member.display_name,
            role: member.role,
          },
        ]),
      ),
    [members],
  );
  const memberOptions = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...members.map((member) => ({
        value: member.user_id,
        label: `${member.display_name} (${member.role})`,
      })),
    ],
    [members],
  );
  const calendarAssigneeFilterOptions = useMemo(
    () => [
      { value: "all", label: "All assignees" },
      { value: "unassigned", label: "Unassigned tasks" },
      ...members.map((member) => ({
        value: member.user_id,
        label: member.display_name,
      })),
    ],
    [members],
  );
  const activeStatusNames = new Set((leadStatusesQuery.data ?? []).filter((item) => !item.hide_from_active).map((item) => item.name));
  const wonStatusNames = new Set((leadStatusesQuery.data ?? []).filter((item) => item.is_won).map((item) => item.name));
  const activeLeads = leads.filter((lead) => activeStatusNames.has(lead.status));
  const wonLeads = leads.filter((lead) => wonStatusNames.has(lead.status));
  const wonLeadValue = wonLeads.reduce((sum, lead) => sum + Number(lead.contract_value ?? 0), 0);
  const expenses = expensesQuery.data?.items ?? [];
  const incomes = incomesQuery.data?.items ?? [];
  const recurringPlans = recurringPlansQuery.data?.items ?? [];
  const tasks = tasksQuery.data?.items ?? [];
  const recurringExpenses = expenses.filter((expense) => expense.expense_type === "recurring");
  const oneTimeExpenses = expenses.filter((expense) => expense.expense_type === "one_time");
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const totalIncome = incomes.reduce((sum, income) => sum + Number(income.amount ?? 0), 0);
  const leadLinkedIncome = incomes.filter((income) => Boolean(income.lead_id));
  const externalIncome = incomes.filter((income) => !income.lead_id);
  const leadLinkedExpenses = expenses.filter((expense) => Boolean(expense.lead_id));
  const externalExpenses = expenses.filter((expense) => !expense.lead_id);
  const leadLinkedIncomeTotal = leadLinkedIncome.reduce((sum, income) => sum + Number(income.amount ?? 0), 0);
  const externalIncomeTotal = externalIncome.reduce((sum, income) => sum + Number(income.amount ?? 0), 0);
  const leadLinkedExpenseTotal = leadLinkedExpenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const externalExpenseTotal = externalExpenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const activeRecurringPlans = recurringPlans.filter((plan) => plan.recurring_active);
  const recurringCommittedTotal = activeRecurringPlans.reduce((sum, plan) => sum + Number(plan.amount ?? 0), 0);
  const executedRecurringTotal = recurringExpenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const netResult = totalIncome - totalExpenses;
  const openTasksTotal = tasks.filter((task) => !task.done_at).length;
  const leadTrend = useMemo(() => buildLeadTrend(leads.map((lead) => lead.created_at)), [leads]);
  const maxTrendValue = Math.max(...leadTrend.map((point) => point.total), 1);
  const combinedMoney = totalIncome + totalExpenses;
  const incomeShare = combinedMoney > 0 ? (totalIncome / combinedMoney) * 100 : 0;
  const recentLead = leads[0] ?? null;
  const canManageMoney = canManageExpensesPermission(currentRole, currentPermissions);
  const canManageTasks = canManageAllTasks(currentRole, currentPermissions) || canManageOwnTasks(currentRole, currentPermissions);

  const leadOptions = useMemo(
    () => [
      { value: "", label: "External / not linked to a lead" },
      ...leads.map((lead) => ({
        value: lead.id,
        label: `${lead.name?.trim() || lead.uid} (${lead.uid})`,
      })),
    ],
    [leads],
  );
  const monthCalendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const weekCalendarDays = useMemo(() => buildWeekDays(selectedCalendarDate), [selectedCalendarDate]);
  const calendarEntries = useMemo<CalendarEntry[]>(() => {
    const taskEntries = tasks
      .map<CalendarEntry | null>((task) => {
        const rawDate = task.deadline ?? task.created_at;
        if (!rawDate) {
          return null;
        }
        return {
          id: `task-${task.id}`,
          sourceId: task.id,
          kind: "task" as const,
          title: task.title,
          dateKey: normalizeDateKey(rawDate),
          timestamp: rawDate,
          stateLabel: task.done_at ? "Task · done" : task.deadline ? "Task · due" : "Task · open",
          leadLabel: task.lead_name?.trim() || task.lead_uid || "General task",
          leadUid: task.lead_uid ?? null,
          assignedTo: task.assigned_to ?? null,
          assignedLabel: task.assigned_to ? memberMap[task.assigned_to]?.display_name ?? "Assigned" : "Unassigned",
          isDone: Boolean(task.done_at),
        };
      })
      .filter((item): item is CalendarEntry => item !== null);

    const incomeEntries = incomes.map((income) => ({
      id: `income-${income.id}`,
      sourceId: income.id,
      kind: "income" as const,
      title: income.title,
      dateKey: normalizeDateKey(income.date),
      timestamp: income.date,
      amount: Number(income.amount ?? 0),
      stateLabel: "Income",
      leadLabel: income.lead_id ? leadMap[income.lead_id]?.name ?? "Linked lead" : "External",
      leadUid: income.lead_id ? leadMap[income.lead_id]?.uid ?? null : null,
    }));

    const expenseEntries = expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      sourceId: expense.id,
      kind: "expense" as const,
      title: expense.title,
      dateKey: normalizeDateKey(expense.date),
      timestamp: expense.date,
      amount: Number(expense.amount ?? 0),
      stateLabel: expense.expense_type === "recurring" ? "Recurring expense" : "Expense",
      leadLabel: expense.lead_id ? leadMap[expense.lead_id]?.name ?? "Linked lead" : "External",
      leadUid: expense.lead_id ? leadMap[expense.lead_id]?.uid ?? null : null,
    }));

    return [...taskEntries, ...incomeEntries, ...expenseEntries];
  }, [expenses, incomes, leadMap, memberMap, tasks]);
  const filteredCalendarEntries = useMemo(
    () =>
      calendarEntries.filter((item) => {
        if (calendarKindFilter !== "all" && item.kind !== calendarKindFilter) {
          return false;
        }
        if (item.kind === "task" && calendarTaskStateFilter !== "all") {
          const isDone = Boolean(item.isDone);
          if (calendarTaskStateFilter === "open" && isDone) {
            return false;
          }
          if (calendarTaskStateFilter === "done" && !isDone) {
            return false;
          }
        }
        if (item.kind === "task" && calendarTaskAssignedFilter !== "all") {
          if (calendarTaskAssignedFilter === "unassigned" && item.assignedTo) {
            return false;
          }
          if (calendarTaskAssignedFilter !== "unassigned" && item.assignedTo !== calendarTaskAssignedFilter) {
            return false;
          }
        }
        return true;
      }),
    [calendarEntries, calendarKindFilter, calendarTaskAssignedFilter, calendarTaskStateFilter],
  );
  const calendarEntriesByDay = useMemo(() => {
    const grouped = new Map<string, CalendarEntry[]>();
    filteredCalendarEntries.forEach((item) => {
      const current = grouped.get(item.dateKey) ?? [];
      current.push(item);
      grouped.set(item.dateKey, current);
    });
    grouped.forEach((items) =>
      items.sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()),
    );
    return grouped;
  }, [filteredCalendarEntries]);
  const selectedDayEntries = calendarEntriesByDay.get(selectedCalendarDate) ?? [];
  const visibleCalendarDays = calendarViewMode === "month" ? monthCalendarDays : weekCalendarDays;
  const upcomingCalendarGroups = useMemo(() => {
    const todayKey = normalizeDateKey(new Date().toISOString());
    const sortedDates = [...calendarEntriesByDay.keys()]
      .filter((dateKey) => dateKey >= todayKey)
      .sort((left, right) => left.localeCompare(right))
      .slice(0, 14);
    return sortedDates.map((dateKey) => ({
      dateKey,
      items: calendarEntriesByDay.get(dateKey) ?? [],
    }));
  }, [calendarEntriesByDay]);
  const selectedDaySummary = useMemo(() => {
    const dayTasks = selectedDayEntries.filter((item) => item.kind === "task");
    const taskCount = dayTasks.length;
    const openTaskCount = dayTasks.filter((item) => !item.isDone).length;
    const doneTaskCount = dayTasks.filter((item) => item.isDone).length;
    const incomeTotal = selectedDayEntries
      .filter((item) => item.kind === "income")
      .reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
    const expenseTotal = selectedDayEntries
      .filter((item) => item.kind === "expense")
      .reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
    return {
      taskCount,
      openTaskCount,
      doneTaskCount,
      incomeTotal,
      expenseTotal,
    };
  }, [selectedDayEntries]);
  const calendarHeaderLabel = useMemo(() => {
    if (calendarViewMode === "week") {
      return formatDateRangeLabel(weekCalendarDays[0], weekCalendarDays[weekCalendarDays.length - 1]);
    }
    if (calendarViewMode === "upcoming") {
      const firstUpcomingDateKey = upcomingCalendarGroups[0]?.dateKey ?? selectedCalendarDate;
      return `Starting ${formatDueDate(firstUpcomingDateKey)}`;
    }
    return formatMonthLabel(calendarMonth);
  }, [calendarMonth, calendarViewMode, selectedCalendarDate, upcomingCalendarGroups, weekCalendarDays]);

  const moneyBreakdownRows = useMemo(
    () => [
      {
        label: "Lead-linked",
        income: leadLinkedIncomeTotal,
        expense: leadLinkedExpenseTotal,
        balance: leadLinkedIncomeTotal - leadLinkedExpenseTotal,
        tone: "accent",
      },
      {
        label: "External",
        income: externalIncomeTotal,
        expense: externalExpenseTotal,
        balance: externalIncomeTotal - externalExpenseTotal,
        tone: "success",
      },
      {
        label: "Executed recurring",
        income: 0,
        expense: executedRecurringTotal,
        balance: -executedRecurringTotal,
        tone: "danger",
      },
      {
        label: "Recurring due",
        income: 0,
        expense: recurringCommittedTotal,
        balance: -recurringCommittedTotal,
        tone: "muted",
      },
    ],
    [
      executedRecurringTotal,
      externalExpenseTotal,
      externalIncomeTotal,
      leadLinkedExpenseTotal,
      leadLinkedIncomeTotal,
      recurringCommittedTotal,
    ],
  );
  const moneyBreakdownScale = useMemo(
    () => Math.max(...moneyBreakdownRows.map((row) => Math.max(row.income, row.expense, Math.abs(row.balance))), 1),
    [moneyBreakdownRows],
  );

  const historyItems = useMemo<MoneyHistoryItem[]>(() => {
    const expenseItems = expenses.map((expense) => ({
      id: expense.id,
      kind: "expense" as const,
      title: expense.title,
      amount: Number(expense.amount ?? 0),
      description: expense.description ?? null,
      date: expense.date,
      created_at: expense.created_at,
      lead_id: expense.lead_id,
      expense_type: expense.expense_type,
      recurring_interval: expense.recurring_interval ?? null,
    }));
    const incomeItems = incomes.map((income) => ({
      id: income.id,
      kind: "income" as const,
      title: income.title,
      amount: Number(income.amount ?? 0),
      description: income.description ?? null,
      date: income.date,
      created_at: income.created_at,
      lead_id: income.lead_id,
    }));

    return [...expenseItems, ...incomeItems]
      .filter((item) => historyFilter === "all" || item.kind === historyFilter)
      .sort((left, right) => {
        const leftTimestamp = new Date(left.date || left.created_at).getTime();
        const rightTimestamp = new Date(right.date || right.created_at).getTime();
        return rightTimestamp - leftTimestamp;
      });
  }, [expenses, historyFilter, incomes]);

  function resetMoneyForm() {
    setEditingRecordId(null);
    setIsEditingRecurringTemplate(false);
    setRecordKind("expense");
    setExpenseType("one_time");
    setRecurringInterval("monthly");
    setLinkedLeadId("");
    setRecordTitle("");
    setRecordAmount("");
    setRecordDate("");
    setRecordDescription("");
    setRecordStatus(null);
    setIsMoneyModalOpen(false);
  }

  function resetTaskForm() {
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskLeadId("");
    setTaskAssignedTo("");
    setTaskDescription("");
    setTaskDeadline(`${selectedCalendarDate}T12:00`);
    setTaskStatus(null);
    setIsTaskModalOpen(false);
  }

  async function refreshMoneyQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["expenses", businessId] }),
      queryClient.invalidateQueries({ queryKey: ["expenses", businessId, "recurring-plans"] }),
      queryClient.invalidateQueries({ queryKey: ["incomes", businessId] }),
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.root(businessId) }),
      queryClient.invalidateQueries({ queryKey: ["leads", businessId] }),
    ]);
  }

  async function handleRecurringPlanAction(plan: Expense, action: "pause" | "resume" | "archive") {
    try {
      if (action === "pause") {
        await pauseRecurringExpensePlan(plan.id, businessId, token);
        setRecordStatus(`Paused recurring plan: ${plan.title}`);
      } else if (action === "resume") {
        await resumeRecurringExpensePlan(plan.id, businessId, token);
        setRecordStatus(`Resumed recurring plan: ${plan.title}`);
      } else {
        await archiveRecurringExpensePlan(plan.id, businessId, token);
        setRecordStatus(`Archived recurring plan: ${plan.title}`);
      }
      await refreshMoneyQueries();
    } catch {
      setRecordStatus(`Could not ${action} recurring plan.`);
    }
  }

  function openCalendarMoneyModal(kind: "income" | "expense") {
    setEditingRecordId(null);
    setIsEditingRecurringTemplate(false);
    setRecordKind(kind);
    setExpenseType("one_time");
    setRecurringInterval("monthly");
    setLinkedLeadId("");
    setRecordTitle("");
    setRecordAmount("");
    setRecordDate(selectedCalendarDate);
    setRecordDescription("");
    setRecordStatus(null);
    setIsMoneyModalOpen(true);
  }

  function openCalendarTaskModal() {
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskLeadId("");
    setTaskAssignedTo(canManageAllTasks(currentRole, currentPermissions) ? "" : currentUser?.id ?? "");
    setTaskDescription("");
    setTaskDeadline(`${selectedCalendarDate}T12:00`);
    setTaskStatus(null);
    setIsTaskModalOpen(true);
  }

  function openCalendarTaskEditModal(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      setRecordStatus("Task not found.");
      return;
    }
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskLeadId(task.lead_id ?? "");
    setTaskAssignedTo(task.assigned_to ?? "");
    setTaskDescription(task.description ?? "");
    setTaskDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : `${selectedCalendarDate}T12:00`);
    setTaskStatus(null);
    setIsTaskModalOpen(true);
  }

  function jumpCalendarToToday() {
    const today = new Date();
    const todayKey = normalizeDateKey(today.toISOString());
    setSelectedCalendarDate(todayKey);
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  async function handleSaveCalendarTask() {
    const title = taskTitle.trim();
    if (!title) {
      setTaskStatus("Enter a task title first.");
      return;
    }

    try {
      if (editingTaskId) {
        await updateTask(
          editingTaskId,
          businessId,
          {
            lead_id: taskLeadId || null,
            assigned_to: taskAssignedTo || null,
            title,
            description: taskDescription.trim() || null,
            deadline: taskDeadline ? new Date(taskDeadline).toISOString() : null,
          },
          token,
        );
        setRecordStatus(`Task updated: ${title}`);
      } else {
        await createTask(
          {
            business_id: businessId,
            lead_id: taskLeadId || null,
            assigned_to: taskAssignedTo || null,
            title,
            description: taskDescription.trim() || null,
            deadline: taskDeadline ? new Date(taskDeadline).toISOString() : null,
          },
          token,
        );
        setRecordStatus(`Task created: ${title}`);
      }
      await refreshMoneyQueries();
      resetTaskForm();
    } catch {
      setTaskStatus(editingTaskId ? "Could not update the task." : "Could not create the task.");
    }
  }

  async function handleMarkCalendarTaskDone(taskId: string, title: string) {
    try {
      await markTaskDone(taskId, businessId, token);
      setRecordStatus(`Task completed: ${title}`);
      await refreshMoneyQueries();
    } catch {
      setRecordStatus("Could not mark the task as done.");
    }
  }

  function shiftCalendarWindow(direction: -1 | 1) {
    if (calendarViewMode === "month") {
      setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
      return;
    }

    const anchor = new Date(`${selectedCalendarDate}T12:00:00`);
    const nextAnchor = new Date(anchor);
    nextAnchor.setDate(anchor.getDate() + (calendarViewMode === "week" ? 7 : 14) * direction);
    setSelectedCalendarDate(normalizeDateKey(nextAnchor.toISOString()));
    setCalendarMonth(new Date(nextAnchor.getFullYear(), nextAnchor.getMonth(), 1));
  }

  async function handleCreateRecord() {
    const title = recordTitle.trim();
    const amount = recordAmount.trim();
    const date = recordDate.trim();
    if (!title || !amount || !date) {
      setRecordStatus("Fill title, amount, and date first.");
      return;
    }

    try {
      if (recordKind === "expense") {
        const expense = await createExpense(
          {
            business_id: businessId,
            lead_id: linkedLeadId || null,
            expense_type: expenseType,
            recurring_interval: expenseType === "recurring" ? recurringInterval : null,
            title,
            amount,
            description: recordDescription.trim() || null,
            date,
          },
          token,
        );
        setRecordStatus(`Expense created: ${expense.title}`);
      } else {
        const income = await createIncome(
          {
            business_id: businessId,
            lead_id: linkedLeadId || null,
            title,
            amount,
            description: recordDescription.trim() || null,
            date,
          },
          token,
        );
        setRecordStatus(`Income recorded: ${income.title}`);
      }
      await refreshMoneyQueries();
      setEditingRecordId(null);
      setRecordTitle("");
      setRecordAmount("");
      setRecordDate("");
      setRecordDescription("");
      setLinkedLeadId("");
      setIsMoneyModalOpen(false);
    } catch {
      setRecordStatus(`Could not create the ${recordKind}.`);
    }
  }

  async function handleSaveRecord() {
    const title = recordTitle.trim();
    const amount = recordAmount.trim();
    const date = recordDate.trim();
    if (!editingRecordId || !title || !amount || !date) {
      setRecordStatus("Fill title, amount, and date first.");
      return;
    }

    try {
      if (recordKind === "expense") {
        const expense = await updateExpense(
          editingRecordId,
          {
            business_id: businessId,
            lead_id: linkedLeadId || null,
            expense_type: expenseType,
            recurring_interval: expenseType === "recurring" ? recurringInterval : null,
            title,
            amount,
            description: recordDescription.trim() || null,
            date,
          },
          token,
        );
        setRecordStatus(`Expense updated: ${expense.title}`);
      } else {
        const income = await updateIncome(
          editingRecordId,
          {
            business_id: businessId,
            lead_id: linkedLeadId || null,
            title,
            amount,
            description: recordDescription.trim() || null,
            date,
          },
          token,
        );
        setRecordStatus(`Income updated: ${income.title}`);
      }
      await refreshMoneyQueries();
      resetMoneyForm();
    } catch {
      setRecordStatus(`Could not update the ${recordKind}.`);
    }
  }

  async function handleDeleteRecord(item: MoneyHistoryItem) {
    try {
      if (item.kind === "expense") {
        await deleteExpense(item.id, businessId, token);
      } else {
        await deleteIncome(item.id, businessId, token);
      }
      setRecordStatus(`${item.kind === "expense" ? "Expense" : "Income"} deleted.`);
      await refreshMoneyQueries();
    } catch {
      setRecordStatus(`Could not delete the ${item.kind}.`);
    }
  }

  function startEditingRecurringPlan(plan: Expense) {
    setEditingRecordId(plan.id);
    setIsEditingRecurringTemplate(true);
    setRecordKind("expense");
    setExpenseType("recurring");
    setRecurringInterval(plan.recurring_interval ?? "monthly");
    setLinkedLeadId(plan.lead_id ?? "");
    setRecordTitle(plan.title);
    setRecordAmount(String(plan.amount ?? ""));
    setRecordDate(plan.next_due_date ?? plan.date);
    setRecordDescription(plan.description ?? "");
    setRecordStatus(`Editing recurring plan: ${plan.title}`);
    setIsMoneyModalOpen(true);
  }

  function startEditingRecord(item: MoneyHistoryItem) {
    setEditingRecordId(item.id);
    setIsEditingRecurringTemplate(false);
    setRecordKind(item.kind);
    setExpenseType(item.expense_type ?? "one_time");
    setRecurringInterval(item.recurring_interval ?? "monthly");
    setLinkedLeadId(item.lead_id ?? "");
    setRecordTitle(item.title);
    setRecordAmount(String(item.amount ?? ""));
    setRecordDate(item.date);
    setRecordDescription(item.description ?? "");
    setRecordStatus(`Editing ${item.kind}: ${item.title}`);
    setIsMoneyModalOpen(true);
  }

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <span className="section-heading__eyebrow">{businessName}</span>
          <h2>Dashboard</h2>
          <p className="section-heading__support">A calm overview of money, lead momentum, and the team calendar.</p>
        </div>
      </div>

      <article className="panel dashboard-hero">
        <div className="dashboard-hero__topline">
          <div className="dashboard-hero__copy">
            <span className="section-heading__eyebrow">Money overview</span>
            <strong className="dashboard-hero__value">{formatCurrency(netResult)}</strong>
            <p>
              {formatCurrency(totalIncome)} in · {formatCurrency(totalExpenses)} out
            </p>
          </div>
          <div className="dashboard-hero__actions">
            {canManageMoney ? (
              <>
                <button type="button" className="chip chip--active" onClick={() => openCalendarMoneyModal("income")}>
                  <ArrowUpRight size={14} />
                  Add income
                </button>
                <button type="button" className="ghost-button" onClick={() => openCalendarMoneyModal("expense")}>
                  <ArrowDownRight size={14} />
                  Add expense
                </button>
              </>
            ) : null}
          </div>
        </div>
        <div className="dashboard-hero__stats">
          <article className="dashboard-hero__stat">
            <span className="dashboard-hero__stat-icon dashboard-hero__stat-icon--accent">
              <Wallet2 size={16} />
            </span>
            <div>
              <strong>{formatCurrency(leadLinkedIncomeTotal - leadLinkedExpenseTotal)}</strong>
              <span>Lead-linked balance</span>
            </div>
          </article>
          <article className="dashboard-hero__stat">
            <span className="dashboard-hero__stat-icon dashboard-hero__stat-icon--success">
              <TrendingUp size={16} />
            </span>
            <div>
              <strong>{formatCurrency(externalIncomeTotal - externalExpenseTotal)}</strong>
              <span>External balance</span>
            </div>
          </article>
          <article className="dashboard-hero__stat">
            <span className="dashboard-hero__stat-icon dashboard-hero__stat-icon--danger">
              <Repeat2 size={16} />
            </span>
            <div>
              <strong>{formatCurrency(recurringCommittedTotal)}</strong>
              <span>Recurring due</span>
            </div>
          </article>
          <article className="dashboard-hero__stat">
            <span className="dashboard-hero__stat-icon dashboard-hero__stat-icon--muted">
              <CalendarDays size={16} />
            </span>
            <div>
              <strong>{openTasksTotal}</strong>
              <span>Open tasks</span>
            </div>
          </article>
        </div>
      </article>

      <div className="dual-grid">
        <article className="panel chart-panel">
          <div className="chart-panel__header">
            <div>
              <span className="section-heading__eyebrow">Lead trend</span>
              <h3>Lead intake over time</h3>
            </div>
            <span className="lead-card__tag">
              {recentLead ? `Latest: ${formatShortDate(recentLead.created_at)}` : "No leads yet"}
            </span>
          </div>
          {leadsQuery.isLoading ? <Spinner label="Loading lead analytics..." /> : null}
          {!leadsQuery.isLoading && leadTrend.length === 0 ? (
            <article className="panel panel--subtle">
              <p>No synced leads yet, so the chart is still empty.</p>
            </article>
          ) : null}
          {!leadsQuery.isLoading && leadTrend.length > 0 ? (
            <div className="mini-bar-chart" aria-label="Lead intake bars">
              {leadTrend.map((point) => (
                <div key={point.label} className="mini-bar-chart__item">
                  <div className="mini-bar-chart__track">
                    <div
                      className="mini-bar-chart__bar"
                      style={{ height: `${Math.max(10, (point.total / maxTrendValue) * 100)}%` }}
                    />
                  </div>
                  <strong>{point.total}</strong>
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <article className="panel chart-panel">
          <div className="chart-panel__header">
            <div>
              <span className="section-heading__eyebrow">Money</span>
              <h3>Money</h3>
            </div>
            <div className="lead-chip-row lead-chip-row--scroll">
              <button
                type="button"
                className={`lead-chip${moneyTab === "overview" ? " lead-chip--active" : ""}`}
                onClick={() => setMoneyTab("overview")}
              >
                Overview
              </button>
              <button
                type="button"
                className={`lead-chip${moneyTab === "history" ? " lead-chip--active" : ""}`}
                onClick={() => setMoneyTab("history")}
              >
                History
              </button>
              <button
                type="button"
                className={`lead-chip${moneyTab === "recurring" ? " lead-chip--active" : ""}`}
                onClick={() => setMoneyTab("recurring")}
              >
                Recurring
              </button>
            </div>
          </div>
          {moneyTab === "overview" ? (
            <div className="stack-list stack-list--tight">
              <div className="dashboard-balance-list">
                {moneyBreakdownRows.map((row) => {
                  const incomeWidth = Math.max(10, (row.income / moneyBreakdownScale) * 100);
                  const expenseWidth = Math.max(10, (row.expense / moneyBreakdownScale) * 100);
                  return (
                    <article key={row.label} className="dashboard-balance-row">
                      <div className="dashboard-balance-row__copy">
                        <strong>{row.label}</strong>
                        <span>{formatCurrency(row.balance)} balance</span>
                      </div>
                      <div className="dashboard-balance-row__values">
                        <span className="dashboard-balance-row__income">+ {formatCurrency(row.income)}</span>
                        <span className="dashboard-balance-row__expense">- {formatCurrency(row.expense)}</span>
                      </div>
                      <div className="dashboard-balance-row__bars">
                        <span
                          className={`dashboard-balance-row__bar dashboard-balance-row__bar--${row.tone}`}
                          style={{ width: `${incomeWidth}%` }}
                        />
                        <span
                          className="dashboard-balance-row__bar dashboard-balance-row__bar--expense"
                          style={{ width: `${expenseWidth}%` }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="lead-chip-row lead-chip-row--scroll">
                <span className="chip">Won lead value {formatCurrency(wonLeadValue)}</span>
                <span className="chip">Income share {Math.round(incomeShare)}%</span>
                <span className="chip">{incomes.length + expenses.length} executed records</span>
                <span className="chip">{activeRecurringPlans.length} recurring active</span>
              </div>
            </div>
          ) : null}
          {moneyTab === "history" ? (
            <div className="stack-list stack-list--tight">
              <div className="chart-panel__header chart-panel__header--compact">
                <div>
                  <h3>Executed history</h3>
                  <p>Only real income and expense entries live here.</p>
                </div>
                <div className="dashboard-section-actions">
                  <SelectField
                    label="History"
                    value={historyFilter}
                    onChange={setHistoryFilter}
                    presentation="sheet"
                    options={[
                      { value: "all", label: "All money flow" },
                      { value: "income", label: "Income only" },
                      { value: "expense", label: "Expenses only" },
                    ]}
                  />
                  {canManageMoney ? (
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingRecordId(null);
                        setIsEditingRecurringTemplate(false);
                        setRecordKind("expense");
                        setExpenseType("one_time");
                        setRecurringInterval("monthly");
                        setLinkedLeadId("");
                        setRecordTitle("");
                        setRecordAmount("");
                        setRecordDate("");
                        setRecordDescription("");
                        setRecordStatus(null);
                        setIsMoneyModalOpen(true);
                      }}
                    >
                      Add record
                    </button>
                  ) : null}
                </div>
              </div>
              {recordStatus ? <p className="settings-status">{recordStatus}</p> : null}
              <div className="dashboard-scroll-area">
                <div className="stack-list stack-list--tight">
                  {expensesQuery.isLoading || incomesQuery.isLoading ? <Spinner label="Loading money history..." /> : null}
                  {!expensesQuery.isLoading && !incomesQuery.isLoading && historyItems.length === 0 ? (
                    <article className="panel panel--subtle">
                      <p>No money records yet.</p>
                    </article>
                  ) : null}
                  {historyItems.map((item) => {
                    const linkedLead = item.lead_id ? leadMap[item.lead_id] : null;
                    return (
                      <article key={`${item.kind}-${item.id}`} className="panel panel--subtle money-history-card">
                        <div className="money-history-card__main">
                          <div className="activity-item__topline">
                            <strong>{item.title}</strong>
                            <span className={`lead-card__tag ${item.kind === "income" ? "lead-card__tag--calendar-income" : "lead-card__tag--calendar-expense"}`}>
                              {item.kind === "income" ? "Income" : "Expense"}
                            </span>
                          </div>
                          <div className="money-history-card__meta">
                            <span>{item.date}</span>
                            <span>{linkedLead ? `Lead ${linkedLead.name}` : "External"}</span>
                            {item.kind === "expense" && item.expense_type === "recurring" ? (
                              <span>{formatRecurringIntervalLabel(item.recurring_interval)} plan</span>
                            ) : null}
                          </div>
                          {item.description ? <p>{item.description}</p> : null}
                        </div>
                        <div className="money-history-card__actions">
                          <strong className={item.kind === "income" ? "dashboard-money-positive" : "dashboard-money-negative"}>
                            {item.kind === "income" ? "+" : "-"} {formatCurrency(item.amount)}
                          </strong>
                          {canManageMoney ? (
                            <>
                              <button type="button" className="chip" onClick={() => startEditingRecord(item)}>
                                Edit
                              </button>
                              <button type="button" className="ghost-button" onClick={() => void handleDeleteRecord(item)}>
                                Delete
                              </button>
                            </>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
          {moneyTab === "recurring" ? (
            <div className="stack-list stack-list--tight">
              <div>
                <h3>Recurring plans</h3>
                <p>Weekly, monthly, or quarterly recurring costs with next due dates and lead context.</p>
              </div>
              <div className="dashboard-scroll-area">
                <div className="stack-list stack-list--tight">
                  {recurringPlansQuery.isLoading ? <Spinner label="Loading recurring plans..." /> : null}
                  {!recurringPlansQuery.isLoading && recurringPlans.length === 0 ? (
                    <article className="panel panel--subtle">
                      <p>No recurring plans yet.</p>
                    </article>
                  ) : null}
                  {recurringPlans.map((plan) => {
                    const linkedLead = plan.lead_id ? leadMap[plan.lead_id] : null;
                    const deleteItem: MoneyHistoryItem = {
                      id: plan.id,
                      kind: "expense",
                      title: plan.title,
                      amount: Number(plan.amount ?? 0),
                      description: plan.description ?? null,
                      date: plan.date,
                      created_at: plan.created_at,
                      lead_id: plan.lead_id,
                      expense_type: plan.expense_type,
                      recurring_interval: plan.recurring_interval ?? null,
                    };
                    return (
                      <article key={plan.id} className="panel panel--subtle recurring-plan-card">
                        <div>
                          <div className="activity-item__topline">
                            <strong>{plan.title}</strong>
                            <span className="lead-card__tag">{plan.recurring_active ? "Active" : "Paused"}</span>
                          </div>
                          <div className="lead-chip-row lead-chip-row--scroll">
                            <span className="chip">{formatRecurringIntervalLabel(plan.recurring_interval)} plan</span>
                            <span className="chip">Next due {formatDueDate(plan.next_due_date)}</span>
                            <span className="chip">{linkedLead ? `Lead ${linkedLead.name}` : "External"}</span>
                          </div>
                          {plan.description ? <p>{plan.description}</p> : null}
                        </div>
                        <div className="toggle-group recurring-plan-card__actions">
                          <strong className="dashboard-money-negative">- {formatCurrency(Number(plan.amount ?? 0))}</strong>
                          {canManageMoney ? (
                            <>
                              {plan.recurring_active ? (
                                <button type="button" className="chip" onClick={() => void handleRecurringPlanAction(plan, "pause")}>
                                  Pause
                                </button>
                              ) : (
                                <button type="button" className="chip" onClick={() => void handleRecurringPlanAction(plan, "resume")}>
                                  Resume
                                </button>
                              )}
                              <button type="button" className="chip" onClick={() => startEditingRecurringPlan(plan)}>
                                Edit
                              </button>
                              <button type="button" className="ghost-button" onClick={() => void handleRecurringPlanAction(plan, "archive")}>
                                Archive
                              </button>
                              <button type="button" className="ghost-button" onClick={() => void handleDeleteRecord(deleteItem)}>
                                Delete
                              </button>
                            </>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </article>
      </div>

      <article className="panel chart-panel">
        <div className="chart-panel__header">
          <div>
            <span className="section-heading__eyebrow">Calendar</span>
            <h3>Tasks, income, and expenses by day</h3>
            <p>Use the month view to see what lands on each day and filter the stream below.</p>
          </div>
          <div className="toggle-group">
            <button
              type="button"
              className="ghost-button"
              onClick={() => shiftCalendarWindow(-1)}
            >
              Previous
            </button>
            <span className="lead-card__tag">{calendarHeaderLabel}</span>
            <button
              type="button"
              className="ghost-button"
              onClick={() => shiftCalendarWindow(1)}
            >
              Next
            </button>
            <button type="button" className="chip" onClick={jumpCalendarToToday}>
              Today
            </button>
          </div>
        </div>

        <div className="filter-row">
          <SelectField
            label="Mode"
            value={calendarViewMode}
            onChange={(value) => setCalendarViewMode(value as "month" | "week" | "upcoming")}
            presentation="sheet"
            options={[
              { value: "month", label: "Month" },
              { value: "week", label: "Week" },
              { value: "upcoming", label: "Upcoming" },
            ]}
          />
          <SelectField
            label="Calendar view"
            value={calendarKindFilter}
            onChange={setCalendarKindFilter}
            presentation="sheet"
            options={[
              { value: "all", label: "All records" },
              { value: "task", label: "Tasks only" },
              { value: "income", label: "Income only" },
              { value: "expense", label: "Expenses only" },
            ]}
          />
          <SelectField
            label="Task state"
            value={calendarTaskStateFilter}
            onChange={setCalendarTaskStateFilter}
            presentation="sheet"
            options={[
              { value: "all", label: "All tasks" },
              { value: "open", label: "Open only" },
              { value: "done", label: "Done only" },
            ]}
          />
          <SelectField
            label="Assignee"
            value={calendarTaskAssignedFilter}
            onChange={setCalendarTaskAssignedFilter}
            options={calendarAssigneeFilterOptions}
            presentation="sheet"
            searchable
            searchPlaceholder="Search teammate..."
          />
        </div>

        {calendarViewMode === "upcoming" ? (
          <div className="stack-list stack-list--tight">
            {upcomingCalendarGroups.length === 0 ? (
              <article className="panel panel--subtle">
                <p>No upcoming calendar items for the current filters.</p>
              </article>
            ) : null}
            {upcomingCalendarGroups.map((group) => {
              const taskCount = group.items.filter((item) => item.kind === "task").length;
              const incomeCount = group.items.filter((item) => item.kind === "income").length;
              const expenseCount = group.items.filter((item) => item.kind === "expense").length;
              return (
                <button
                  key={group.dateKey}
                  type="button"
                  className={`calendar-upcoming${group.dateKey === selectedCalendarDate ? " calendar-upcoming--selected" : ""}`}
                  onClick={() => setSelectedCalendarDate(group.dateKey)}
                >
                  <div>
                    <strong>{formatDueDate(group.dateKey)}</strong>
                    <p>{group.items.length} item(s)</p>
                  </div>
                  <div className="calendar-day__counts">
                    {taskCount > 0 ? <span className="calendar-dot calendar-dot--task">{taskCount}T</span> : null}
                    {incomeCount > 0 ? <span className="calendar-dot calendar-dot--income">{incomeCount}I</span> : null}
                    {expenseCount > 0 ? <span className="calendar-dot calendar-dot--expense">{expenseCount}E</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={`calendar-grid${calendarViewMode === "week" ? " calendar-grid--week" : ""}`}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <span key={label} className="calendar-grid__weekday">
                {label}
              </span>
            ))}
            {visibleCalendarDays.map((day) => {
              const dayKey = normalizeDateKey(day.toISOString());
              const dayEntries = calendarEntriesByDay.get(dayKey) ?? [];
              const incomeCount = dayEntries.filter((item) => item.kind === "income").length;
              const expenseCount = dayEntries.filter((item) => item.kind === "expense").length;
              const taskCount = dayEntries.filter((item) => item.kind === "task").length;
              const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
              const isSelected = dayKey === selectedCalendarDate;

              return (
                <button
                  key={dayKey}
                  type="button"
                  className={`calendar-day${isCurrentMonth ? "" : " calendar-day--muted"}${isSelected ? " calendar-day--selected" : ""}`}
                  onClick={() => setSelectedCalendarDate(dayKey)}
                >
                  <span className="calendar-day__number">{day.getDate()}</span>
                  <div className="calendar-day__counts">
                    {taskCount > 0 ? <span className="calendar-dot calendar-dot--task">{taskCount}T</span> : null}
                    {incomeCount > 0 ? <span className="calendar-dot calendar-dot--income">{incomeCount}I</span> : null}
                    {expenseCount > 0 ? <span className="calendar-dot calendar-dot--expense">{expenseCount}E</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="calendar-agenda">
          <div className="chart-panel__header">
            <div>
              <h3>{formatDueDate(selectedCalendarDate)}</h3>
              <p>{selectedDayEntries.length} item(s) for the selected day.</p>
            </div>
            <div className="toggle-group">
              {canManageTasks ? (
                <button type="button" className="chip" onClick={openCalendarTaskModal}>
                  Add task
                </button>
              ) : null}
              {canManageMoney ? (
                <>
                  <button type="button" className="chip" onClick={() => openCalendarMoneyModal("income")}>
                    Add income
                  </button>
                  <button type="button" className="ghost-button" onClick={() => openCalendarMoneyModal("expense")}>
                    Add expense
                  </button>
                </>
              ) : null}
            </div>
          </div>
          <div className="expense-summary">
            <span className="expense-chip">{selectedDaySummary.taskCount} task(s)</span>
            <span className="expense-chip">
              Open {selectedDaySummary.openTaskCount} · Done {selectedDaySummary.doneTaskCount}
            </span>
            <span className="expense-chip">Income: {formatCurrency(selectedDaySummary.incomeTotal)}</span>
            <span className="expense-chip">Expenses: {formatCurrency(selectedDaySummary.expenseTotal)}</span>
          </div>
          {tasksQuery.isLoading || expensesQuery.isLoading || incomesQuery.isLoading ? (
            <Spinner label="Loading calendar..." />
          ) : null}
          {!tasksQuery.isLoading && !expensesQuery.isLoading && !incomesQuery.isLoading && selectedDayEntries.length === 0 ? (
            <article className="panel panel--subtle">
              <p>No matching tasks, income, or expenses on this day.</p>
            </article>
          ) : null}
          <div className="stack-list stack-list--tight">
            {selectedDayEntries.map((item) => (
              <article key={item.id} className="panel panel--subtle calendar-agenda__item">
                <div className="activity-item__topline">
                  <strong>{item.title}</strong>
                  <span className={`lead-card__tag lead-card__tag--calendar-${item.kind}`}>{item.stateLabel}</span>
                </div>
                <p>
                  {item.leadLabel}
                  {item.amount != null ? ` · ${formatCurrency(item.amount)}` : ""}
                </p>
                {item.kind === "task" ? <p>Assigned to: {item.assignedLabel || "Unassigned"}</p> : null}
                {(item.leadUid && onOpenLead) || (item.kind === "task" && (canManageTasks || onOpenTasks)) ? (
                  <div className="toggle-group">
                    {item.leadUid && onOpenLead ? (
                      <button type="button" className="chip" onClick={() => onOpenLead(item.leadUid ?? "")}>
                        Open lead
                      </button>
                    ) : null}
                    {item.kind === "task" && canManageTasks && item.sourceId && !item.stateLabel.includes("done") ? (
                      <button
                        type="button"
                        className="chip"
                        onClick={() => void handleMarkCalendarTaskDone(item.sourceId ?? "", item.title)}
                      >
                        Mark done
                      </button>
                    ) : null}
                    {item.kind === "task" && canManageTasks && item.sourceId ? (
                      <button
                        type="button"
                        className="chip"
                        onClick={() => openCalendarTaskEditModal(item.sourceId ?? "")}
                      >
                        Edit
                      </button>
                    ) : null}
                    {item.kind === "task" && onOpenTasks ? (
                      <button type="button" className="ghost-button" onClick={onOpenTasks}>
                        Open tasks
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </article>

      {canManageMoney && isMoneyModalOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card lead-detail__details-modal">
            <div className="lead-detail__section-heading">
              <div>
                <h3>{editingRecordId ? "Edit money record" : "Add income or expense"}</h3>
                <p>Keep money changes compact and out of the main dashboard flow.</p>
              </div>
              <button type="button" className="ghost-button" onClick={resetMoneyForm}>
                Close
              </button>
            </div>

            <div className="lead-detail__activity-composer">
              <SelectField
                label="Record type"
                value={recordKind}
                onChange={(value) => setRecordKind(value as "expense" | "income")}
                presentation="sheet"
                options={[
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                ]}
              />
              {recordKind === "expense" ? (
                <>
                  <SelectField
                    label="Expense type"
                    value={expenseType}
                    onChange={setExpenseType}
                    presentation="sheet"
                    options={
                      editingRecordId && !isEditingRecurringTemplate
                        ? [{ value: "one_time", label: "One-time" }]
                        : [
                            { value: "one_time", label: "One-time" },
                            { value: "recurring", label: "Recurring" },
                          ]
                    }
                  />
                  {expenseType === "recurring" ? (
                    <SelectField
                      label="Interval"
                      value={recurringInterval}
                      onChange={setRecurringInterval}
                      presentation="sheet"
                      options={[
                        { value: "weekly", label: "Weekly" },
                        { value: "monthly", label: "Monthly" },
                        { value: "quarterly", label: "Quarterly" },
                      ]}
                    />
                  ) : null}
                </>
              ) : null}
              <SelectField
                label="Linked lead"
                value={linkedLeadId}
                onChange={setLinkedLeadId}
                options={leadOptions}
                presentation="sheet"
                searchable
                searchPlaceholder="Search lead by name..."
              />
            </div>

            {recordKind === "expense" && expenseType === "recurring" ? (
              <p className="settings-status">
                Recurring expense = an active {formatRecurringIntervalLabel(recurringInterval).toLowerCase()} plan that generates real expense entries on each due date.
              </p>
            ) : null}

            <div className="lead-detail__activity-composer">
              <label className="input-field lead-detail__activity-input">
                <span className="select-field__label">Title</span>
                <input
                  className="input-field__control"
                  value={recordTitle}
                  onChange={(event) => setRecordTitle(event.target.value)}
                  placeholder={recordKind === "income" ? "Invoice payment, deposit, external payout..." : "Ads budget, transport, venue rental..."}
                />
              </label>
              <label className="input-field">
                <span className="select-field__label">Amount</span>
                <input
                  className="input-field__control"
                  inputMode="decimal"
                  value={recordAmount}
                  onChange={(event) => setRecordAmount(event.target.value)}
                  placeholder="0.00"
                />
              </label>
              <label className="input-field">
                <span className="select-field__label">Date</span>
                <input
                  type="date"
                  className="input-field__control"
                  value={recordDate}
                  onChange={(event) => setRecordDate(event.target.value)}
                />
              </label>
            </div>

            <label className="input-field">
              <span className="select-field__label">Description</span>
              <input
                className="input-field__control"
                value={recordDescription}
                onChange={(event) => setRecordDescription(event.target.value)}
                placeholder="Optional note"
              />
            </label>

            <div className="toggle-group">
              <button
                type="button"
                className="primary-button"
                onClick={() => void (editingRecordId ? handleSaveRecord() : handleCreateRecord())}
              >
                {editingRecordId ? `Save ${recordKind}` : `Add ${recordKind}`}
              </button>
              <button type="button" className="ghost-button" onClick={resetMoneyForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {canManageTasks && isTaskModalOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card lead-detail__details-modal">
            <div className="lead-detail__section-heading">
              <div>
                <h3>{editingTaskId ? "Edit task" : `Add task for ${formatDueDate(selectedCalendarDate)}`}</h3>
                <p>{editingTaskId ? "Update the task without leaving the calendar." : "Create a task directly from the selected day in the calendar."}</p>
              </div>
              <button type="button" className="ghost-button" onClick={resetTaskForm}>
                Close
              </button>
            </div>

            <label className="input-field">
              <span className="select-field__label">Task title</span>
              <input
                className="input-field__control"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Call client, send invoice, prep delivery..."
              />
            </label>

            <div className="lead-detail__activity-composer">
              <SelectField
                label="Linked lead"
                value={taskLeadId}
                onChange={setTaskLeadId}
                options={leadOptions}
                presentation="sheet"
                searchable
                searchPlaceholder="Search lead by name..."
              />
              <SelectField
                label="Assignee"
                value={taskAssignedTo}
                onChange={setTaskAssignedTo}
                options={memberOptions}
                presentation="sheet"
                searchable
                searchPlaceholder="Search teammate..."
              />
              <label className="input-field">
                <span className="select-field__label">Deadline</span>
                <input
                  type="datetime-local"
                  className="input-field__control"
                  value={taskDeadline}
                  onChange={(event) => setTaskDeadline(event.target.value)}
                />
              </label>
            </div>

            <label className="input-field">
              <span className="select-field__label">Description</span>
              <input
                className="input-field__control"
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                placeholder="Optional note"
              />
            </label>

            {taskStatus ? <p className="settings-status">{taskStatus}</p> : null}

            <div className="toggle-group">
              <button type="button" className="primary-button" onClick={() => void handleSaveCalendarTask()}>
                {editingTaskId ? "Save task" : "Add task"}
              </button>
              <button type="button" className="ghost-button" onClick={resetTaskForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}


