import type { RoomKind, ServiceRoom } from "../types";
import type { DbContext, TableMapper } from "./types";

// ブースは店舗スコープ（案B）。homeStoreId の店舗に store_id を解決する。
// 未設定や未解決は既定店舗(渋谷)へフォールバック。アプリ側の店舗id(homeStoreId)は profile に往復保持する
// （fromRow は ctx を受け取らないため、store_id(uuid)→code 逆引きではなく profile から復元する）。
function resolveStoreId(homeStoreId: string | undefined, ctx: DbContext): string | null {
  const code = homeStoreId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

export const roomMapper: TableMapper<ServiceRoom> = {
  table: "rooms",

  idOf: (item) => item.id,

  fromRow(row) {
    const profile = (row.profile as Partial<ServiceRoom>) ?? {};
    return {
      ...profile,
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      kind: (row.kind as RoomKind) ?? "treatment",
      memo: (row.memo as string | null) ?? "",
      isActive: (row.is_active as boolean) ?? true,
      // 所属店舗は profile から復元（未設定は undefined＝既定店舗扱い）。
      homeStoreId: (profile.homeStoreId as string | undefined) ?? undefined
    } as ServiceRoom;
  },

  toRow(item, ctx) {
    const { id, name, kind, memo, isActive, ...rest } = item;
    const profile: Record<string, unknown> = { ...rest };
    return {
      legacy_id: id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.homeStoreId, ctx),
      name,
      kind,
      memo: memo ?? null,
      is_active: isActive ?? true,
      profile
    };
  }
};
