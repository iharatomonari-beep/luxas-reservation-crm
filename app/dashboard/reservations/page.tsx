import { Suspense } from "react";
import { ReservationLedger } from "@/features/reservations/reservation-ledger";

export default function ReservationsPage() {
  return (
    <Suspense fallback={<div className="rounded-lg border border-luxas-line bg-white p-5 text-sm text-stone-600">読み込み中...</div>}>
      <ReservationLedger />
    </Suspense>
  );
}
