import type { RetailItem } from "../types";
import type { DbContext, TableMapper } from "./types";

// 物販商品（テナント共通・カテゴリは名前文字列で疎結合＝FKなし）。fee-master と同型。
export const retailItemMapper: TableMapper<RetailItem> = {
  table: "retail_items",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      category: (row.category as string | null) ?? "",
      price: Number(row.price ?? 0),
      sortOrder: (row.sort_order as number) ?? 0,
      isActive: (row.is_active as boolean) ?? true,
      createdAt: row.created_at as string | undefined,
      updatedAt: row.updated_at as string | undefined
    };
  },

  toRow(item, ctx: DbContext) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: null,
      name: item.name,
      category: item.category ?? null,
      price: item.price ?? 0,
      sort_order: item.sortOrder ?? 0,
      is_active: item.isActive ?? true
    };
  }
};
