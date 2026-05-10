-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('succeeded', 'failed', 'skipped');

-- CreateTable
CREATE TABLE "automation_scenarios" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_runs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "lead_id" TEXT,
    "event_id" TEXT,
    "run_key" TEXT NOT NULL,
    "status" "AutomationRunStatus" NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_scenarios_business_id_trigger_type_is_active_idx" ON "automation_scenarios"("business_id", "trigger_type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "automation_scenarios_business_id_key_key" ON "automation_scenarios"("business_id", "key");

-- CreateIndex
CREATE INDEX "automation_runs_business_id_created_at_idx" ON "automation_runs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "automation_runs_scenario_id_created_at_idx" ON "automation_runs"("scenario_id", "created_at");

-- CreateIndex
CREATE INDEX "automation_runs_lead_id_idx" ON "automation_runs"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "automation_runs_scenario_id_run_key_key" ON "automation_runs"("scenario_id", "run_key");

-- AddForeignKey
ALTER TABLE "automation_scenarios" ADD CONSTRAINT "automation_scenarios_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "automation_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
