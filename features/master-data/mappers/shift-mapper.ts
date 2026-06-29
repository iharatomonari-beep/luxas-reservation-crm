import type { StaffShift } from "../types";
import type { DbContext, TableMapper } from "./types";

function resolveStoreId(storeId: string | undefined, ctx: DbContext): string | null {
  const code = storeId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

// 空文字/未設定は time列に入れられないため null に。break は両方nullでないとDBのcheck制約に触れる。
function timeOrNull(value: string | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}

// DBの time は "HH:MM:SS" で返るため UI用に "HH:MM" へ。
function hhmm(value: unknown): string {
  return value ? String(value).slice(0, 5) : "";
}

export const shiftMapper: TableMapper<StaffShift> = {
  table: "shifts",

  idOf: (item) => item.id,

  fromRow(row) {
    const profile = (row.profile as { staffLegacyId?: string; storeId?: string | null }) ?? {};
    const breakStart = row.break_start ? hhmm(row.break_start) : "";
    const breakEnd = row.break_end ? hhmm(row.break_end) : "";
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      // staff_id(uuid) ではなく JS側の文字列ID を復元（UIの突き合わせ用）。
      staffId: profile.staffLegacyId ?? "",
      workDate: (row.shift_date as string) ?? "",
      startTime: hhmm(row.start_time),
      endTime: hhmm(row.end_time),
      breakStart,
      breakEnd,
      memo: (row.memo as string | null) ?? "",
      isActive: (row.is_active as boolean) ?? true,
      storeId: profile.storeId ?? undefined,
      createdAt: row.created_at as string | undefined,
      updatedAt: row.updated_at as string | undefined
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.storeId, ctx),
      // FK解決: JSの staffId(文字列) → staff.id(uuid)。未解決は null（FK/NOT NULL違反で気づける）。
      staff_id: ctx.staffIdByLegacy[item.staffId] ?? null,
      shift_date: item.workDate,
      start_time: item.startTime,
      end_time: item.endTime,
      break_start: timeOrNull(item.breakStart),
      break_end: timeOrNull(item.breakEnd),
      memo: item.memo ?? null,
      is_active: item.isActive ?? true,
      // JS側の staffId / storeId を round-trip 用に保持。
      profile: { staffLegacyId: item.staffId, storeId: item.storeId ?? null }
    };
  }
};
