import type { DbContext, TableMapper } from "./types";

// クレジットカード会社 / 電子マネー は同型（FeeMaster）。テーブル名だけ差し替えて使い回す。
type FeeMaster = { id: string; name: string; feePercent: number; sortOrder: number; isActive: boolean };

export function makeFeeMasterMapper(table: string): TableMapper<FeeMaster> {
  return {
    table,

    idOf: (item) => item.id,

    fromRow(row) {
      return {
        id: (row.legacy_id as string | null) ?? (row.id as string),
        name: (row.name as string) ?? "",
        // DBの numeric は文字列で返ることがあるため Number で正規化。
        feePercent: Number(row.fee_percent ?? 0),
        sortOrder: (row.sort_order as number) ?? 0,
        isActive: (row.is_active as boolean) ?? true
      };
    },

    toRow(item, ctx: DbContext) {
      return {
        legacy_id: item.id,
        tenant_id: ctx.tenantId,
        store_id: null, // テナント共通（店舗別上書きは将来）。
        name: item.name,
        fee_percent: item.feePercent ?? 0,
        sort_order: item.sortOrder ?? 0,
        is_active: item.isActive ?? true
      };
    }
  };
}
