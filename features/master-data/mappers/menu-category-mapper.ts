import type { MenuCategory } from "../types";
import type { DbContext, TableMapper } from "./types";

// メニューカテゴリ（テナント共通・FKなし）。fee-master 同型。
export const menuCategoryMapper: TableMapper<MenuCategory> = {
  table: "menu_categories",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      color: (row.color as string | null) ?? "",
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
      color: item.color ?? null,
      sort_order: item.sortOrder ?? 0,
      is_active: item.isActive ?? true
    };
  }
};
