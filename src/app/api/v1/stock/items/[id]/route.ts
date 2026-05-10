import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { patchStockItem } from "@/lib/domain/stock";

export const runtime = "nodejs";

type PatchStockBody = {
  sku?: string;
  name?: string;
  category?: string;
  qty?: number;
  min_qty?: number;
  price?: number;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  if (!id) return fail("INVALID_STOCK_ID", 400);

  try {
    const body = (await request.json()) as PatchStockBody;

    if (body.price !== undefined && (!Number.isFinite(body.price) || Number(body.price) <= 0)) {
      return fail("PRICE_INVALID", 400);
    }

    const item = await patchStockItem({
      id,
      businessId: auth.session.businessId,
      ...(body.sku !== undefined ? { sku: body.sku.trim() } : {}),
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.category !== undefined ? { category: body.category.trim() } : {}),
      ...(body.qty !== undefined ? { qty: Math.max(0, Math.floor(Number(body.qty))) } : {}),
      ...(body.min_qty !== undefined
        ? { minQty: Math.max(0, Math.floor(Number(body.min_qty))) }
        : {}),
      ...(body.price !== undefined ? { price: Number(body.price) } : {}),
    });

    return ok({ item });
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_ITEM_NOT_FOUND") {
      return fail("STOCK_ITEM_NOT_FOUND", 404);
    }
    console.error("Failed to patch stock item", error);
    return fail("STOCK_PATCH_FAILED", 500);
  }
}
