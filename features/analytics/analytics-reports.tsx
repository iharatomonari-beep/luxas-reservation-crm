"use client";

import { useMemo, useState } from "react";
import { MasterPage } from "@/features/master-data/master-page";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  initialRetailItems,
  initialRetailSales,
  initialServices,
  initialStaff,
  retailItemsStorageKey,
  retailSalesStorageKey,
  servicesStorageKey,
  staffStorageKey
} from "@/features/master-data/mock-data";
import type { RetailItem, RetailSale, ServiceMenu, StaffMember } from "@/features/master-data/types";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import type { Reservation } from "@/features/reservations/types";

type Tab = "staff" | "service" | "hourly" | "trend" | "retail";

const TABS: { key: Tab; label: string }[] = [
  { key: "staff", label: "スタッフ別売上" },
  { key: "service", label: "商品別売上" },
  { key: "hourly", label: "時間帯別来店" },
  { key: "trend", label: "顧客数推移" },
  { key: "retail", label: "物販販売" }
];

function Bar({ value, max, label, sub }: { value: number; max: number; label: string; sub: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 shrink-0 truncate text-sm text-stone-700">{label}</span>
      <div className="h-4 flex-1 overflow-hidden rounded bg-luxas-paper">
        <div className="h-full rounded bg-luxas-green" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-28 shrink-0 text-right text-sm text-stone-600">{sub}</span>
    </div>
  );
}

export function AnalyticsReports() {
  const [reservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [retailItems] = useLocalCollection<RetailItem>(retailItemsStorageKey, initialRetailItems);
  const [retailSales] = useLocalCollection<RetailSale>(retailSalesStorageKey, initialRetailSales);
  const [tab, setTab] = useState<Tab>("staff");

  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const monthReservations = useMemo(
    () => reservations.filter((r) => r.date.startsWith(month) && r.status !== "canceled"),
    [reservations, month]
  );
  const paid = useMemo(() => monthReservations.filter((r) => r.paymentStatus === "paid"), [monthReservations]);

  const staffSales = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of paid) map.set(r.staffId, (map.get(r.staffId) || 0) + (r.saleAmount ?? 0));
    return [...map.entries()].map(([id, amount]) => ({ label: staff.find((s) => s.id === id)?.displayName ?? id, amount })).sort((a, b) => b.amount - a.amount);
  }, [paid, staff]);

  const serviceSales = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of paid) map.set(r.serviceMenuId, (map.get(r.serviceMenuId) || 0) + (r.saleAmount ?? 0));
    return [...map.entries()].map(([id, amount]) => ({ label: services.find((s) => s.id === id)?.name ?? id, amount })).sort((a, b) => b.amount - a.amount);
  }, [paid, services]);

  const hourly = useMemo(() => {
    const buckets = new Array(24).fill(0) as number[];
    for (const r of monthReservations) {
      const h = Number(r.startTime.slice(0, 2));
      if (Number.isFinite(h)) buckets[h] += 1;
    }
    return buckets.map((count, h) => ({ label: `${h}時`, count })).filter((b) => b.count > 0 || (Number(b.label) >= 9 && Number(b.label) <= 22));
  }, [monthReservations]);

  const trend = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of monthReservations) {
      if (!map.has(r.date)) map.set(r.date, new Set());
      map.get(r.date)!.add(r.customerName);
    }
    return [...map.entries()].map(([date, set]) => ({ date, count: set.size })).sort((a, b) => a.date.localeCompare(b.date));
  }, [monthReservations]);

  const retailSalesByItem = useMemo(() => {
    const monthSales = retailSales.filter((s) => s.saleDate.startsWith(month));
    const nameById = new Map(retailItems.map((i) => [i.id, i.name]));
    const map = new Map<string, number>();
    for (const s of monthSales) {
      const label = nameById.get(s.retailItemId) ?? "（削除済み商品）";
      map.set(label, (map.get(label) || 0) + s.quantity * s.unitPrice);
    }
    return [...map.entries()].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount);
  }, [retailSales, retailItems, month]);
  const retailTotal = retailSalesByItem.reduce((sum, x) => sum + x.amount, 0);

  const inputClass = "rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-luxas-green";
  const maxStaff = Math.max(1, ...staffSales.map((x) => x.amount));
  const maxService = Math.max(1, ...serviceSales.map((x) => x.amount));
  const maxHour = Math.max(1, ...hourly.map((x) => x.count));
  const maxTrend = Math.max(1, ...trend.map((x) => x.count));
  const maxRetail = Math.max(1, ...retailSalesByItem.map((x) => x.amount));

  return (
    <MasterPage title="経営指標" description="会計（予約詳細→会計）で確定した売上を月単位で集計します。グラフは簡易バー表示です。">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-700"><span className="font-medium">対象月</span><input type="month" className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)} /></label>
        <div className="inline-flex flex-wrap overflow-hidden rounded-md border border-luxas-line">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} className={["px-3 py-2 text-sm font-medium transition", tab === t.key ? "bg-luxas-green text-white" : "bg-white text-stone-600 hover:bg-luxas-paper"].join(" ")}>{t.label}</button>
          ))}
        </div>
      </div>

      <section className="rounded-lg border border-luxas-line bg-white p-5">
        {tab === "staff" ? (
          staffSales.length ? staffSales.map((x) => <Bar key={x.label} label={x.label} value={x.amount} max={maxStaff} sub={`¥${x.amount.toLocaleString()}`} />) : <p className="text-sm text-stone-500">会計済データがありません。</p>
        ) : null}
        {tab === "service" ? (
          serviceSales.length ? serviceSales.map((x) => <Bar key={x.label} label={x.label} value={x.amount} max={maxService} sub={`¥${x.amount.toLocaleString()}`} />) : <p className="text-sm text-stone-500">会計済データがありません。</p>
        ) : null}
        {tab === "hourly" ? (
          hourly.length ? hourly.map((x) => <Bar key={x.label} label={x.label} value={x.count} max={maxHour} sub={`${x.count}件`} />) : <p className="text-sm text-stone-500">予約データがありません。</p>
        ) : null}
        {tab === "trend" ? (
          trend.length ? trend.map((x) => <Bar key={x.date} label={x.date.slice(5)} value={x.count} max={maxTrend} sub={`${x.count}名`} />) : <p className="text-sm text-stone-500">予約データがありません。</p>
        ) : null}
        {tab === "retail" ? (
          retailSalesByItem.length ? (
            <>
              <p className="mb-2 text-sm text-stone-600">物販売上合計 <b className="text-luxas-ink">¥{retailTotal.toLocaleString()}</b></p>
              {retailSalesByItem.map((x) => (
                <Bar key={x.label} label={x.label} value={x.amount} max={maxRetail} sub={`¥${x.amount.toLocaleString()}`} />
              ))}
            </>
          ) : (
            <p className="text-sm text-stone-500">物販販売の登録がありません（物販販売画面から登録できます）。</p>
          )
        ) : null}
        <p className="mt-4 text-[11px] text-stone-400">※ 売上系は会計確定済みの予約のみ集計。会計未実装の予約は0。前年比・目標達成度は基準データが無いため省略（要確認）。</p>
      </section>
    </MasterPage>
  );
}
