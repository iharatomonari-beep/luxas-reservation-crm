import type { Reservation, ReservationStatus } from "@/features/reservations/types";
import type { DbContext, TableMapper } from "./types";

function resolveStoreId(storeId: string | undefined, ctx: DbContext): string | null {
  const code = storeId || ctx.defaultStoreCode;
  return ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

// DBの time は "HH:MM:SS" で返るため UI用に "HH:MM" へ。
function hhmm(value: unknown): string {
  return value ? String(value).slice(0, 5) : "";
}

// reservations は staff/service/room を参照（いずれも legacy_id→uuid 解決が必要）。
// customer_id は顧客未移行のため当面 null。customer_name/phone は保持（フェーズ4で顧客連携）。
// JS側の参照ID（staffId/serviceMenuId/roomId/storeId/customerId）は round-trip 用に profile へ。
export const reservationMapper: TableMapper<Reservation> = {
  table: "reservations",

  idOf: (item) => item.id,

  fromRow(row) {
    const profile = (row.profile as Partial<Reservation>) ?? {};
    return {
      ...profile,
      id: (row.legacy_id as string | null) ?? (row.id as string),
      date: (row.reservation_date as string) ?? "",
      startTime: hhmm(row.start_time),
      endTime: hhmm(row.end_time),
      customerName: (row.customer_name as string) ?? "",
      phone: (row.customer_phone as string | null) ?? "",
      status: (row.status as ReservationStatus) ?? "booked",
      memo: (row.memo as string | null) ?? "",
      // 参照ID（描画で必須）は profile から復元。欠損行（オンライン予約=profile空 等）でも
      // 必ず文字列にして台帳の描画クラッシュを防ぐ。
      serviceMenuId: (profile.serviceMenuId as string | undefined) ?? "",
      staffId: (profile.staffId as string | undefined) ?? "",
      roomId: (profile.roomId as string | undefined) ?? ""
    } as Reservation;
  },

  toRow(item, ctx) {
    const {
      id,
      date,
      startTime,
      endTime,
      customerName,
      phone,
      serviceMenuId,
      staffId,
      roomId,
      status,
      memo,
      storeId,
      customerId,
      ...rest
    } = item;

    // 拡張項目＋JS参照ID（round-trip用）を profile に集約。
    const profile: Record<string, unknown> = {
      ...rest,
      serviceMenuId,
      staffId,
      roomId,
      storeId: storeId ?? null,
      customerId: customerId ?? null
    };

    return {
      legacy_id: id,
      tenant_id: ctx.tenantId,
      store_id: resolveStoreId(storeId, ctx),
      customer_id: null, // 顧客未移行（フェーズ4）。名前/電話で保持。
      customer_name: customerName || "ゲスト",
      customer_phone: phone || null,
      staff_id: ctx.staffIdByLegacy[staffId] ?? null,
      service_id: ctx.serviceIdByLegacy[serviceMenuId] ?? null,
      room_id: ctx.roomIdByLegacy[roomId] ?? null,
      reservation_date: date,
      start_time: startTime,
      end_time: endTime,
      status: status ?? "booked",
      memo: memo ?? null,
      profile
    };
  }
};
