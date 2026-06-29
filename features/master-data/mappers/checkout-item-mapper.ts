import type { CheckoutItem, CheckoutItemKind } from "../types";
import type { DbContext, TableMapper } from "./types";

// 会計アイテムマスタ（テナント共通・FKなし）。fee-master と同型の素直な変換。
export const checkoutItemMapper: TableMapper<CheckoutItem> = {
  table: "checkout_items",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      kind: (row.kind as CheckoutItemKind) ?? "discount",
      name: (row.name as string) ?? "",
      amount: Number(row.amount ?? 0),
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
      store_id: null, // テナント共通。
      kind: item.kind,
      name: item.name,
      amount: item.amount ?? 0,
      sort_order: item.sortOrder ?? 0,
      is_active: item.isActive ?? true
    };
  }
};
