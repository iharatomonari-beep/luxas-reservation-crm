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
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      date: (row.block_date as string) ?? "",
      name: (row.name as string | null) ?? "",
      blockId: (row.block_id as string | null) ?? "",
      startTime: (row.start_time as string | null) ?? "",
      endTime: (row.end_time as string | null) ?? "",
      // 単一店舗pilotでは未設定=既定店舗扱いで表示OK（多店舗時は逆解決が要）。
      storeId: undefined
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.storeId, ctx),
      block_date: item.date,
      name: item.name || null,
      block_id: item.blockId || null,
      start_time: item.startTime || null,
      end_time: item.endTime || null
    };
  }
};
