import type { ServiceMenu } from "../types";
import type { DbContext, TableMapper } from "./types";

// 店舗解決: services はJS側で storeScope(all/selected)+storeIds[] を持つ（全店共通/複数店舗）。
// DBの store_id は単一NOT NULLのため、pilotでは「選択店舗の先頭 or 既定店舗」に解決し、
// 本来の storeScope/storeIds は profile に保持する（共有カタログ向けRLSの厳密化は将来）。
function resolveStoreId(item: ServiceMenu, ctx: DbContext): string | null {
  const code =
    item.storeScope === "selected" && item.storeIds && item.storeIds.length > 0
      ? item.storeIds[0]
      : ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

export const serviceMapper: TableMapper<ServiceMenu> = {
  table: "services",

  idOf: (item) => item.id,

  fromRow(row) {
    const profile = (row.profile as Partial<ServiceMenu>) ?? {};
    return {
      // profile を先に展開し、コア列で上書き（DB列を正とする）。
      ...profile,
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      category: (row.category as string) ?? "",
      durationMinutes: (row.duration_minutes as number) ?? 0,
      price: (row.price as number) ?? 0,
      sortOrder: (row.sort_order as number) ?? 0,
      isActive: (row.is_active as boolean) ?? true,
      createdAt: (row.created_at as string | undefined) ?? profile.createdAt,
      updatedAt: (row.updated_at as string | undefined) ?? profile.updatedAt
    } as ServiceMenu;
  },

  toRow(item, ctx) {
    // コア列を取り出し、残り（PM拡張項目・storeScope/storeIds 等）は profile へ。
    const { id, name, category, durationMinutes, price, sortOrder, isActive, ...rest } = item;

    const profile: Record<string, unknown> = { ...rest };

    return {
      legacy_id: id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item, ctx),
      name,
      category,
      duration_minutes: durationMinutes ?? 0,
      price: price ?? 0,
      sort_order: sortOrder ?? 0,
      is_active: isActive ?? true,
      memo: item.description ?? null,
      profile
    };
  }
};
