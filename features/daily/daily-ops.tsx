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
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { CashDenominationTable, type CashCounts } from "@/features/daily/cash-denomination-table";

type DailyTarget = { date: string; amount: number; comment: string };
// 独立画面の表示種別（T055）。"all"=旧/dashboard/daily の統合4タブ（後方互換）。
export type DailyView = "all" | "attendance" | "register" | "open" | "check" | "close" | "close-history" | "report" | "expenses";

type DailyReport = {
  date: string;
  result: string;
  achievement: string;
  staffProposals: string;
  tomorrowPlan: string;
  plan: string;
  reflection: string;
  shiftStatus: string;
  weather: string;
  submitted?: boolean;
};
const dailyReportsStorageKey = "luxas-daily-reports";
const emptyReport = (date: string): DailyReport => ({
  date,
  result: "",
  achievement: "",
  staffProposals: "",
  tomorrowPlan: "",
  plan: "",
  reflection: "",
  shiftStatus: "",
  weather: ""
});

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TABS: { key: Exclude<DailyView, "all" | "open" | "check" | "close" | "close-history">; label: string }[] = [
  { key: "attendance", label: "出勤・退勤" },
  { key: "report", label: "売上日報" },
  { key: "expenses", label: "経費登録" }
];

const VIEW_META: Record<Exclude<DailyView, "all">, { title: string; description: string }> = {
  attendance: { title: "出勤・退勤", description: "当日シフト担当者の出勤/退勤を打刻します。" },
  register: { title: "レジ金（開店/点検/閉店）", description: "開店/点検/閉店のレジ金を金種ごとに登録します。" },
  open: { title: "開店処理（レジ金）", description: "開店時のレジ金を金種ごとに登録します。" },
  check: { title: "レジ金点検", description: "営業中のレジ金を金種ごとに点検します。" },
  close: { title: "閉店処理（締め）", description: "閉店時のレジ金を金種ごとに登録します（実際の現金確定・締め処理は行いません）。" },
  "close-history": { title: "閉店処理検索", description: "日付範囲で閉店処理（締め）の記録を検索します。" },
  report: { title: "売上日報", description: "本日の結果・来店数・達成度・振り返り等を入力し、一時保存/日報送信します（送信はモック）。" },
  expenses: { title: "経費登録", description: "勘定科目ごとに経費を登録します。前月分のコピーに対応。" }
};

const inputClass = "rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-luxas-green";

function sumCounts(counts: CashCounts) {
  return Object.entries(counts).reduce((sum, [denom, qty]) => sum + Number(denom) * (Number(qty) || 0), 0);
}

export function DailyOps({ view = "all" }: { view?: DailyView }) {
  const [date, setDate] = useState(today());
  const [tab, setTab] = useState<DailyView>("attendance");

  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [shifts] = useLocalCollection<StaffShift>(shiftsStorageKey, initialShifts);
  const [reservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [targets] = useLocalCollection<DailyTarget>(dailyTargetsStorageKey, []);
  const [accounts] = useLocalCollection<ExpenseAccount>(expenseAccountsStorageKey, initialExpenseAccounts);

  const [attendance, setAttendance] = useLocalCollection<AttendanceRecord>(attendanceStorageKey, []);
  const [registers, setRegisters] = useLocalCollection<RegisterRecord>(registerStorageKey, []);
  const [expenses, setExpenses] = useLocalCollection<ExpenseEntry>(expenseEntriesStorageKey, []);
  const [reports, setReports] = useLocalCollection<DailyReport>(dailyReportsStorageKey, []);

  // 閉店処理検索の範囲。
  const [from, setFrom] = useState(today().slice(0, 8) + "01");
  const [to, setTo] = useState(today());

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

  // 売上日報フォーム（PM全項目・一時保存/送信）。
  const reportForm = useMemo(() => reports.find((r) => r.date === date) ?? emptyReport(date), [reports, date]);
  const [reportMessage, setReportMessage] = useState<StatusMessageValue | null>(null);
  function updateReport(field: keyof DailyReport, value: string) {
    setReports((current) => {
      const existing = current.find((r) => r.date === date);
      if (existing) {
        return current.map((r) => (r.date === date ? { ...r, [field]: value } : r));
      }
      return [...current, { ...emptyReport(date), [field]: value }];
    });
  }
  function saveReport(submit: boolean) {
    setReports((current) => {
      const existing = current.find((r) => r.date === date);
      if (existing) {
        return current.map((r) => (r.date === date ? { ...r, submitted: submit || r.submitted } : r));
      }
      return [...current, { ...emptyReport(date), submitted: submit }];
    });
    setReportMessage({ type: "success", text: submit ? "日報を送信しました（モック）。" : "日報を一時保存しました。" });
  }

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

  const closeHistory = useMemo(
    () =>
      registers
        .filter((r) => r.kind === "close" && r.date >= from && r.date <= to)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [registers, from, to]
  );

  // ---- セクション描画 ----
  const showTab = (key: DailyView) => view === "all" && tab === key;
  const showView = (key: DailyView) => view === key;

  function renderAttendance() {
    return (
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
    );
  }

  function renderRegisterOne(kind: RegisterRecord["kind"]) {
    const counts = regRecord(kind)?.counts ?? {};
    return (
      <section className="max-w-md rounded-lg border border-luxas-line bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-luxas-ink">{VIEW_META[kind].title}</h3>
          <span className="text-sm font-semibold text-luxas-ink">合計 ¥{sumCounts(counts).toLocaleString()}</span>
        </div>
        <CashDenominationTable counts={counts} onChange={(next) => updateReg(kind, next)} />
        <p className="mt-2 text-[11px] text-stone-400">※ 入力は自動保存されます（実際の現金確定・締め処理は行いません）。</p>
      </section>
    );
  }

  function renderRegisterAll() {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        {(["open", "check", "close"] as const).map((kind) => (
          <section key={kind} className="rounded-lg border border-luxas-line bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-luxas-ink">{VIEW_META[kind].title}</h3>
            <CashDenominationTable counts={regRecord(kind)?.counts ?? {}} onChange={(counts) => updateReg(kind, counts)} />
          </section>
        ))}
      </div>
    );
  }

  function renderCloseHistory() {
    return (
      <section className="rounded-lg border border-luxas-line bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-luxas-line px-4 py-3 text-sm">
          <label className="flex items-center gap-2 text-stone-700"><span className="font-medium">出力日次範囲</span><input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <span className="text-stone-400">〜</span>
          <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
          <span className="ml-auto text-stone-500">{closeHistory.length}件</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
              <tr><th className="px-4 py-3">日付</th><th className="px-4 py-3 text-right">締めレジ金合計</th></tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {closeHistory.length === 0 ? (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-stone-500">この範囲の閉店処理はありません。</td></tr>
              ) : (
                closeHistory.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-luxas-ink">{r.date}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-stone-700">¥{sumCounts(r.counts).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderReport() {
    const reportFields: { key: keyof DailyReport; label: string }[] = [
      { key: "result", label: "本日の結果" },
      { key: "achievement", label: "予算達成度" },
      { key: "staffProposals", label: "スタッフ提案数" },
      { key: "tomorrowPlan", label: "明日の予定" },
      { key: "plan", label: "実施プラン" },
      { key: "reflection", label: "振り返り" },
      { key: "shiftStatus", label: "シフト状況" },
      { key: "weather", label: "天気" }
    ];
    return (
      <div className="space-y-4">
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
        </section>

        <section className="space-y-3 rounded-lg border border-luxas-line bg-white p-5">
          <h3 className="text-sm font-semibold text-luxas-ink">日報入力（PM準拠）{reportForm.submitted ? <span className="ml-2 rounded-full bg-luxas-mist px-2 py-0.5 text-[11px] font-medium text-luxas-green">送信済</span> : null}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {reportFields.map((f) => (
              <label key={f.key} className="flex flex-col gap-1 text-xs text-stone-600">
                {f.label}
                <textarea
                  className="min-h-16 rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
                  value={String(reportForm[f.key] ?? "")}
                  onChange={(e) => updateReport(f.key, e.target.value)}
                />
              </label>
            ))}
          </div>
          <StatusMessage message={reportMessage} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => saveReport(false)} className="rounded-md border border-luxas-line bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-luxas-paper">一時保存</button>
            <button type="button" onClick={() => saveReport(true)} className="rounded-md bg-luxas-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#285f51]">日報送信</button>
          </div>
        </section>
        <p className="text-[11px] text-stone-400">※ 売上・支払は会計（予約詳細→会計）で確定したデータの集計です。日報送信はモック（保存のみ）。</p>
      </div>
    );
  }

  function renderExpenses() {
    return (
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
    );
  }

  const pageTitle = view === "all" ? "日次管理" : VIEW_META[view].title;
  const pageDescription =
    view === "all"
      ? "出勤退勤・レジ金（開店/点検/閉店）・売上日報・経費を日付ごとに管理します。会計未実装の集計はダミー/0です。"
      : VIEW_META[view].description;

  return (
    <MasterPage title={pageTitle} description={pageDescription}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <span className="font-medium">対象日</span>
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {view === "all" ? (
          <div className="inline-flex flex-wrap overflow-hidden rounded-md border border-luxas-line">
            {([{ key: "attendance", label: "出勤・退勤" }, { key: "register" as DailyView, label: "レジ金（開店/点検/閉店）" }, ...TABS.filter((t) => t.key !== "attendance")] as { key: DailyView; label: string }[]).map((t) => (
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
        ) : null}
      </div>

      {showView("attendance") || showTab("attendance") ? renderAttendance() : null}
      {showView("open") ? renderRegisterOne("open") : null}
      {showView("check") ? renderRegisterOne("check") : null}
      {showView("close") ? renderRegisterOne("close") : null}
      {showView("close-history") ? renderCloseHistory() : null}
      {view === "all" && tab === "register" ? renderRegisterAll() : null}
      {showView("report") || showTab("report") ? renderReport() : null}
      {showView("expenses") || showTab("expenses") ? renderExpenses() : null}
    </MasterPage>
  );
}
