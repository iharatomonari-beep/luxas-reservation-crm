import type { TurnawayRecord } from "@/features/reservations/types";
import type { DbContext, TableMapper } from "./types";

function resolveStoreId(storeId: string | undefined, ctx: DbContext): string | null {
  const code = storeId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

// 返客（店舗別・log）。service/staff/option は legacy ID保持（解決なし＝表示は移行済みマスタの id=legacy_id で名前引き）。
export const turnawayMapper: TableMapper<TurnawayRecord> = {
  table: "turnaways",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      date: (row.turnaway_date as string) ?? "",
      startTime: (row.start_time as string | null) ?? "",
      kind: (row.kind as string | null) ?? "",
      gender: ((row.gender as string | null) ?? "") as TurnawayRecord["gender"],
      reason: (row.reason as string | null) ?? "",
      comment: (row.comment as string | null) ?? "",
      serviceMenuId: (row.service_menu_id as string | null) ?? undefined,
      optionIds: (row.option_ids as string[] | null) ?? [],
      preference: (row.preference as string | null) ?? undefined,
      nominatedStaffId: (row.nominated_staff_id as string | null) ?? undefined,
      storeId: undefined,
      createdAt: (row.created_at as string | null) ?? undefined
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.storeId, ctx),
      turnaway_date: item.date,
      start_time: item.startTime || null,
      kind: item.kind || null,
      gender: item.gender || null,
      reason: item.reason || null,
      comment: item.comment || null,
      service_menu_id: item.serviceMenuId || null,
      option_ids: item.optionIds ?? [],
      preference: item.preference || null,
      nominated_staff_id: item.nominatedStaffId || null
    };
  }
};
