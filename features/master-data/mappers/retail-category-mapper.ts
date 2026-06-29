import type { RetailCategory } from "../types";
import type { DbContext, TableMapper } from "./types";

// 物販カテゴリ（テナント共通・FKなし）。fee-master と同型。
export const retailCategoryMapper: TableMapper<RetailCategory> = {
  table: "retail_categories",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      shortName: (row.short_name as string | null) ?? undefined,
      sortOrder: (row.sort_order as number) ?? 0,
      isActive: (row.is_active as boolean) ?? true
    };
  },

  toRow(item, ctx: DbContext) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: null,
      name: item.name,
      short_name: item.shortName ?? null,
      sort_order: item.sortOrder ?? 0,
      is_active: item.isActive ?? true
    };
  }
};
