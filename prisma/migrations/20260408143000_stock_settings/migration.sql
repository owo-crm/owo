-- CreateTable
CREATE TABLE "business_settings" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "email_address" TEXT,
    "phone_number" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC+1 (Central European Time)',
    "language" TEXT NOT NULL DEFAULT 'English',
    "notification_email_alerts" BOOLEAN NOT NULL DEFAULT true,
    "notification_push_alerts" BOOLEAN NOT NULL DEFAULT true,
    "notification_task_reminders" BOOLEAN NOT NULL DEFAULT true,
    "security_two_factor" BOOLEAN NOT NULL DEFAULT false,
    "security_session_timeout" TEXT NOT NULL DEFAULT '30 minutes',
    "appearance_theme_mode" TEXT NOT NULL DEFAULT 'Light',
    "appearance_density" TEXT NOT NULL DEFAULT 'Comfortable',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "min_qty" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_settings_business_id_key" ON "business_settings"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_items_business_id_sku_key" ON "stock_items"("business_id", "sku");

-- CreateIndex
CREATE INDEX "stock_items_business_id_category_idx" ON "stock_items"("business_id", "category");

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
