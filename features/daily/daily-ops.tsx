"use client";

import { useMemo, useState } from "react";
import { MasterPage } from "@/features/master-data/master-page";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { initialShifts, initialStaff, shiftsStorageKey, staffStorageKey } from "@/features/master-data/mock-data";
import { dailyTargetsStorageKey } from "@/features/master-data/monthly-shift-grid";
import {
  attendanceStorageKey,
  expenseAccountsStorageKey,
  expenseEntriesStorageKey,
  initialExpenseAccounts,
  registerStorageKey,
  type AttendanceRecord,
  type ExpenseAccount,
  type ExpenseEntry,
  type RegisterRecord
} from "@/features/master-data/cost-master";
import type { StaffMember, StaffShift } from "@/features/master-data/types";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import { paymentMethodLabels, type PaymentMethod, type Reservation } from "@/features/reservations/types";
import { makeLocalId } from "@/features/master-data/utils";
import { CashDenominationTable, type CashCounts } from "@/features/daily/cash-denomination-table";

type DailyTarget = { date: string; amount: number; comment: string };
type Tab = "attendance" | "register" | "report" | "expenses";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "attendance", label: "出勤・退勤" },
  { key: "register", label: "レジ金（開店/点検/閉店）" },
  { key: "report", label: "売上日報" },
  { key: "expenses", label: "経費登録" }
];

export function DailyOps() {
  const [date, setDate] = useState(today());
  const [tab, setTab] = useState<Tab>("attendance");

  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [shifts] = useLocalCollection<StaffShift>(shiftsStorageKey, initialShifts);
  const [reservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [targets] = useLocalCollection<DailyTarget>(dailyTargetsStorageKey, []);
  const [accounts] = useLocalCollection<ExpenseAccount>(expenseAccountsStorageKey, initialExpenseAccounts);

  const [attendance, setAttendance] = useLocalCollection<AttendanceRecord>(attendanceStorageKey, []);
  const [registers, setRegisters] = useLocalCollection<RegisterRecord>(registerStorageKey, []);
  const [expenses, setExpenses] = useLocalCollection<ExpenseEntry>(expenseEntriesStorageKey, []);

  const dayShifts = useMemo(() => shifts.filter((s) => s.workDate === date && (s.isActive ?? true)), [shifts, date]);
  const dayReservations = useMemo(() => reservations.filter((r) => r.date === date && r.status !== "canceled"), [reservations, date]);

  function attRecord(staffId: string) {
    return attendance.find((a) => a.date === date && a.staffId === staffId);
  }
  function updateAtt(staffId: string, field: "clockIn" | "clockOut", value: string) {
    setAttendance((current) => {
      const existing = current.find((a) => a.date === date && a.staffId === staffId);
      if (existing) {
        return current.map((a) => (a.id === existing.id ? { ...a, [field]: value } : a));
      }
      return [...current, { id: `${date}:${staffId}`, date, staffId, clockIn: "", clockOut: "", [field]: value }];
    });
  }

  function regRecord(kind: RegisterRecord["kind"]) {
    return registers.find((r) => r.date === date && r.kind === kind);
  }
  function updateReg(kind: RegisterRecord["kind"], counts: CashCounts) {
    setRegisters((current) => {
      const existing = current.find((r) => r.date === date && r.kind === kind);
      if (existing) {
        return current.map((r) => (r.id === existing.id ? { ...r, counts } : r));
      }
      return [...current, { id: `${date}:${kind}`, date, kind, counts, memo: "" }];
    });
  }

  // 売上日報の集計
  const report = useMemo(() => {
    const paid = dayReservations.filter((r) => r.paymentStatus === "paid");
    const totalSales = paid.reduce((sum, r) => sum + (r.saleAmount ?? 0), 0);
    const byMethod: Record<string, number> = {};
    for (const r of paid) {
      for (const p of r.payments ?? []) {
        byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
      }
    }
    const target = targets.find((t) => t.date === date)?.amount ?? 0;
    return { count: dayReservations.length, visitors: new Set(dayReservations.map((r) => r.customerName)).size, totalSales, byMethod, target };
  }, [dayReservations, targets, date]);

  // 経費登録フォーム
  const [expForm, setExpForm] = useState({ accountId: "", amount: "0", note: "", targetMonth: date.slice(0, 7) });

  function addExpense() {
    const amount = Number(expForm.amount) || 0;
    if (!expForm.accountId || amount <= 0) {
      return;
    }
    setExpenses((current) => [
      { id: makeLocalId("exp"), date, accountId: expForm.accountId, amount, note: expForm.note, targetMonth: expForm.targetMonth },
      ...current
    ]);
    setExpForm((c) => ({ ...c, amount: "0", note: "" }));
  }

  function copyPrevMonth() {
    const [y, m] = expForm.targetMonth.split("-").map(Number);
    const prev = new Date(y, m - 2, 1);
    const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    const src = expenses.filter((e) => e.targetMonth === prevMonth);
    if (src.length === 0) {
      return;
    }
    setExpenses((current) => [
      ...src.map((e) => ({ ...e, id: makeLocalId("exp"), targetMonth: expForm.targetMonth, date })),
      ...current
    ]);
  }

  const dayExpenses = expenses.filter((e) => e.date === date);
  const accName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "-";
  const inputClass = "rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-luxas-green";

  return (
    <MasterPage title="日次管理" description="出勤退勤・レジ金（開店/点検/閉店）・売上日報・経費を日付ごとに管理します。会計未実装の集計はダミー/0です。">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <span className="font-medium">対象日</span>
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
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

      {tab === "attendance" ? (
        <section className="overflow-x-auto rounded-lg border border-luxas-line bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
              <tr>
                <th className="px-4 py-3">スタッフ</th>
                <th className="px-4 py-3">予定勤務</th>
                <th className="px-4 py-3">出勤打刻</th>
                <th className="px-4 py-3">退勤打刻</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {dayShifts.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-stone-500">この日のシフトはありません。</td></tr>
              ) : (
                dayShifts.map((s) => {
                  const rec = attRecord(s.staffId);
                  return (
                    <tr key={s.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-luxas-ink">{staff.find((x) => x.id === s.staffId)?.displayName ?? s.staffId}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">{s.startTime} - {s.endTime}</td>
                      <td className="px-4 py-3"><input type="time" step={300} className={inputClass} value={rec?.clockIn ?? ""} onChange={(e) => updateAtt(s.staffId, "clockIn", e.target.value)} /></td>
                      <td className="px-4 py-3"><input type="time" step={300} className={inputClass} value={rec?.clockOut ?? ""} onChange={(e) => updateAtt(s.staffId, "clockOut", e.target.value)} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === "register" ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {(["open", "check", "close"] as const).map((kind) => (
            <section key={kind} className="rounded-lg border border-luxas-line bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-luxas-ink">
                {kind === "open" ? "開店処理（レジ金）" : kind === "check" ? "レジ金点検" : "閉店処理（締め）"}
              </h3>
              <CashDenominationTable counts={regRecord(kind)?.counts ?? {}} onChange={(counts) => updateReg(kind, counts)} />
            </section>
          ))}
        </div>
      ) : null}

      {tab === "report" ? (
        <section className="space-y-4 rounded-lg border border-luxas-line bg-white p-5 text-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-luxas-line bg-luxas-paper p-3"><p className="text-xs text-stone-500">来店数</p><p className="mt-1 text-lg font-semibold text-luxas-ink">{report.visitors}名</p></div>
            <div className="rounded-md border border-luxas-line bg-luxas-paper p-3"><p className="text-xs text-stone-500">施術件数</p><p className="mt-1 text-lg font-semibold text-luxas-ink">{report.count}件</p></div>
            <div className="rounded-md border border-luxas-line bg-luxas-paper p-3"><p className="text-xs text-stone-500">総売上（会計済）</p><p className="mt-1 text-lg font-semibold text-luxas-ink">¥{report.totalSales.toLocaleString()}</p></div>
            <div className="rounded-md border border-luxas-line bg-luxas-paper p-3"><p className="text-xs text-stone-500">日次目標 / 達成率</p><p className="mt-1 text-lg font-semibold text-luxas-ink">¥{report.target.toLocaleString()}{report.target > 0 ? `（${Math.round((report.totalSales / report.target) * 100)}%）` : ""}</p></div>
          </div>
          <div>
            <p className="mb-1 font-medium text-stone-700">支払方法別</p>
            <div className="flex flex-wrap gap-3 text-stone-600">
              {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((m) => (
                <span key={m}>{paymentMethodLabels[m]} <b className="text-luxas-ink">¥{(report.byMethod[m] || 0).toLocaleString()}</b></span>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-stone-400">※ 売上・支払は会計（予約詳細→会計）で確定したデータの集計です。目標は月間シフト・目標画面の日次目標を参照。物販等は未実装。</p>
        </section>
      ) : null}

      {tab === "expenses" ? (
        <div className="space-y-4">
          <section className="rounded-lg border border-luxas-line bg-white p-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-stone-600">勘定科目
                <select className={inputClass} value={expForm.accountId} onChange={(e) => setExpForm((c) => ({ ...c, accountId: e.target.value }))}>
                  <option value="">選択</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}{a.subName ? `（${a.subName}）` : ""}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-stone-600">金額<input type="number" min="0" className={inputClass} value={expForm.amount} onChange={(e) => setExpForm((c) => ({ ...c, amount: e.target.value }))} /></label>
              <label className="flex flex-col gap-1 text-xs text-stone-600">摘要<input className={inputClass} value={expForm.note} onChange={(e) => setExpForm((c) => ({ ...c, note: e.target.value }))} /></label>
              <label className="flex flex-col gap-1 text-xs text-stone-600">何月分<input type="month" className={inputClass} value={expForm.targetMonth} onChange={(e) => setExpForm((c) => ({ ...c, targetMonth: e.target.value }))} /></label>
              <button type="button" onClick={addExpense} className="rounded-md bg-luxas-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#285f51]">追加</button>
              <button type="button" onClick={copyPrevMonth} className="rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-luxas-paper">前月分をコピー</button>
            </div>
          </section>
          <section className="overflow-x-auto rounded-lg border border-luxas-line bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
                <tr><th className="px-4 py-3">勘定科目</th><th className="px-4 py-3">金額</th><th className="px-4 py-3">摘要</th><th className="px-4 py-3">何月分</th><th className="px-4 py-3 text-right">操作</th></tr>
              </thead>
              <tbody className="divide-y divide-luxas-line">
                {dayExpenses.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-500">この日の経費はありません。</td></tr>
                ) : (
                  dayExpenses.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-luxas-ink">{accName(e.accountId)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">¥{e.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-stone-700">{e.note || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">{e.targetMonth}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button type="button" className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50" onClick={() => setExpenses((current) => current.filter((x) => x.id !== e.id))}>削除</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>
      ) : null}
    </MasterPage>
  );
}
