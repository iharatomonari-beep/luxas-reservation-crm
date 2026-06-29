import type { DbContext, TableMapper } from "./types";

// ユーザマスタ（テナント共通・表示のみ）。★認証非接触＝public.users / Auth / user_roles とは無関係の純データ。
// 型は users-master.tsx 内ローカル定義と同型。
type UserRecord = { id: string; userName: string; loginId: string; sortOrder: number; lastLoginAt: string };

export const userDirectoryMapper: TableMapper<UserRecord> = {
  table: "user_directory",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      userName: (row.user_name as string) ?? "",
      loginId: (row.login_id as string | null) ?? "",
      sortOrder: (row.sort_order as number) ?? 0,
      lastLoginAt: (row.last_login_at as string | null) ?? ""
    };
  },

  toRow(item, ctx: DbContext) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: null,
      user_name: item.userName,
      login_id: item.loginId || null,
      sort_order: item.sortOrder ?? 0,
      last_login_at: item.lastLoginAt || null
    };
  }
};
