"use client";

import { useMemo } from "react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import type { Reservation } from "@/features/reservations/types";

export function TopKpi() {
  const [reservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);

  const kpi = useMemo(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthRes = reservations.filter((r) => r.date.startsWith(month) && r.status !== "canceled");
    const paid = monthRes.filter((r) => r.paymentStatus === "paid");
    const sales = paid.reduce((sum, r) => sum + (r.saleAmount ?? 0), 0);
    const visitors = new Set(monthRes.map((r) => r.customerName)).size;
    return { sales, count: monthRes.length, visitors, paidCount: paid.length };
  }, [reservations]);

  const cards = [
    { label: "当月売上（会計済）", value: `¥${kpi.sales.toLocaleString()}` },
    { label: "当月予約件数", value: `${kpi.count}件` },
    { label: "当月来店数", value: `${kpi.visitors}名` },
    { label: "会計済件数", value: `${kpi.paidCount}件` }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-luxas-line bg-white p-4">
          <p className="text-xs font-medium text-stone-500">{c.label}</p>
          <p className="mt-1 text-xl font-semibold text-luxas-ink">{c.value}</p>
        </div>
      ))}
      <p className="md:col-span-2 xl:col-span-4 text-[11px] text-stone-400">※ 売上は会計（予約詳細→会計）確定分の当月集計。前年比・目標達成度は基準データ未整備のため未表示（要確認）。</p>
    </section>
  );
}
