import type { AttendanceRecord } from "../cost-master";
import type { DbContext, TableMapper } from "./types";

function resolveStoreId(storeId: string | undefined, ctx: DbContext): string | null {
  const code = storeId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

// 出退勤（店舗別）。出退勤→スタッフは legacy→uuid 解決＋round-trip。
// id は合成 "date:store:staff"（storeId は legacy_id から復元、staffId は round-trip列から）。
export const attendanceMapper: TableMapper<AttendanceRecord> = {
  table: "attendance",

  idOf: (item) => item.id,

  fromRow(row) {
    const legacy = (row.legacy_id as string | null) ?? (row.id as string);
    const parts = legacy.split(":");
    const storeId = parts.length >= 3 ? parts[1] : undefined; // "date:store:staff"
    return {
      id: legacy,
      storeId,
      date: (row.attend_date as string) ?? "",
      staffId: (row.staff_legacy_id as string | null) ?? "",
      clockIn: (row.clock_in as string | null) ?? "",
      clockOut: (row.clock_out as string | null) ?? ""
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.storeId, ctx),
      attend_date: item.date,
      staff_id: ctx.staffIdByLegacy[item.staffId] ?? null,
      staff_legacy_id: item.staffId ?? null,
      clock_in: item.clockIn || null,
      clock_out: item.clockOut || null
    };
  }
};
