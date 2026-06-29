import type { DbContext, TableMapper } from "./types";

// 日報は id を持たず (date, store) で一意。合成キー "date:store" を legacy_id にする。
type DailyReport = {
  date: string;
  storeId?: string;
  result: string;
  achievement: string;
  staffProposals: string;
  tomorrowPlan: string;
  plan: string;
  reflection: string;
  shiftStatus: string;
  weather: string;
  submitted?: boolean;
};

const DEFAULT_STORE_CODE = "store-shibuya";
const keyOf = (item: DailyReport) => `${item.date}:${item.storeId ?? DEFAULT_STORE_CODE}`;

function resolveStoreId(storeId: string | undefined, ctx: DbContext): string | null {
  const code = storeId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

export const dailyReportMapper: TableMapper<DailyReport> = {
  table: "daily_reports",

  idOf: keyOf,

  fromRow(row) {
    const legacy = (row.legacy_id as string | null) ?? "";
    const parts = legacy.split(":");
    return {
      date: (row.report_date as string) ?? "",
      storeId: parts.length >= 2 ? parts[1] : undefined,
      result: (row.result as string | null) ?? "",
      achievement: (row.achievement as string | null) ?? "",
      staffProposals: (row.staff_proposals as string | null) ?? "",
      tomorrowPlan: (row.tomorrow_plan as string | null) ?? "",
      plan: (row.plan as string | null) ?? "",
      reflection: (row.reflection as string | null) ?? "",
      shiftStatus: (row.shift_status as string | null) ?? "",
      weather: (row.weather as string | null) ?? "",
      submitted: (row.submitted as boolean | null) ?? false
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: keyOf(item),
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.storeId, ctx),
      report_date: item.date,
      result: item.result ?? null,
      achievement: item.achievement ?? null,
      staff_proposals: item.staffProposals ?? null,
      tomorrow_plan: item.tomorrowPlan ?? null,
      plan: item.plan ?? null,
      reflection: item.reflection ?? null,
      shift_status: item.shiftStatus ?? null,
      weather: item.weather ?? null,
      submitted: item.submitted ?? false
    };
  }
};
