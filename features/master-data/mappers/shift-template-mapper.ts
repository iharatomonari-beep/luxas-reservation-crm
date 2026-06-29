import type { DbContext, TableMapper } from "./types";

// シフトひな型（テナント共通・参照なし・現状UI表示のみ）。型は shift-templates.tsx 内ローカル定義と同型。
type ShiftTemplate = { id: string; name: string; staffCount: number; shiftCount: number; terminal: string; sortOrder: number };

export const shiftTemplateMapper: TableMapper<ShiftTemplate> = {
  table: "shift_templates",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      staffCount: Number(row.staff_count ?? 0),
      shiftCount: Number(row.shift_count ?? 0),
      terminal: (row.terminal as string | null) ?? "",
      sortOrder: (row.sort_order as number) ?? 0
    };
  },

  toRow(item, ctx: DbContext) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: null,
      name: item.name,
      staff_count: item.staffCount ?? 0,
      shift_count: item.shiftCount ?? 0,
      terminal: item.terminal || null,
      sort_order: item.sortOrder ?? 0
    };
  }
};
