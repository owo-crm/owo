import { prisma } from "@/lib/db";
import type { StockItemDto } from "@/lib/types/domain";

function decimalToNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    const maybe = value as { toNumber: () => number };
    return maybe.toNumber();
  }
  return 0;
}

function toStockItemDto(item: {
  id: string;
  businessId: string;
  sku: string;
  name: string;
  category: string;
  qty: number;
  minQty: number;
  price: unknown;
  createdAt: Date;
  updatedAt: Date;
}): StockItemDto {
  return {
    id: item.id,
    business_id: item.businessId,
    sku: item.sku,
    name: item.name,
    category: item.category,
    qty: item.qty,
    min_qty: item.minQty,
    price: decimalToNumber(item.price),
    created_at: item.createdAt.toISOString(),
    updated_at: item.updatedAt.toISOString(),
  };
}

export async function listStockItems(businessId: string) {
  const items = await prisma.stockItem.findMany({
    where: { businessId },
    orderBy: [{ createdAt: "desc" }],
  });

  return items.map((item) => toStockItemDto(item));
}

export async function createStockItem(input: {
  businessId: string;
  sku: string;
  name: string;
  category: string;
  qty: number;
  minQty: number;
  price: number;
}) {
  const created = await prisma.stockItem.create({
    data: {
      businessId: input.businessId,
      sku: input.sku,
      name: input.name,
      category: input.category,
      qty: input.qty,
      minQty: input.minQty,
      price: input.price,
    },
  });

  return toStockItemDto(created);
}

export async function patchStockItem(input: {
  id: string;
  businessId: string;
  sku?: string;
  name?: string;
  category?: string;
  qty?: number;
  minQty?: number;
  price?: number;
}) {
  const existing = await prisma.stockItem.findFirst({
    where: { id: input.id, businessId: input.businessId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("STOCK_ITEM_NOT_FOUND");
  }

  const updated = await prisma.stockItem.update({
    where: { id: existing.id },
    data: {
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.qty !== undefined ? { qty: input.qty } : {}),
      ...(input.minQty !== undefined ? { minQty: input.minQty } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
    },
  });

  return toStockItemDto(updated);
}
