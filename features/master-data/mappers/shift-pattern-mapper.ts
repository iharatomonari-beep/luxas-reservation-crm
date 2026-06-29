import type { DbContext, TableMapper } from "./types";

// シフトパターン（テナント共通・参照なし）。型は shift-pattern-manager.tsx 内ローカル定義と同型。
type ShiftPattern = { id: string; name: string; startTime: string; endTime: string; sortOrder: number };

export const shiftPatternMapper: TableMapper<ShiftPattern> = {
  table: "shift_patterns",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      startTime: (row.start_time as string | null) ?? "",
      endTime: (row.end_time as string | null) ?? "",
      sortOrder: (row.sort_order as number) ?? 0
    };
  },

  toRow(item, ctx: DbContext) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: null,
      name: item.name,
      start_time: item.startTime || null,
      end_time: item.endTime || null,
      sort_order: item.sortOrder ?? 0
    };
  }
};
