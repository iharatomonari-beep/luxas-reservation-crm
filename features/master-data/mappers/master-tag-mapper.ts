import type { MasterTag, TagKind } from "../types";
import type { DbContext, TableMapper } from "./types";

// タグ（顧客/予約ルート/施術カルテ）= 1テーブル+kind。テナント共通・FKなし。fee-master 同型。
// 予約の bookingTagIds は legacy_id を参照するため、id=legacy_id 復元で参照を維持する。
export const masterTagMapper: TableMapper<MasterTag> = {
  table: "master_tags",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      code: (row.code as string | null) ?? "",
      kind: (row.kind as TagKind) ?? "customer",
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
      code: item.code ?? null,
      kind: item.kind,
      sort_order: item.sortOrder ?? 0,
      is_active: item.isActive ?? true
    };
  }
};
