"use client";

import { useState } from "react";
import { MasterPage } from "@/features/master-data/master-page";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { compareBySortOrder } from "@/features/master-data/utils";

type ShiftTemplate = { id: string; name: string; staffCount: number; shiftCount: number; terminal: string; sortOrder: number };
const shiftTemplatesStorageKey = "luxas-shift-templates";
const initialShiftTemplates: ShiftTemplate[] = [
  { id: "st-001", name: "平日標準", staffCount: 5, shiftCount: 5, terminal: "予約端末A", sortOrder: 10 },
  { id: "st-002", name: "土日厚め", staffCount: 7, shiftCount: 7, terminal: "予約端末A", sortOrder: 20 }
];

export function ShiftTemplates() {
  const [templates] = useLocalCollection<ShiftTemplate>(shiftTemplatesStorageKey, initialShiftTemplates);
  const [query, setQuery] = useState("");
  const rows = [...templates].sort(compareBySortOrder).filter((t) => !query.trim() || t.name.includes(query.trim()));

  return (
    <MasterPage title="シフトひな型設定" description="シフトのひな型を管理します（v0.1 は表示のみ・PM準拠の枠）。">
      <section className="rounded-lg border border-luxas-line bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-luxas-line px-4 py-3 text-sm">
          <input type="search" className="rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-luxas-green" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ひな型名で検索" />
          <span className="ml-auto text-stone-500">{rows.length}件</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">ひな型名</th>
                <th className="px-4 py-3">登録スタッフ</th>
                <th className="px-4 py-3">登録シフト</th>
                <th className="px-4 py-3">予約端末</th>
                <th className="px-4 py-3">表示順</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-stone-500">ひな型がありません。</td></tr>
              ) : (
                rows.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-400">{t.id.slice(0, 8)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-luxas-ink">{t.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{t.staffCount}名</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{t.shiftCount}件</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{t.terminal}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{t.sortOrder}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </MasterPage>
  );
}
