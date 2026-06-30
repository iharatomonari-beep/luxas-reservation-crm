import type { OnlineBlock } from "@/features/store-ops/online-blocks";
import type { DbContext, TableMapper } from "./types";

function resolveStoreId(storeId: string | undefined, ctx: DbContext): string | null {
  const code = storeId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

// オンライン予約停止枠（店舗別・参照なし）。
export const onlineBlockMapper: TableMapper<OnlineBlock> = {
  table: "online_blocks",

  idOf: (item) => item.id,

  fromRow(row) {
    // アプリ側ID（storeId=店舗code / staffId=staffのlegacy_id）は profile から復元する
    // （fromRow は ctx を持たず uuid→code/legacy 逆引きできないため）。
    const profile = (row.profile as { storeId?: string | null; staffId?: string | null }) ?? {};
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      date: (row.block_date as string) ?? "",
      name: (row.name as string | null) ?? "",
      blockId: (row.block_id as string | null) ?? "",
      startTime: (row.start_time as string | null) ?? "",
      endTime: (row.end_time as string | null) ?? "",
      storeId: (profile.storeId as string | undefined) ?? undefined,
      staffId: (profile.staffId as string | undefined) ?? undefined
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.storeId, ctx),
      // staff_id(uuid) は RLS/解決用。JS側の staffId(legacy) は profile に保持。
      staff_id: item.staffId ? (ctx.staffIdByLegacy[item.staffId] ?? null) : null,
      block_date: item.date,
      name: item.name || null,
      block_id: item.blockId || null,
      start_time: item.startTime || null,
      end_time: item.endTime || null,
      profile: { storeId: item.storeId ?? null, staffId: item.staffId ?? null }
    };
  }
};
