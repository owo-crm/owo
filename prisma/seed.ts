import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for seeding");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

async function main() {
  const owner = await prisma.user.upsert({
    where: { telegramId: "seed-owner" },
    update: {
      displayName: "OWO Seed Owner",
      email: "owner@owo.local",
    },
    create: {
      telegramId: "seed-owner",
      displayName: "OWO Seed Owner",
      email: "owner@owo.local",
      isPlatformAdmin: true,
    },
  });

  const business = await prisma.business.upsert({
    where: { slug: "owo-demo" },
    update: {
      name: "OWO Demo Workspace",
      followUpTaskTitle: "Follow up lead",
      followUpTaskDueHours: 24,
    },
    create: {
      name: "OWO Demo Workspace",
      slug: "owo-demo",
      followUpTaskTitle: "Follow up lead",
      followUpTaskDueHours: 24,
    },
  });

  await prisma.businessMember.upsert({
    where: {
      businessId_userId: {
        businessId: business.id,
        userId: owner.id,
      },
    },
    update: {
      role: "OWNER",
    },
    create: {
      businessId: business.id,
      userId: owner.id,
      role: "OWNER",
    },
  });

  const statuses = [
    { key: "new", label: "New", colorHex: "#6b7ff0", position: 1 },
    { key: "contacted", label: "Contacted", colorHex: "#3b82f6", position: 2 },
    { key: "follow_up", label: "Follow-up", colorHex: "#e53b2e", position: 3, isFollowUp: true },
    { key: "won", label: "Won", colorHex: "#10b981", position: 4, isWon: true },
    { key: "lost", label: "Lost", colorHex: "#6b7280", position: 5, isLost: true },
  ] as const;

  for (const status of statuses) {
    await prisma.leadStatus.upsert({
      where: {
        businessId_key: {
          businessId: business.id,
          key: status.key,
        },
      },
      update: {
        label: status.label,
        colorHex: status.colorHex,
        position: status.position,
        isFollowUp: Boolean("isFollowUp" in status && status.isFollowUp),
        isWon: Boolean("isWon" in status && status.isWon),
        isLost: Boolean("isLost" in status && status.isLost),
      },
      create: {
        businessId: business.id,
        key: status.key,
        label: status.label,
        colorHex: status.colorHex,
        position: status.position,
        isFollowUp: Boolean("isFollowUp" in status && status.isFollowUp),
        isWon: Boolean("isWon" in status && status.isWon),
        isLost: Boolean("isLost" in status && status.isLost),
      },
    });
  }

  const statusByKey = new Map(
    (
      await prisma.leadStatus.findMany({
        where: { businessId: business.id },
        select: { id: true, key: true },
      })
    ).map((status) => [status.key, status.id]),
  );

  const leadSeeds = [
    {
      source: "manual" as const,
      sourceExternalKey: "seed-lead-01",
      fullName: "Anna Kowalska",
      phone: "+48 601 111 222",
      email: "anna@example.com",
      note: "Seed lead: Meta campaign",
      statusKey: "new",
    },
    {
      source: "google_sheet" as const,
      sourceExternalKey: "seed-lead-02",
      fullName: "Marek Nowak",
      phone: "+48 602 333 444",
      email: "marek@example.com",
      note: "Seed lead: imported from Google Sheet",
      statusKey: "contacted",
    },
    {
      source: "website_form" as const,
      sourceExternalKey: "seed-lead-03",
      fullName: "Julia Wisniewska",
      phone: "+48 603 555 666",
      email: "julia@example.com",
      note: "Seed lead: website form",
      statusKey: "follow_up",
    },
    {
      source: "api" as const,
      sourceExternalKey: "seed-lead-04",
      fullName: "Piotr Zielinski",
      phone: "+48 604 777 888",
      email: "piotr@example.com",
      note: "Seed lead: partner API",
      statusKey: "won",
    },
    {
      source: "meta_form_direct" as const,
      sourceExternalKey: "seed-lead-05",
      fullName: "Katarzyna Lewandowska",
      phone: "+48 605 999 000",
      email: "kasia@example.com",
      note: "Seed lead: direct Meta form",
      statusKey: "lost",
    },
  ];

  const leadIds: string[] = [];

  for (const lead of leadSeeds) {
    const existing = await prisma.lead.findFirst({
      where: {
        businessId: business.id,
        source: lead.source,
        sourceExternalKey: lead.sourceExternalKey,
      },
      select: { id: true },
    });

    const saved = existing
      ? await prisma.lead.update({
          where: { id: existing.id },
          data: {
            fullName: lead.fullName,
            phone: lead.phone,
            email: lead.email,
            note: lead.note,
            ownerId: owner.id,
            statusId: statusByKey.get(lead.statusKey) ?? null,
            metadata: {
              seed: true,
              tag: "week3",
            },
          },
          select: { id: true },
        })
      : await prisma.lead.create({
          data: {
            businessId: business.id,
            source: lead.source,
            sourceExternalKey: lead.sourceExternalKey,
            fullName: lead.fullName,
            phone: lead.phone,
            email: lead.email,
            note: lead.note,
            ownerId: owner.id,
            statusId: statusByKey.get(lead.statusKey) ?? null,
            metadata: {
              seed: true,
              tag: "week3",
            },
          },
          select: { id: true },
        });

    leadIds.push(saved.id);
  }

  const openTaskLeadIds = leadIds.slice(0, 3);
  for (const [index, leadId] of openTaskLeadIds.entries()) {
    const title = `Seed task ${index + 1}: first follow-up`;
    const existingTask = await prisma.task.findFirst({
      where: {
        businessId: business.id,
        leadId,
        title,
        doneAt: null,
      },
      select: { id: true },
    });

    if (!existingTask) {
      await prisma.task.create({
        data: {
          businessId: business.id,
          leadId,
          assigneeId: owner.id,
          createdById: owner.id,
          title,
          dueAt: new Date(Date.now() + (index + 1) * 60 * 60 * 1000),
        },
      });
    }
  }

  const sources = [
    { family: "website_form", key: "owo-demo-website-form", isActive: true },
    { family: "api", key: "owo-demo-public-api", isActive: true },
    { family: "google_sheet", key: "owo-demo-google-sheet", isActive: true },
    { family: "meta_form_direct", key: "owo-demo-meta-form", isActive: true },
    { family: "import_file", key: "owo-demo-import-file", isActive: true },
  ] as const;

  for (const source of sources) {
    await prisma.ingestSource.upsert({
      where: { key: source.key },
      update: {
        isActive: source.isActive,
        name: `OWO Demo ${source.family}`,
      },
      create: {
        businessId: business.id,
        family: source.family,
        key: source.key,
        name: `OWO Demo ${source.family}`,
        isActive: source.isActive,
      },
    });
  }

  await prisma.businessSettings.upsert({
    where: { businessId: business.id },
    update: {
      companyName: "OWOcrm Inc",
      emailAddress: "admin@owocrm.com",
      phoneNumber: "+1 (555) 123-4567",
      timezone: "UTC+1 (Central European Time)",
      language: "English",
      notificationEmailAlerts: true,
      notificationPushAlerts: true,
      notificationTaskReminders: true,
      securityTwoFactor: false,
      securitySessionTimeout: "30 minutes",
      appearanceThemeMode: "Light",
      appearanceDensity: "Comfortable",
    },
    create: {
      businessId: business.id,
      companyName: "OWOcrm Inc",
      emailAddress: "admin@owocrm.com",
      phoneNumber: "+1 (555) 123-4567",
      timezone: "UTC+1 (Central European Time)",
      language: "English",
      notificationEmailAlerts: true,
      notificationPushAlerts: true,
      notificationTaskReminders: true,
      securityTwoFactor: false,
      securitySessionTimeout: "30 minutes",
      appearanceThemeMode: "Light",
      appearanceDensity: "Comfortable",
    },
  });

  const stockSeeds = [
    { sku: "PRD-001", name: "Starter Package", category: "Packages", qty: 34, minQty: 10, price: 199 },
    { sku: "PRD-002", name: "Pro Package", category: "Packages", qty: 8, minQty: 10, price: 399 },
    { sku: "PRD-003", name: "Enterprise Add-on", category: "Add-ons", qty: 0, minQty: 3, price: 999 },
    { sku: "PRD-004", name: "Support Retainer", category: "Services", qty: 17, minQty: 5, price: 149 },
    { sku: "PRD-005", name: "Automation Setup", category: "Services", qty: 6, minQty: 4, price: 349 },
  ];

  for (const item of stockSeeds) {
    await prisma.stockItem.upsert({
      where: {
        businessId_sku: {
          businessId: business.id,
          sku: item.sku,
        },
      },
      update: {
        name: item.name,
        category: item.category,
        qty: item.qty,
        minQty: item.minQty,
        price: item.price,
      },
      create: {
        businessId: business.id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        qty: item.qty,
        minQty: item.minQty,
        price: item.price,
      },
    });
  }

  const extraMembers = [
    { telegramId: "seed-operator-1", displayName: "Sarah Johnson", email: "sarah@owo.local", role: "OPERATOR" as const },
    { telegramId: "seed-operator-2", displayName: "Mike Chen", email: "mike@owo.local", role: "OPERATOR" as const },
    { telegramId: "seed-admin-1", displayName: "Emma Wilson", email: "emma@owo.local", role: "ADMIN" as const },
  ];

  for (const member of extraMembers) {
    const user = await prisma.user.upsert({
      where: { telegramId: member.telegramId },
      update: {
        displayName: member.displayName,
        email: member.email,
      },
      create: {
        telegramId: member.telegramId,
        displayName: member.displayName,
        email: member.email,
      },
    });

    await prisma.businessMember.upsert({
      where: {
        businessId_userId: {
          businessId: business.id,
          userId: user.id,
        },
      },
      update: {
        role: member.role,
      },
      create: {
        businessId: business.id,
        userId: user.id,
        role: member.role,
      },
    });
  }

  await prisma.businessEvent.create({
    data: {
      businessId: business.id,
      type: "seed.completed",
      actorUserId: owner.id,
      payload: {
        leads: leadSeeds.length,
      },
    },
  });

  const financeInvoiceSeeds = [
    {
      number: "INV-2026-001",
      leadId: leadIds[0] ?? null,
      customerName: "Acme Corporation",
      issueDate: new Date("2026-04-01T00:00:00.000Z"),
      dueDate: new Date("2026-04-08T00:00:00.000Z"),
      status: "sent" as const,
      subtotal: 8400,
      tax: 0,
      total: 8400,
      notes: "Website package",
    },
    {
      number: "INV-2026-002",
      leadId: leadIds[1] ?? null,
      customerName: "Tech Solutions Inc",
      issueDate: new Date("2026-04-03T00:00:00.000Z"),
      dueDate: new Date("2026-04-14T00:00:00.000Z"),
      status: "draft" as const,
      subtotal: 6200,
      tax: 0,
      total: 6200,
      notes: "Automation setup",
    },
    {
      number: "INV-2026-003",
      leadId: leadIds[2] ?? null,
      customerName: "Global Enterprises",
      issueDate: new Date("2026-03-25T00:00:00.000Z"),
      dueDate: new Date("2026-03-31T00:00:00.000Z"),
      status: "overdue" as const,
      subtotal: 11200,
      tax: 0,
      total: 11200,
      notes: "CRM onboarding package",
    },
  ];

  for (const invoice of financeInvoiceSeeds) {
    const existing = await prisma.financeInvoice.findFirst({
      where: { businessId: business.id, number: invoice.number },
      select: { id: true },
    });
    if (existing) {
      await prisma.financeInvoice.update({
        where: { id: existing.id },
        data: {
          leadId: invoice.leadId,
          customerName: invoice.customerName,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          status: invoice.status,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          notes: invoice.notes,
        },
      });
    } else {
      await prisma.financeInvoice.create({
        data: {
          businessId: business.id,
          leadId: invoice.leadId,
          customerName: invoice.customerName,
          number: invoice.number,
          currency: "USD",
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          status: invoice.status,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          notes: invoice.notes,
        },
      });
    }
  }

  const invoiceByNumber = new Map(
    (
      await prisma.financeInvoice.findMany({
        where: { businessId: business.id },
        select: { id: true, number: true },
      })
    ).map((invoice) => [invoice.number, invoice.id]),
  );

  const paymentSeeds = [
    {
      invoiceNumber: "INV-2026-001",
      amount: 4000,
      paidAt: new Date("2026-04-04T10:00:00.000Z"),
      method: "bank_transfer",
      reference: "TRX-001",
    },
    {
      invoiceNumber: "INV-2026-001",
      amount: 4400,
      paidAt: new Date("2026-04-07T10:00:00.000Z"),
      method: "card",
      reference: "TRX-002",
    },
    {
      invoiceNumber: "INV-2026-003",
      amount: 2000,
      paidAt: new Date("2026-03-27T10:00:00.000Z"),
      method: "bank_transfer",
      reference: "TRX-003",
    },
  ];

  for (const payment of paymentSeeds) {
    const invoiceId = invoiceByNumber.get(payment.invoiceNumber);
    if (!invoiceId) continue;

    const existing = await prisma.financePayment.findFirst({
      where: {
        businessId: business.id,
        invoiceId,
        reference: payment.reference,
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.financePayment.create({
        data: {
          businessId: business.id,
          invoiceId,
          amount: payment.amount,
          currency: "USD",
          paidAt: payment.paidAt,
          method: payment.method,
          reference: payment.reference,
        },
      });
    }
  }

  console.log("Seed completed:", {
    businessId: business.id,
    ownerId: owner.id,
    leads: leadSeeds.length,
    openTasks: openTaskLeadIds.length,
    financeInvoices: financeInvoiceSeeds.length,
    stockItems: stockSeeds.length,
    teamMembers: extraMembers.length + 1,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
