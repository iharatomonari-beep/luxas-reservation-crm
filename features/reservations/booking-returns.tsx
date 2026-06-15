"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  initialServices,
  initialStaff,
  initialTags,
  servicesStorageKey,
  staffStorageKey,
  tagsStorageKey
} from "@/features/master-data/mock-data";
import type { MasterTag, ServiceMenu, StaffMember } from "@/features/master-data/types";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import { cancelTypeLabels, type Reservation } from "@/features/reservations/types";
import { filterReservationsByStore } from "@/features/reservations/store-scope";
import { useCurrentStore } from "@/features/org/use-current-store";

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingReturns() {
  const [reservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [tags] = useLocalCollection<MasterTag>(tagsStorageKey, initialTags);
  const { currentStoreId } = useCurrentStore();
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [query, setQuery] = useState("");

  // 現在店舗で安全フィルタ（T063）。
  const scopedReservations = useMemo(() => filterReservationsByStore(reservations, currentStoreId), [reservations, currentStoreId]);

  const rows = useMemo(
    () =>
      scopedReservations
        .filter((r) => r.status === "canceled")
        .filter((r) => (!from || r.date >= from) && (!to || r.date <= to))
        .filter((r) => {
          const q = query.trim();
          if (!q) return true;
          return r.customerName.includes(q) || (r.phone ?? "").includes(q);
        })
        .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date))),
    [scopedReservations, from, to, query]
  );

  const staffName = (id: string) => staff.find((s) => s.id === id)?.displayName ?? "-";
  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? "-";
  const kindLabel = (r: Reservation) =>
    r.cancelType && r.cancelType !== "none" ? cancelTypeLabels[r.cancelType] : "取消";
  const tagLabel = (r: Reservation) => {
    const names = (r.bookingTagIds ?? [])
      .map((id) => tags.find((t) => t.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    return names.length ? names.join(", ") : "-";
  };
  const inputClass = "rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-luxas-green";

  return (
    <div className="space-y-4">
      <section className="border-b border-luxas-line pb-2">
        <p className="text-sm font-medium text-luxas-green">Booking Returns</p>
        <h1 className="mt-1 inline-flex items-center gap-2 text-xl font-semibold text-luxas-ink">
          <Undo2 size={20} aria-hidden="true" />
          返客一覧
        </h1>
        <p className="mt-1 text-sm text-stone-600">キャンセルされた予約（再来店促進の対象候補）を一覧します。</p>
      </section>

      <section className="rounded-lg border border-luxas-line bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-luxas-line px-4 py-3 text-sm">
          <label className="flex items-center gap-2 text-stone-700"><span className="font-medium">期間</span><input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <span className="text-stone-400">〜</span>
          <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
          <input
            type="search"
            className={inputClass}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="顧客名・電話で検索"
          />
          <button
            type="button"
            disabled
            title="準備中"
            className="cursor-not-allowed rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm font-medium text-stone-300"
          >
            ＋ 検索条件追加
          </button>
          <span className="ml-auto text-stone-500">{rows.length}件</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">日付</th>
                <th className="px-4 py-3">開始</th>
                <th className="px-4 py-3">顧客</th>
                <th className="px-4 py-3">種別</th>
                <th className="px-4 py-3">返客理由/キャンセル待ち</th>
                <th className="px-4 py-3">コメント</th>
                <th className="px-4 py-3">予約タグ</th>
                <th className="px-4 py-3">担当</th>
                <th className="px-4 py-3">コース</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {rows.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-stone-500">対象の返客はありません。</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-luxas-paper/60">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-400">{r.id.slice(0, 8)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-luxas-ink">
                      <Link href={`/dashboard/reservations?date=${r.date}`} className="hover:text-luxas-green hover:underline">{r.date}</Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{r.startTime}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-luxas-ink">{r.customerName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{kindLabel(r)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{r.cancelReason?.trim() ? r.cancelReason : "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{r.memo?.trim() ? r.memo : "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{tagLabel(r)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{staffName(r.staffId)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{serviceName(r.serviceMenuId)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-luxas-line px-4 py-2 text-[11px] text-stone-400">
          ※ 現状は status=canceled を返客対象にしています。種別=キャンセル種別、返客理由=cancelReason、予約タグ=予約ルートタグから実値表示（無ければ「-」）。返客専用区分マスタは将来対応。
        </p>
      </section>
    </div>
  );
}
