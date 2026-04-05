-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('manual', 'google_sheet', 'website_form', 'api', 'meta_form_direct', 'import_file');

-- CreateEnum
CREATE TYPE "IngestFamily" AS ENUM ('google_sheet', 'website_form', 'api', 'meta_form_direct', 'import_file');

-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('queued', 'sent', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "telegram_id" TEXT,
    "email" VARCHAR(320),
    "display_name" TEXT NOT NULL,
    "is_platform_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "follow_up_task_title" TEXT NOT NULL DEFAULT 'Follow up lead',
    "follow_up_task_due_hours" INTEGER NOT NULL DEFAULT 24,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_members" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_statuses" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color_hex" TEXT NOT NULL DEFAULT '#4b5563',
    "position" INTEGER NOT NULL,
    "is_won" BOOLEAN NOT NULL DEFAULT false,
    "is_lost" BOOLEAN NOT NULL DEFAULT false,
    "is_follow_up" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "source_external_key" TEXT,
    "source_payload_hash" TEXT,
    "dedupe_key" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" VARCHAR(320),
    "note" TEXT,
    "metadata" JSONB,
    "status_id" TEXT,
    "owner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "assignee_id" TEXT,
    "created_by_id" TEXT,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "due_at" TIMESTAMP(3),
    "done_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_events" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "lead_id" TEXT,
    "task_id" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingest_sources" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "family" "IngestFamily" NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "secret_hash" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingest_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingest_receipts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "source_key" TEXT NOT NULL,
    "source_family" "IngestFamily" NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "lead_id" TEXT,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingest_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_submissions" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "utm" JSONB,
    "name" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "telegram" TEXT,
    "preferred_contact" TEXT NOT NULL,
    "consent_to_contact" BOOLEAN NOT NULL DEFAULT false,
    "business_type" TEXT NOT NULL,
    "team_size" TEXT NOT NULL,
    "current_tools" TEXT NOT NULL,
    "main_pains" TEXT NOT NULL,
    "feature_priorities" JSONB NOT NULL,
    "preferred_workspace" TEXT NOT NULL,
    "ideal_lead_card_notes" TEXT NOT NULL,
    "preferred_style" TEXT NOT NULL,
    "willingness_to_pay" TEXT NOT NULL,
    "early_access_interest" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "direction" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "payload" JSONB,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'queued',
    "provider_message_id" TEXT,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "business_members_business_id_idx" ON "business_members"("business_id");

-- CreateIndex
CREATE INDEX "business_members_user_id_idx" ON "business_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_members_business_id_user_id_key" ON "business_members"("business_id", "user_id");

-- CreateIndex
CREATE INDEX "lead_statuses_business_id_idx" ON "lead_statuses"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_statuses_business_id_key_key" ON "lead_statuses"("business_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "lead_statuses_business_id_position_key" ON "lead_statuses"("business_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "leads_uid_key" ON "leads"("uid");

-- CreateIndex
CREATE INDEX "leads_business_id_dedupe_key_idx" ON "leads"("business_id", "dedupe_key");

-- CreateIndex
CREATE INDEX "leads_business_id_created_at_idx" ON "leads"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "leads_business_id_status_id_idx" ON "leads"("business_id", "status_id");

-- CreateIndex
CREATE INDEX "leads_business_id_owner_id_idx" ON "leads"("business_id", "owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_business_source_external_key_unique" ON "leads"("business_id", "source", "source_external_key");

-- CreateIndex
CREATE INDEX "tasks_business_id_done_at_idx" ON "tasks"("business_id", "done_at");

-- CreateIndex
CREATE INDEX "tasks_business_id_due_at_idx" ON "tasks"("business_id", "due_at");

-- CreateIndex
CREATE INDEX "tasks_business_id_assignee_id_idx" ON "tasks"("business_id", "assignee_id");

-- CreateIndex
CREATE INDEX "tasks_lead_id_idx" ON "tasks"("lead_id");

-- CreateIndex
CREATE INDEX "business_events_business_id_created_at_idx" ON "business_events"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "business_events_business_id_type_idx" ON "business_events"("business_id", "type");

-- CreateIndex
CREATE INDEX "business_events_lead_id_idx" ON "business_events"("lead_id");

-- CreateIndex
CREATE INDEX "business_events_task_id_idx" ON "business_events"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingest_sources_key_key" ON "ingest_sources"("key");

-- CreateIndex
CREATE INDEX "ingest_sources_business_id_family_idx" ON "ingest_sources"("business_id", "family");

-- CreateIndex
CREATE INDEX "ingest_receipts_business_id_created_at_idx" ON "ingest_receipts"("business_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ingest_receipts_business_id_source_key_idempotency_key_key" ON "ingest_receipts"("business_id", "source_key", "idempotency_key");

-- CreateIndex
CREATE INDEX "survey_submissions_created_at_idx" ON "survey_submissions"("created_at");

-- CreateIndex
CREATE INDEX "survey_submissions_language_idx" ON "survey_submissions"("language");

-- CreateIndex
CREATE INDEX "email_outbox_submission_id_idx" ON "email_outbox"("submission_id");

-- CreateIndex
CREATE INDEX "email_outbox_status_created_at_idx" ON "email_outbox"("status", "created_at");

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_statuses" ADD CONSTRAINT "lead_statuses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "lead_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_events" ADD CONSTRAINT "business_events_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_events" ADD CONSTRAINT "business_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_events" ADD CONSTRAINT "business_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_events" ADD CONSTRAINT "business_events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingest_sources" ADD CONSTRAINT "ingest_sources_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingest_receipts" ADD CONSTRAINT "ingest_receipts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingest_receipts" ADD CONSTRAINT "ingest_receipts_source_key_fkey" FOREIGN KEY ("source_key") REFERENCES "ingest_sources"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingest_receipts" ADD CONSTRAINT "ingest_receipts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "survey_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

