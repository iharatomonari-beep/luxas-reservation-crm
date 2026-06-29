import type { ExpenseAccount } from "../cost-master";
import type { DbContext, TableMapper } from "./types";

// 経費科目（テナント共通マスタ・FKなし）。fee-master と同型。
export const expenseAccountMapper: TableMapper<ExpenseAccount> = {
  table: "expense_accounts",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      subName: (row.sub_name as string | null) ?? "",
      sortOrder: (row.sort_order as number) ?? 0,
      isActive: (row.is_active as boolean) ?? true
    };
  },

  toRow(item, ctx: DbContext) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: null,
      name: item.name,
      sub_name: item.subName ?? null,
      sort_order: item.sortOrder ?? 0,
      is_active: item.isActive ?? true
    };
  }
};
