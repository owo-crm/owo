import { Card } from "@/components/ui/Card";
import { AppWorkspace } from "@/components/product/AppWorkspace";
import { prisma } from "@/lib/db";
import { resolveShellBusiness } from "@/lib/shell-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AppPage() {
  const business = await resolveShellBusiness();

  if (!business) {
    return (
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">Product Workspace</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          No business workspace exists yet. Create one through auth bootstrap (`POST /api/v1/auth/validate`)
          and the app will show live data.
        </p>
      </Card>
    );
  }

  const [leadsRaw, tasksRaw, statusesRaw, membersRaw, sourcesRaw, eventsCount, bySourceRaw] =
    await Promise.all([
      prisma.lead.findMany({
        where: { businessId: business.id, archivedAt: null },
        include: {
          owner: { select: { displayName: true } },
          status: { select: { label: true, colorHex: true } },
          events: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
          tasks: {
            where: { doneAt: null },
            orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
            take: 1,
            select: { id: true, title: true, dueAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.task.findMany({
        where: { businessId: business.id },
        include: {
          lead: { select: { fullName: true } },
          assignee: { select: { displayName: true } },
        },
        orderBy: [{ doneAt: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
        take: 300,
      }),
      prisma.leadStatus.findMany({
        where: { businessId: business.id },
        orderBy: { position: "asc" },
        select: { id: true, label: true, key: true, colorHex: true },
      }),
      prisma.businessMember.findMany({
        where: { businessId: business.id },
        include: {
          user: { select: { displayName: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.ingestSource.findMany({
        where: { businessId: business.id },
        orderBy: [{ family: "asc" }, { createdAt: "asc" }],
        select: { key: true, family: true, isActive: true },
      }),
      prisma.businessEvent.count({ where: { businessId: business.id } }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { businessId: business.id, archivedAt: null },
        _count: { source: true },
      }),
    ]);

  const leads = leadsRaw.map((lead) => ({
    id: lead.id,
    uid: lead.uid,
    fullName: lead.fullName,
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
    ownerName: lead.owner?.displayName ?? null,
    statusLabel: lead.status?.label ?? null,
    statusColorHex: lead.status?.colorHex ?? null,
    nextTaskId: lead.tasks[0]?.id ?? null,
    nextTaskTitle: lead.tasks[0]?.title ?? null,
    nextTaskDueAt: lead.tasks[0]?.dueAt ? lead.tasks[0].dueAt.toISOString() : null,
    lastActivityAt: (lead.events[0]?.createdAt ?? lead.createdAt).toISOString(),
    createdAt: lead.createdAt.toISOString(),
  }));

  const tasks = tasksRaw.map((task) => ({
    id: task.id,
    title: task.title,
    leadName: task.lead?.fullName ?? null,
    assigneeName: task.assignee?.displayName ?? null,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    doneAt: task.doneAt ? task.doneAt.toISOString() : null,
  }));

  const sourceStats = bySourceRaw
    .map((item) => ({ source: item.source, count: item._count.source }))
    .sort((a, b) => b.count - a.count);

  const leadsCount = leads.length;
  const openTasks = tasks.filter((task) => !task.doneAt).length;
  const doneTasks = tasks.length - openTasks;
  const completionRate =
    openTasks + doneTasks === 0 ? 0 : Math.round((doneTasks / (openTasks + doneTasks)) * 100);

  const statuses = statusesRaw.map((status) => ({
    id: status.id,
    label: status.label,
    key: status.key,
    colorHex: status.colorHex,
  }));

  const members = membersRaw.map((member) => ({
    id: member.id,
    displayName: member.user.displayName,
    email: member.user.email,
    role: member.role,
  }));

  const sources = sourcesRaw.map((source) => ({
    key: source.key,
    family: source.family,
    isActive: source.isActive,
  }));

  return (
    <AppWorkspace
      leads={leads}
      tasks={tasks}
      sourceStats={sourceStats}
      statuses={statuses}
      members={members}
      sources={sources}
      kpis={{
        leadsCount,
        openTasks,
        doneTasks,
        eventsCount,
        completionRate,
      }}
    />
  );
}
