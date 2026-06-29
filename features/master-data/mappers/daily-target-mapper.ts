import type { DbContext, TableMapper } from "./types";

// 日次目標は id を持たず (date, store) で一意。合成キー "date:store" を legacy_id にする。
type DailyTarget = { date: string; amount: number; comment: string; storeId?: string };

const DEFAULT_STORE_CODE = "store-shibuya";
const keyOf = (item: DailyTarget) => `${item.date}:${item.storeId ?? DEFAULT_STORE_CODE}`;

function resolveStoreId(storeId: string | undefined, ctx: DbContext): string | null {
  const code = storeId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

export const dailyTargetMapper: TableMapper<DailyTarget> = {
  table: "daily_targets",

  idOf: keyOf,

  fromRow(row) {
    const legacy = (row.legacy_id as string | null) ?? "";
    const parts = legacy.split(":"); // "date:store"（date は YYYY-MM-DD で ":" を含まない）
    return {
      date: (row.target_date as string) ?? "",
      amount: Number(row.amount ?? 0),
      comment: (row.comment as string | null) ?? "",
      storeId: parts.length >= 2 ? parts[1] : undefined
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: keyOf(item),
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.storeId, ctx),
      target_date: item.date,
      amount: item.amount ?? 0,
      comment: item.comment ?? null
    };
  }
};
