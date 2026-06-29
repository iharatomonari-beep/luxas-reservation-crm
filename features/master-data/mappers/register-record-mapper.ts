import type { RegisterRecord } from "../cost-master";
import type { DbContext, TableMapper } from "./types";

// 店舗解決: JSの storeId（"store-shibuya" 等＝code相当）を DBの store_id(uuid) に変換。
// 未設定は既定店舗。store_id は必ず実uuidに解決する（RLSのWITH CHECKを通すため null にしない）。
function resolveStoreId(storeId: string | undefined, ctx: DbContext): string | null {
  const code = storeId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

// レジ記録（店舗別・日次・FKなし）。突き合わせキー＝合成ID "date:store:kind"（legacy_id）。
// storeId は legacy_id（合成ID）から復元する（profile列を持たないため）。
export const registerRecordMapper: TableMapper<RegisterRecord> = {
  table: "register_records",

  idOf: (item) => item.id,

  fromRow(row) {
    const legacy = (row.legacy_id as string | null) ?? (row.id as string);
    // 合成ID "date:storeId:kind"（旧データは "date:kind"）から storeId を復元。
    const parts = legacy.split(":");
    const storeId = parts.length >= 3 ? parts[1] : undefined;
    return {
      id: legacy,
      storeId,
      date: (row.record_date as string) ?? "",
      kind: (row.kind as RegisterRecord["kind"]) ?? "open",
      counts: (row.counts as Record<string, number>) ?? {},
      memo: (row.memo as string | null) ?? ""
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.storeId, ctx),
      record_date: item.date,
      kind: item.kind,
      counts: item.counts ?? {},
      memo: item.memo ?? null
    };
  }
};
