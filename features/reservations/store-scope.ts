import { currentStoreId as defaultStoreId } from "@/features/org/mock-data";
import type { Reservation } from "@/features/reservations/types";

/**
 * 予約の店舗スコープ判定（T063・非破壊）。
 * 現在店舗に表示してよい予約かを返す。
 * - r.storeId === currentStoreId          … その店舗の予約
 * - または (!r.storeId) かつ 既定店舗      … storeId未設定の既存データは既定店舗(渋谷)でのみ表示
 * これにより渋谷では既存全件が見え、他店舗では新規作成分だけが見える（既存が消えない）。
 */
export function isReservationInStore(reservation: Pick<Reservation, "storeId">, currentStoreId: string): boolean {
  if (reservation.storeId) {
    return reservation.storeId === currentStoreId;
  }
  return currentStoreId === defaultStoreId;
}

/** 予約配列を現在店舗で安全にフィルタする（非破壊・元配列は変更しない）。 */
export function filterReservationsByStore<T extends Pick<Reservation, "storeId">>(list: T[], currentStoreId: string): T[] {
  return list.filter((reservation) => isReservationInStore(reservation, currentStoreId));
}
