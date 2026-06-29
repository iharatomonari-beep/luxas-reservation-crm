import type { RetailSale } from "../types";
import type { DbContext, TableMapper } from "./types";

function resolveStoreId(storeId: string | undefined, ctx: DbContext): string | null {
  const code = storeId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

// 物販販売（店舗別トランザクション）。販売→商品は legacy→uuid 解決＋round-trip用に legacy も保持。
export const retailSaleMapper: TableMapper<RetailSale> = {
  table: "retail_sales",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      // storeId は未設定にする＝アプリ側で「既定店舗扱い」で表示される（単一店舗pilotで十分。
      // 多店舗運用時は store_id(uuid)→code の逆解決 or 専用列が必要）。
      storeId: undefined,
      saleDate: (row.sale_date as string) ?? "",
      customerName: (row.customer_name as string | null) ?? "",
      // 商品参照は round-trip用の legacy 列から復元（uuidではなくアプリの retailItemId）。
      retailItemId: (row.retail_item_legacy_id as string | null) ?? "",
      quantity: Number(row.quantity ?? 0),
      unitPrice: Number(row.unit_price ?? 0)
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(item.storeId, ctx),
      sale_date: item.saleDate,
      customer_name: item.customerName ?? null,
      retail_item_id: ctx.retailItemIdByLegacy[item.retailItemId] ?? null,
      retail_item_legacy_id: item.retailItemId ?? null,
      quantity: item.quantity ?? 0,
      unit_price: item.unitPrice ?? 0
    };
  }
};
