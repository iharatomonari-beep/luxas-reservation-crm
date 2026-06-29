import type { OptionKind, ServiceOption } from "../types";
import type { DbContext, TableMapper } from "./types";

// オプション（テナント共通・FKなし）。fee-master 同型。
export const serviceOptionMapper: TableMapper<ServiceOption> = {
  table: "service_options",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      category: (row.category as string | null) ?? "",
      price: Number(row.price ?? 0),
      sortOrder: (row.sort_order as number) ?? 0,
      onlineBookable: (row.online_bookable as boolean) ?? false,
      kind: (row.kind as OptionKind) ?? "other",
      extensionMinutes: (row.extension_minutes as number | null) ?? undefined,
      discountPercent: (row.discount_percent as number | null) ?? undefined,
      isActive: (row.is_active as boolean) ?? true,
      createdAt: row.created_at as string | undefined,
      updatedAt: row.updated_at as string | undefined
    };
  },

  toRow(item, ctx: DbContext) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: null,
      name: item.name,
      category: item.category ?? null,
      price: item.price ?? 0,
      sort_order: item.sortOrder ?? 0,
      online_bookable: item.onlineBookable ?? false,
      kind: item.kind,
      extension_minutes: item.extensionMinutes ?? null,
      discount_percent: item.discountPercent ?? null,
      is_active: item.isActive ?? true
    };
  }
};
