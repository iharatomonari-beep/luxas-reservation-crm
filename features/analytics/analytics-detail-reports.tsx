"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
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
import { serializeCsv } from "@/features/import-export/csv-utils";

type Tab = "summary" | "staff" | "product" | "retail" | "hourly" | "credit" | "daily" | "trend" | "reports";

const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "売上・明細集計" },
  { key: "staff", label: "スタッフ別売上" },
  { key: "product", label: "商品別売上" },
  { key: "retail", label: "物販売上" },
  { key: "hourly", label: "時間帯別来店" },
  { key: "credit", label: "クレジット会社別" },
  { key: "daily", label: "日次集計（日別）" },
  { key: "trend", label: "顧客数推移" },
  { key: "reports", label: "帳票出力" }
];

function yen(value: number) {
  return `¥${value.toLocaleString()}`;
}

function customerKey(reservation: Reservation) {
  return reservation.phone?.trim() || reservation.customerName.trim();
}

function downloadCsv(fileName: string, headers: string[], records: Array<Record<string, string | number>>) {
  const csv = serializeCsv(headers, records);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsDetailReports() {
  const [reservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [retailItems] = useLocalCollection<RetailItem>(retailItemsStorageKey, initialRetailItems);
  const [retailSales] = useLocalCollection<RetailSale>(retailSalesStorageKey, initialRetailSales);
  const [tab, setTab] = useState<Tab>("summary");

  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const staffName = useMemo(() => new Map(staff.map((s) => [s.id, s.displayName])), [staff]);
  const serviceName = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);

  const monthReservations = useMemo(
    () => reservations.filter((r) => r.date.startsWith(month) && r.status !== "canceled"),
    [reservations, month]
  );
  const monthPaid = useMemo(() => monthReservations.filter((r) => r.paymentStatus === "paid"), [monthReservations]);

  // 売上・明細集計
  const summary = useMemo(() => {
    const sales = monthPaid.reduce((sum, r) => sum + (r.saleAmount ?? 0), 0);
    const customers = new Set(monthPaid.map(customerKey).filter(Boolean)).size;
    return { sales, count: monthPaid.length, customers, avg: customers > 0 ? Math.round(sales / customers) : 0 };
  }, [monthPaid]);

  const detailRows = useMemo(
    () =>
      [...monthPaid]
        .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)))
        .map((r) => ({
          日付: r.date,
          時刻: r.startTime,
          顧客: r.customerName,
          担当: staffName.get(r.staffId) ?? r.staffId,
          メニュー: serviceName.get(r.serviceMenuId) ?? r.serviceMenuId,
          売上: r.saleAmount ?? 0
        })),
    [monthPaid, staffName, serviceName]
  );

  // クレジット会社別
  const creditRows = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const r of monthPaid) {
      for (const p of r.payments ?? []) {
        if (p.method !== "credit") continue;
        const brand = p.cardBrand || "（未指定）";
        const prev = map.get(brand) ?? { amount: 0, count: 0 };
        map.set(brand, { amount: prev.amount + p.amount, count: prev.count + 1 });
      }
    }
    return [...map.entries()].map(([brand, v]) => ({ クレジット会社: brand, 件数: v.count, 売上: v.amount })).sort((a, b) => b.売上 - a.売上);
  }, [monthPaid]);

  // 日次集計（日別）
  const dailyRows = useMemo(() => {
    const map = new Map<string, { sales: number; visitors: Set<string> }>();
    for (const r of monthReservations) {
      if (!map.has(r.date)) map.set(r.date, { sales: 0, visitors: new Set() });
      const bucket = map.get(r.date)!;
      bucket.visitors.add(customerKey(r));
      if (r.paymentStatus === "paid") bucket.sales += r.saleAmount ?? 0;
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({
        日付: date,
        売上: v.sales,
        来店: v.visitors.size,
        客単価: v.visitors.size > 0 ? Math.round(v.sales / v.visitors.size) : 0
      }));
  }, [monthReservations]);

  // 日次集計（個人別＝スタッフ別 当月）
  const staffRows = useMemo(() => {
    const map = new Map<string, { sales: number; count: number; customers: Set<string> }>();
    for (const r of monthPaid) {
      if (!map.has(r.staffId)) map.set(r.staffId, { sales: 0, count: 0, customers: new Set() });
      const bucket = map.get(r.staffId)!;
      bucket.sales += r.saleAmount ?? 0;
      bucket.count += 1;
      bucket.customers.add(customerKey(r));
    }
    return [...map.entries()]
      .map(([id, v]) => ({
        スタッフ: staffName.get(id) ?? id,
        売上: v.sales,
        件数: v.count,
        客単価: v.customers.size > 0 ? Math.round(v.sales / v.customers.size) : 0
      }))
      .sort((a, b) => b.売上 - a.売上);
  }, [monthPaid, staffName]);

  // 商品別売上（メニュー別・当月会計済）
  const productRows = useMemo(() => {
    const map = new Map<string, { sales: number; count: number }>();
    for (const r of monthPaid) {
      const prev = map.get(r.serviceMenuId) ?? { sales: 0, count: 0 };
      map.set(r.serviceMenuId, { sales: prev.sales + (r.saleAmount ?? 0), count: prev.count + 1 });
    }
    return [...map.entries()]
      .map(([id, v]) => ({ 商品: serviceName.get(id) ?? id, 件数: v.count, 売上: v.sales }))
      .sort((a, b) => b.売上 - a.売上);
  }, [monthPaid, serviceName]);

  // 物販売上（当月の物販販売・スナップショット単価×数量）
  const retailItemName = useMemo(() => new Map(retailItems.map((i) => [i.id, i.name])), [retailItems]);
  const retailRows = useMemo(() => {
    const map = new Map<string, { sales: number; qty: number }>();
    for (const s of retailSales) {
      if (!s.saleDate.startsWith(month)) continue;
      const prev = map.get(s.retailItemId) ?? { sales: 0, qty: 0 };
      map.set(s.retailItemId, { sales: prev.sales + s.unitPrice * s.quantity, qty: prev.qty + s.quantity });
    }
    return [...map.entries()]
      .map(([id, v]) => ({ 物販商品: retailItemName.get(id) ?? id, 数量: v.qty, 売上: v.sales }))
      .sort((a, b) => b.売上 - a.売上);
  }, [retailSales, month, retailItemName]);

  // 時間帯別来店（開始時刻の時で集計）
  const hourlyRows = useMemo(() => {
    const map = new Map<number, { visits: number; sales: number }>();
    for (const r of monthReservations) {
      const hour = Number(r.startTime.slice(0, 2));
      if (!Number.isFinite(hour)) continue;
      const prev = map.get(hour) ?? { visits: 0, sales: 0 };
      map.set(hour, { visits: prev.visits + 1, sales: prev.sales + (r.paymentStatus === "paid" ? r.saleAmount ?? 0 : 0) });
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, v]) => ({ 時間帯: `${String(hour).padStart(2, "0")}:00`, 来店: v.visits, 売上: v.sales }));
  }, [monthReservations]);

  // 顧客数推移（月別 新規/リピート/総数）
  const trendRows = useMemo(() => {
    const paidSorted = reservations
      .filter((r) => r.paymentStatus === "paid" && r.status !== "canceled")
      .sort((a, b) => a.date.localeCompare(b.date));
    const firstMonthByKey = new Map<string, string>();
    for (const r of paidSorted) {
      const key = customerKey(r);
      if (!key) continue;
      const m = r.date.slice(0, 7);
      if (!firstMonthByKey.has(key)) firstMonthByKey.set(key, m);
    }
    const monthly = new Map<string, Set<string>>();
    for (const r of paidSorted) {
      const key = customerKey(r);
      if (!key) continue;
      const m = r.date.slice(0, 7);
      if (!monthly.has(m)) monthly.set(m, new Set());
      monthly.get(m)!.add(key);
    }
    return [...monthly.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([m, keys]) => {
        let newCount = 0;
        keys.forEach((key) => {
          if (firstMonthByKey.get(key) === m) newCount += 1;
        });
        return { 月: m, 新規: newCount, リピート: keys.size - newCount, 総数: keys.size };
      });
  }, [reservations]);

  const inputClass = "rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-luxas-green";

  return (
    <MasterPage title="経営指標 詳細帳票" description="会計確定データをもとに、各種帳票をテーブルで集計します。各帳票はCSVに書き出せます。">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <span className="font-medium">対象月</span>
          <input type="month" className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <div className="inline-flex flex-wrap overflow-hidden rounded-md border border-luxas-line">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={["px-3 py-2 text-sm font-medium transition", tab === t.key ? "bg-luxas-green text-white" : "bg-white text-stone-600 hover:bg-luxas-paper"].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "summary" ? (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Kpi label="売上合計" value={yen(summary.sales)} />
            <Kpi label="会計件数" value={`${summary.count}件`} />
            <Kpi label="来店客数" value={`${summary.customers}名`} />
            <Kpi label="客単価" value={yen(summary.avg)} />
          </div>
          <ReportTable
            title="売上明細"
            columns={["日付", "時刻", "顧客", "担当", "メニュー", "売上"]}
            rows={detailRows.map((r) => [r.日付, r.時刻, r.顧客, r.担当, r.メニュー, yen(r.売上)])}
            onExport={() => downloadCsv(`売上明細_${month}.csv`, ["日付", "時刻", "顧客", "担当", "メニュー", "売上"], detailRows)}
            emptyText="会計済データがありません。"
          />
        </section>
      ) : null}

      {tab === "credit" ? (
        <ReportTable
          title="クレジット会社別 売上"
          columns={["クレジット会社", "件数", "売上"]}
          rows={creditRows.map((r) => [r.クレジット会社, `${r.件数}件`, yen(r.売上)])}
          onExport={() => downloadCsv(`クレジット会社別_${month}.csv`, ["クレジット会社", "件数", "売上"], creditRows)}
          emptyText="クレジット決済の会計データがありません。"
        />
      ) : null}

      {tab === "daily" ? (
        <ReportTable
          title="日次集計（日別）"
          columns={["日付", "売上", "来店", "客単価"]}
          rows={dailyRows.map((r) => [r.日付, yen(r.売上), `${r.来店}名`, yen(r.客単価)])}
          onExport={() => downloadCsv(`日次集計_日別_${month}.csv`, ["日付", "売上", "来店", "客単価"], dailyRows)}
          emptyText="当月の予約データがありません。"
        />
      ) : null}

      {tab === "staff" ? (
        <ReportTable
          title="日次集計（個人別・当月合計）"
          columns={["スタッフ", "売上", "件数", "客単価"]}
          rows={staffRows.map((r) => [r.スタッフ, yen(r.売上), `${r.件数}件`, yen(r.客単価)])}
          onExport={() => downloadCsv(`日次集計_個人別_${month}.csv`, ["スタッフ", "売上", "件数", "客単価"], staffRows)}
          emptyText="会計済データがありません。"
        />
      ) : null}

      {tab === "product" ? (
        <ReportTable
          title="商品別売上（当月）"
          columns={["商品", "件数", "売上"]}
          rows={productRows.map((r) => [r.商品, `${r.件数}件`, yen(r.売上)])}
          onExport={() => downloadCsv(`商品別売上_${month}.csv`, ["商品", "件数", "売上"], productRows)}
          emptyText="会計済データがありません。"
        />
      ) : null}

      {tab === "retail" ? (
        <ReportTable
          title="物販売上（当月）"
          columns={["物販商品", "数量", "売上"]}
          rows={retailRows.map((r) => [r.物販商品, `${r.数量}点`, yen(r.売上)])}
          onExport={() => downloadCsv(`物販売上_${month}.csv`, ["物販商品", "数量", "売上"], retailRows)}
          emptyText="当月の物販販売データがありません（物販販売画面で登録）。"
        />
      ) : null}

      {tab === "hourly" ? (
        <ReportTable
          title="時間帯別来店（当月）"
          columns={["時間帯", "来店", "売上"]}
          rows={hourlyRows.map((r) => [r.時間帯, `${r.来店}件`, yen(r.売上)])}
          onExport={() => downloadCsv(`時間帯別来店_${month}.csv`, ["時間帯", "来店", "売上"], hourlyRows)}
          emptyText="当月の予約データがありません。"
        />
      ) : null}

      {tab === "reports" ? (
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <h2 className="text-base font-semibold text-luxas-ink">帳票出力</h2>
          <p className="mt-1 text-sm text-stone-500">各帳票・関連画面へのリンク集です。</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { label: "店舗売上日報", href: "/dashboard/daily-report" },
              { label: "実績明細（予約明細）", href: "/dashboard/reservations/list" },
              { label: "時間別来店数", href: "/dashboard/analytics/reports", note: "当画面「時間帯別来店」タブ" },
              { label: "個人実績（スタッフ別）", href: "/dashboard/analytics/reports", note: "当画面「スタッフ別売上」タブ" },
              { label: "30日リピート（顧客数推移）", href: "/dashboard/analytics/reports", note: "当画面「顧客数推移」タブ" },
              { label: "返客一覧", href: "/dashboard/reservations/returns" }
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between rounded-md border border-luxas-line bg-white px-4 py-3 text-sm font-medium text-luxas-ink transition hover:bg-luxas-mist"
              >
                <span>{item.label}{item.note ? <span className="ml-2 text-xs text-stone-400">{item.note}</span> : null}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "trend" ? (
        <ReportTable
          title="顧客数推移（月別）"
          columns={["月", "新規", "リピート", "総数"]}
          rows={trendRows.map((r) => [r.月, `${r.新規}名`, `${r.リピート}名`, `${r.総数}名`])}
          onExport={() => downloadCsv("顧客数推移.csv", ["月", "新規", "リピート", "総数"], trendRows)}
          emptyText="会計済データがありません。"
        />
      ) : null}

      <p className="mt-4 text-[11px] text-stone-400">
        ※ 売上系は会計（予約詳細→会計）確定分のみ集計。単一店舗のため店舗別/店舗集計は当店のみ。各帳票の内部仕様はPM標準で設計（相違あれば実機再確認）。
      </p>
    </MasterPage>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-luxas-line bg-white p-4">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-luxas-ink">{value}</p>
    </div>
  );
}

function ReportTable({
  title,
  columns,
  rows,
  onExport,
  emptyText
}: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  onExport: () => void;
  emptyText: string;
}) {
  return (
    <section className="rounded-lg border border-luxas-line bg-white">
      <div className="flex items-center justify-between border-b border-luxas-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-luxas-ink">{title}</h2>
          <p className="mt-1 text-sm text-stone-500">{rows.length}件</p>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-luxas-ink transition hover:bg-luxas-paper disabled:cursor-not-allowed disabled:text-stone-300"
        >
          <Download size={16} aria-hidden="true" />
          CSV出力
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-5 py-3">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-luxas-line">
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="whitespace-nowrap px-5 py-3 text-stone-700">{cell}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-sm text-stone-500">{emptyText}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
