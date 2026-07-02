"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { MasterPage } from "@/features/master-data/master-page";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  initialRetailSales,
  initialShifts,
  retailSalesStorageKey,
  shiftsStorageKey
} from "@/features/master-data/mock-data";
import { dailyTargetsStorageKey } from "@/features/master-data/monthly-shift-grid";
import type { RetailSale, StaffShift } from "@/features/master-data/types";
import { useStoreSettings } from "@/features/master-data/store-settings";
import {
  initialReservations,
  reservationsStorageKey,
  turnawaysStorageKey
} from "@/features/reservations/mock-data";
import type { PaymentMethod, Reservation, TurnawayRecord } from "@/features/reservations/types";
import { filterReservationsByStore } from "@/features/reservations/store-scope";
import { filterRecordsByStore } from "@/features/master-data/store-record-scope";
import { filterShiftsByStore } from "@/features/master-data/store-staff-scope";
import { customersStorageKey, initialCustomers } from "@/features/customers/mock-data";
import type { Customer } from "@/features/customers/types";
import { dailyReportsStorageKey, type DailyReport } from "@/features/daily/daily-ops";
import { useCurrentStore } from "@/features/org/use-current-store";
import { timeToMinutes } from "@/features/reservations/date-utils";
import { serializeCsv } from "@/features/import-export/csv-utils";

type DailyTarget = { date: string; amount: number; comment: string; storeId?: string };

// 安定参照の空配列（useLocalCollection の initialItems に毎回 [] を渡すと再ハイドレートが暴走するため）。
const EMPTY_TARGETS: DailyTarget[] = [];
const EMPTY_TURNAWAYS: TurnawayRecord[] = [];
const EMPTY_REPORTS: DailyReport[] = [];

/** 消費税率（v2: 固定10%）。税抜＝税込÷1.1（円未満四捨五入）、消費税＝税込−税抜。 */
const TAX_RATE = 0.1;
function exTax(incTax: number): number {
  return Math.round(incTax / (1 + TAX_RATE));
}

/**
 * オンライン予約判定。source="online" に加え、profile未設定のRPC作成予約（memo="online" のみ・
 * phaseC2 SQL適用前の既存データ）も拾う。
 */
function isOnlineReservation(r: Reservation): boolean {
  return r.source === "online" || (!r.source && r.memo === "online");
}

/** 売上日報「スタッフ提案数」（自由記述）を数値として解釈。数字以外は無視し、数値にならなければ0。 */
function parseProposals(text: string | undefined): number {
  const digits = (text ?? "").replace(/[^\d]/g, "");
  const n = Number(digits);
  return digits && Number.isFinite(n) ? n : 0;
}

// 集計1日分。CSV列とテーブル列の両方に使う。
type DailyRow = {
  営業日: string;
  営業時間H: number;
  総シフト分: number;
  総施術分: number;
  総休憩分: number;
  稼働率: number;
  予算: number;
  施術売上: number;
  物販売上: number;
  売上合計: number;
  税抜売上: number;
  消費税: number;
  進捗率: number;
  客単価: number;
  時間単価: number;
  現金: number;
  クレジット: number;
  電子マネー: number;
  回数券: number;
  商品券: number;
  プリペイド: number;
  ポイント: number;
  EPARK: number;
  総来店数: number;
  新規数: number;
  リピーター数: number;
  リピート占有率: number;
  男性顧客数: number;
  女性顧客数: number;
  指名顧客数: number;
  オンライン予約数: number;
  オンラインPC: number;
  オンライン携帯: number;
  返客数: number;
  機会損失率: number;
  追加提案数: number;
};

function normPhone(value: string | undefined) {
  return (value ?? "").replace(/[^0-9]/g, "");
}
function customerKey(reservation: Reservation) {
  return reservation.phone?.trim() || reservation.customerName.trim();
}
function durationMin(start: string, end: string): number {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return 0;
  return e - s;
}
function methodTotal(reservation: Reservation, method: PaymentMethod): number {
  return (reservation.payments ?? []).filter((p) => p.method === method).reduce((sum, p) => sum + p.amount, 0);
}
function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}
function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
// from〜to（両端含む）の日付一覧。順方向のみ・最大366日で安全打ち切り。
function enumerateDates(from: string, to: string): string[] {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
  const out: string[] = [];
  const cur = new Date(start);
  const p = (n: number) => String(n).padStart(2, "0");
  while (cur <= end && out.length < 366) {
    out.push(`${cur.getFullYear()}-${p(cur.getMonth() + 1)}-${p(cur.getDate())}`);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function yen(value: number) {
  return `¥${Math.round(value).toLocaleString()}`;
}

export function DailySummary() {
  const [allReservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [allShifts] = useLocalCollection<StaffShift>(shiftsStorageKey, initialShifts);
  const [allRetail] = useLocalCollection<RetailSale>(retailSalesStorageKey, initialRetailSales);
  const [allTargets] = useLocalCollection<DailyTarget>(dailyTargetsStorageKey, EMPTY_TARGETS);
  const [allTurnaways] = useLocalCollection<TurnawayRecord>(turnawaysStorageKey, EMPTY_TURNAWAYS);
  const [allReports] = useLocalCollection<DailyReport>(dailyReportsStorageKey, EMPTY_REPORTS);
  const [customers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const { currentStoreId, stores } = useCurrentStore();
  const [settings] = useStoreSettings(currentStoreId);

  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());

  // 現在店舗で安全フィルタ（T063・他データも店舗スコープ）。
  const reservations = useMemo(
    () => filterReservationsByStore(allReservations, currentStoreId),
    [allReservations, currentStoreId]
  );
  const shifts = useMemo(() => filterShiftsByStore(allShifts, currentStoreId).filter((s) => s.isActive), [allShifts, currentStoreId]);
  const retailSales = useMemo(() => filterRecordsByStore(allRetail, currentStoreId), [allRetail, currentStoreId]);
  const targets = useMemo(() => filterRecordsByStore(allTargets, currentStoreId), [allTargets, currentStoreId]);
  const turnaways = useMemo(() => filterRecordsByStore(allTurnaways, currentStoreId), [allTurnaways, currentStoreId]);
  const reports = useMemo(() => filterRecordsByStore(allReports, currentStoreId), [allReports, currentStoreId]);

  // 顧客解決（customerId → 電話 の順）。性別の集計に使う。
  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const customerByPhone = useMemo(() => {
    const m = new Map<string, Customer>();
    for (const c of customers) {
      const ph = normPhone(c.phone);
      if (ph && !m.has(ph)) m.set(ph, c);
    }
    return m;
  }, [customers]);
  function resolveGender(reservation: Reservation): "male" | "female" | "other" | "unspecified" | "" {
    const byId = reservation.customerId ? customerById.get(reservation.customerId) : undefined;
    const byPhone = byId ?? (reservation.phone ? customerByPhone.get(normPhone(reservation.phone)) : undefined);
    return byPhone?.gender ?? reservation.guestGender ?? "";
  }

  // 顧客ごとの初回来店日（新規/リピート判定）。店舗スコープ済み・非キャンセル・ブロック以外。
  const firstVisitByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of reservations) {
      if (r.status === "canceled" || r.blockType) continue;
      const k = customerKey(r);
      if (!k) continue;
      const prev = m.get(k);
      if (!prev || r.date < prev) m.set(k, r.date);
    }
    return m;
  }, [reservations]);

  const dates = useMemo(() => enumerateDates(from, to), [from, to]);

  const businessHours = useMemo(() => {
    const min = durationMin(settings.businessStartTime, settings.businessEndTime);
    return Math.round((min / 60) * 10) / 10;
  }, [settings.businessStartTime, settings.businessEndTime]);

  const rows = useMemo<DailyRow[]>(() => {
    return dates.map((date) => {
      const dayVisits = reservations.filter((r) => r.date === date && r.status !== "canceled" && !r.blockType);
      const dayPaid = dayVisits.filter((r) => r.paymentStatus === "paid");
      const dayShifts = shifts.filter((s) => s.workDate === date);
      const dayRetail = retailSales.filter((s) => s.saleDate === date);
      const target = targets.find((t) => t.date === date)?.amount ?? 0;
      const dayTurnaways = turnaways.filter((t) => t.date === date);
      const dayReport = reports.find((t) => t.date === date);

      const shiftMin = dayShifts.reduce((sum, s) => sum + durationMin(s.startTime, s.endTime), 0);
      const breakMin = dayShifts.reduce((sum, s) => sum + durationMin(s.breakStart, s.breakEnd), 0);
      const serviceMin = dayVisits.reduce((sum, r) => sum + durationMin(r.startTime, r.endTime), 0);

      const treatmentSales = dayPaid.reduce((sum, r) => sum + (r.saleAmount ?? 0), 0);
      const retailTotal = dayRetail.reduce((sum, s) => sum + s.unitPrice * s.quantity, 0);
      const totalSales = treatmentSales + retailTotal;
      const visits = dayVisits.length;

      // 当日来店した「顧客（重複は1人）」単位の集計。
      const keys = new Set(dayVisits.map((r) => customerKey(r)).filter(Boolean));
      let newCount = 0;
      let repeatCount = 0;
      let male = 0;
      let female = 0;
      const nominatedKeys = new Set(
        dayVisits.filter((r) => r.nominatedStaffId).map((r) => customerKey(r)).filter(Boolean)
      );
      const genderByKey = new Map<string, string>();
      for (const r of dayVisits) {
        const k = customerKey(r);
        if (k && !genderByKey.has(k)) genderByKey.set(k, resolveGender(r));
      }
      for (const k of keys) {
        if ((firstVisitByKey.get(k) ?? date) >= date) newCount += 1;
        else repeatCount += 1;
        const g = genderByKey.get(k);
        if (g === "male") male += 1;
        else if (g === "female") female += 1;
      }

      return {
        営業日: date,
        営業時間H: businessHours,
        総シフト分: shiftMin,
        総施術分: serviceMin,
        総休憩分: breakMin,
        稼働率: pct(serviceMin, shiftMin),
        予算: target,
        施術売上: treatmentSales,
        物販売上: retailTotal,
        売上合計: totalSales,
        税抜売上: exTax(totalSales),
        消費税: totalSales - exTax(totalSales),
        進捗率: pct(totalSales, target),
        客単価: visits > 0 ? Math.round(treatmentSales / visits) : 0,
        時間単価: shiftMin > 0 ? Math.round(treatmentSales / (shiftMin / 60)) : 0,
        現金: dayPaid.reduce((s, r) => s + methodTotal(r, "cash"), 0),
        クレジット: dayPaid.reduce((s, r) => s + methodTotal(r, "credit"), 0),
        電子マネー: dayPaid.reduce((s, r) => s + methodTotal(r, "emoney"), 0),
        回数券: dayPaid.reduce((s, r) => s + methodTotal(r, "ticket"), 0),
        商品券: dayPaid.reduce((s, r) => s + methodTotal(r, "giftcard"), 0),
        プリペイド: dayPaid.reduce((s, r) => s + methodTotal(r, "prepaid"), 0),
        ポイント: dayPaid.reduce((s, r) => s + methodTotal(r, "point"), 0),
        EPARK: dayPaid.reduce((s, r) => s + methodTotal(r, "epark"), 0),
        総来店数: visits,
        新規数: newCount,
        リピーター数: repeatCount,
        リピート占有率: pct(repeatCount, newCount + repeatCount),
        男性顧客数: male,
        女性顧客数: female,
        指名顧客数: nominatedKeys.size,
        オンライン予約数: dayVisits.filter(isOnlineReservation).length,
        オンラインPC: dayVisits.filter((r) => isOnlineReservation(r) && r.onlineDevice === "pc").length,
        オンライン携帯: dayVisits.filter((r) => isOnlineReservation(r) && r.onlineDevice === "mobile").length,
        返客数: dayTurnaways.length,
        機会損失率: pct(dayTurnaways.length, visits + dayTurnaways.length),
        追加提案数: parseProposals(dayReport?.staffProposals)
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates, reservations, shifts, retailSales, targets, turnaways, reports, businessHours, firstVisitByKey]);

  // 合計行（金額・件数・時間は単純合算、率は合計から再計算）。
  const total = useMemo(() => {
    const sum = (pick: (r: DailyRow) => number) => rows.reduce((s, r) => s + pick(r), 0);
    const shiftMin = sum((r) => r.総シフト分);
    const serviceMin = sum((r) => r.総施術分);
    const treatment = sum((r) => r.施術売上);
    const totalSales = sum((r) => r.売上合計);
    const budget = sum((r) => r.予算);
    const visits = sum((r) => r.総来店数);
    const repeat = sum((r) => r.リピーター数);
    const newc = sum((r) => r.新規数);
    const turnaway = sum((r) => r.返客数);
    return {
      総シフト分: shiftMin,
      総施術分: serviceMin,
      総休憩分: sum((r) => r.総休憩分),
      稼働率: pct(serviceMin, shiftMin),
      予算: budget,
      施術売上: treatment,
      物販売上: sum((r) => r.物販売上),
      売上合計: totalSales,
      税抜売上: exTax(totalSales),
      消費税: totalSales - exTax(totalSales),
      進捗率: pct(totalSales, budget),
      客単価: visits > 0 ? Math.round(treatment / visits) : 0,
      時間単価: shiftMin > 0 ? Math.round(treatment / (shiftMin / 60)) : 0,
      現金: sum((r) => r.現金),
      クレジット: sum((r) => r.クレジット),
      電子マネー: sum((r) => r.電子マネー),
      回数券: sum((r) => r.回数券),
      商品券: sum((r) => r.商品券),
      プリペイド: sum((r) => r.プリペイド),
      ポイント: sum((r) => r.ポイント),
      EPARK: sum((r) => r.EPARK),
      総来店数: visits,
      新規数: newc,
      リピーター数: repeat,
      リピート占有率: pct(repeat, newc + repeat),
      男性顧客数: sum((r) => r.男性顧客数),
      女性顧客数: sum((r) => r.女性顧客数),
      指名顧客数: sum((r) => r.指名顧客数),
      オンライン予約数: sum((r) => r.オンライン予約数),
      オンラインPC: sum((r) => r.オンラインPC),
      オンライン携帯: sum((r) => r.オンライン携帯),
      返客数: turnaway,
      機会損失率: pct(turnaway, visits + turnaway),
      追加提案数: sum((r) => r.追加提案数)
    };
  }, [rows]);

  const storeName = useMemo(
    () => stores.find((s) => s.id === currentStoreId)?.name ?? currentStoreId,
    [stores, currentStoreId]
  );

  const columns: { key: keyof DailyRow; label: string; kind: "yen" | "num" | "pct" | "text" }[] = [
    { key: "営業日", label: "営業日", kind: "text" },
    { key: "営業時間H", label: "営業時間(H)", kind: "num" },
    { key: "総シフト分", label: "総シフト時間(分)", kind: "num" },
    { key: "総施術分", label: "総施術時間(分)", kind: "num" },
    { key: "総休憩分", label: "総休憩時間(分)", kind: "num" },
    { key: "稼働率", label: "スタッフ稼働率(%)", kind: "pct" },
    { key: "予算", label: "予算", kind: "yen" },
    { key: "施術売上", label: "施術売上", kind: "yen" },
    { key: "物販売上", label: "物販売上", kind: "yen" },
    { key: "売上合計", label: "売上合計(税込)", kind: "yen" },
    { key: "税抜売上", label: "売上合計(税抜)", kind: "yen" },
    { key: "消費税", label: "消費税", kind: "yen" },
    { key: "進捗率", label: "進捗率(%)", kind: "pct" },
    { key: "客単価", label: "客単価", kind: "yen" },
    { key: "時間単価", label: "時間単価", kind: "yen" },
    { key: "現金", label: "現金", kind: "yen" },
    { key: "クレジット", label: "クレジット", kind: "yen" },
    { key: "電子マネー", label: "電子マネー", kind: "yen" },
    { key: "回数券", label: "回数券", kind: "yen" },
    { key: "商品券", label: "商品券", kind: "yen" },
    { key: "プリペイド", label: "プリペイド", kind: "yen" },
    { key: "ポイント", label: "ポイント", kind: "yen" },
    { key: "EPARK", label: "EPARK", kind: "yen" },
    { key: "総来店数", label: "総来店数", kind: "num" },
    { key: "新規数", label: "新規数", kind: "num" },
    { key: "リピーター数", label: "リピーター数", kind: "num" },
    { key: "リピート占有率", label: "リピート占有率(%)", kind: "pct" },
    { key: "男性顧客数", label: "男性顧客数", kind: "num" },
    { key: "女性顧客数", label: "女性顧客数", kind: "num" },
    { key: "指名顧客数", label: "指名顧客数", kind: "num" },
    { key: "オンライン予約数", label: "オンライン予約数", kind: "num" },
    { key: "オンラインPC", label: "オンライン(PC)", kind: "num" },
    { key: "オンライン携帯", label: "オンライン(携帯)", kind: "num" },
    { key: "返客数", label: "返客数", kind: "num" },
    { key: "機会損失率", label: "機会損失率(%)", kind: "pct" },
    { key: "追加提案数", label: "追加提案数", kind: "num" }
  ];

  function cell(value: number | string, kind: "yen" | "num" | "pct" | "text") {
    if (kind === "text") return String(value);
    if (kind === "yen") return yen(Number(value));
    if (kind === "pct") return `${value}%`;
    return Number(value).toLocaleString();
  }

  function handleDownload() {
    const headers = columns.map((c) => c.label);
    const records = rows.map((r) => {
      const rec: Record<string, string | number> = {};
      columns.forEach((c) => {
        rec[c.label] = r[c.key];
      });
      return rec;
    });
    const csv = serializeCsv(headers, records);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `日次集計_${storeName}_${from}_${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <MasterPage
      title="日次集計（店舗向け）"
      description="指定した期間の、店舗の日別サマリーを集計します（会計確定・シフト・物販・返客などをもとに算出）。CSVに書き出せます。"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-luxas-line bg-white p-3">
          <label className="flex flex-col gap-1 text-xs text-stone-600">
            集計期間（開始）
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-luxas-line bg-white px-3 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
            />
          </label>
          <span className="pb-2 text-stone-400">〜</span>
          <label className="flex flex-col gap-1 text-xs text-stone-600">
            集計期間（終了）
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-luxas-line bg-white px-3 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
            />
          </label>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-stone-500">店舗: {storeName}</span>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-luxas-ink transition hover:bg-luxas-mist"
            >
              <Download size={16} aria-hidden="true" />
              ダウンロード
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-md border border-luxas-line bg-luxas-paper px-3 py-4 text-sm text-stone-500">
            期間が正しくありません（開始日が終了日より後、または最大366日を超えています）。
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-luxas-line bg-white">
            <table className="min-w-max text-right text-xs">
              <thead>
                <tr className="border-b border-luxas-line bg-luxas-paper text-stone-600">
                  {columns.map((c) => (
                    <th key={String(c.key)} className="whitespace-nowrap px-3 py-2 font-medium first:text-left">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.営業日} className="border-b border-luxas-line/60">
                    {columns.map((c) => (
                      <td key={String(c.key)} className="whitespace-nowrap px-3 py-2 text-stone-700 first:text-left first:font-medium">
                        {cell(r[c.key], c.kind)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-luxas-paper font-semibold text-luxas-ink">
                  <td className="whitespace-nowrap px-3 py-2 text-left">合計</td>
                  {columns.slice(1).map((c) => (
                    <td key={String(c.key)} className="whitespace-nowrap px-3 py-2">
                      {c.key === "営業時間H" ? "" : cell((total as Record<string, number>)[c.key as string] ?? 0, c.kind)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] leading-5 text-stone-400">
          ※ 売上・決済内訳・客単価は会計（予約詳細→会計）確定分のみ。施術時間＝予約の所要時間合計、シフト/休憩時間＝当日シフト、稼働率＝施術時間÷シフト時間、時間単価＝施術売上÷シフト時間。
          新規/リピート・男女・指名は当日来店した顧客（重複は1人）単位。返客数は返客記録。すべて現在店舗のみ集計。
          税抜＝税込÷1.1（円未満四捨五入・税率10%固定）、消費税＝税込−税抜。オンライン(PC)/(携帯)は予約時の端末自動判定分のみ（判定前の過去予約は総数にのみ含む）。
          機会損失率＝返客数÷(総来店数＋返客数)。追加提案数＝売上日報「スタッフ提案数」の数値解釈（未記入・数値以外は0）。
          健康アドバイス・RUU は定義確定後に追加予定。
        </p>
      </div>
    </MasterPage>
  );
}
