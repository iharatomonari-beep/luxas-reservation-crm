import type { StaffMember, StaffRole } from "../types";
import type { DbContext, TableMapper } from "./types";

// 店舗解決: JSの homeStoreId（"store-shibuya" 等＝code相当）を DBの store_id(uuid) に変換。
// 未設定や未解決は既定店舗にフォールバックする。
function resolveStoreId(homeStoreId: string | undefined, ctx: DbContext): string | null {
  const code = homeStoreId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

// PM拡張項目は DBに専用列が無いため `profile jsonb` にまとめて格納する。
// service_menu_ids(uuid[]) は services 未移行のため pilot中は空にし、文字列IDは profile に退避する。
export const staffMapper: TableMapper<StaffMember> = {
  table: "staff",

  idOf: (item) => item.id,

  fromRow(row) {
    const profile = (row.profile as Partial<StaffMember>) ?? {};
    return {
      // profile を先に展開し、コア列で上書き（DB列を正とする）。
      ...profile,
      id: (row.legacy_id as string | null) ?? (row.id as string),
      fullName: (row.full_name as string) ?? "",
      displayName: (row.display_name as string) ?? "",
      role: (row.role as StaffRole) ?? "therapist",
      sortOrder: (row.sort_order as number) ?? 0,
      isActive: (row.is_active as boolean) ?? true,
      serviceMenuIds: (profile.serviceMenuIds as string[] | undefined) ?? [],
      createdAt: (row.created_at as string | undefined) ?? profile.createdAt,
      updatedAt: (row.updated_at as string | undefined) ?? profile.updatedAt
    } as StaffMember;
  },

  toRow(item, ctx) {
    // コア列を取り出し、残り（PM拡張項目・在籍期間・createdAt/updatedAt 等）は profile へ。
    const { id, fullName, displayName, role, sortOrder, isActive, serviceMenuIds, ...rest } = item;

    const profile: Record<string, unknown> = {
      ...rest,
      // pilot中は serviceMenuIds を profile に退避（services移行後に本列へ昇格）。
      serviceMenuIds: serviceMenuIds ?? []
    };

    return {
      legacy_id: id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.homeStoreId, ctx),
      full_name: fullName,
      display_name: displayName,
      role,
      sort_order: sortOrder ?? 0,
      is_active: isActive ?? true,
      service_menu_ids: [],
      memo: item.freeMessage ?? null,
      profile
    };
  }
};
