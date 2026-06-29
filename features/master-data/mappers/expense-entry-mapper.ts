import type { ExpenseEntry } from "../cost-master";
import type { DbContext, TableMapper } from "./types";

function resolveStoreId(storeId: string | undefined, ctx: DbContext): string | null {
  const code = storeId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

// 経費明細（店舗別）。明細→科目は legacy→uuid 解決＋round-trip。
export const expenseEntryMapper: TableMapper<ExpenseEntry> = {
  table: "expense_entries",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      // 単一店舗pilotでは未設定=既定店舗扱いで表示OK（多店舗時は逆解決が要）。
      storeId: undefined,
      date: (row.expense_date as string) ?? "",
      // 科目参照は round-trip用の legacy 列から復元（アプリの accountId）。
      accountId: (row.account_legacy_id as string | null) ?? "",
      amount: Number(row.amount ?? 0),
      note: (row.note as string | null) ?? "",
      targetMonth: (row.target_month as string | null) ?? ""
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.storeId, ctx),
      expense_date: item.date,
      account_id: ctx.expenseAccountIdByLegacy[item.accountId] ?? null,
      account_legacy_id: item.accountId ?? null,
      amount: item.amount ?? 0,
      note: item.note ?? null,
      target_month: item.targetMonth ?? null
    };
  }
};
