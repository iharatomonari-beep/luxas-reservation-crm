import type { DbContext, TableMapper } from "./types";

// データ不備（テナント共通・表示のみ）。型は data-errors-manager.tsx 内ローカル定義と同型。
type DataError = { id: string; title: string; occurredAt: string; category: string; detail: string };

export const dataErrorMapper: TableMapper<DataError> = {
  table: "data_errors",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      title: (row.title as string) ?? "",
      occurredAt: (row.occurred_at as string | null) ?? "",
      category: (row.category as string | null) ?? "",
      detail: (row.detail as string | null) ?? ""
    };
  },

  toRow(item, ctx: DbContext) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: null,
      title: item.title,
      occurred_at: item.occurredAt || null,
      category: item.category || null,
      detail: item.detail || null
    };
  }
};
