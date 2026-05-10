import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { createStockItem, listStockItems } from "@/lib/domain/stock";

export const runtime = "nodejs";

type CreateStockBody = {
  sku?: string;
  name?: string;
  category?: string;
  qty?: number;
  min_qty?: number;
  price?: number;
};

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const items = await listStockItems(auth.session.businessId);
    return ok({ items });
  } catch (error) {
    console.error("Failed to list stock items", error);
    return fail("STOCK_LIST_FAILED", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as CreateStockBody;
    const sku = body.sku?.trim();
    const name = body.name?.trim();

    if (!sku) return fail("SKU_REQUIRED", 400);
    if (!name) return fail("NAME_REQUIRED", 400);
    if (!Number.isFinite(body.price) || Number(body.price) <= 0) {
      return fail("PRICE_INVALID", 400);
    }

    const item = await createStockItem({
      businessId: auth.session.businessId,
      sku,
      name,
      category: body.category?.trim() || "General",
      qty: Number.isFinite(body.qty) ? Math.max(0, Math.floor(Number(body.qty))) : 0,
      minQty: Number.isFinite(body.min_qty) ? Math.max(0, Math.floor(Number(body.min_qty))) : 1,
      price: Number(body.price),
    });

    return ok({ item }, { status: 201 });
  } catch (error) {
    console.error("Failed to create stock item", error);
    return fail("STOCK_CREATE_FAILED", 500);
  }
}
