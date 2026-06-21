"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MasterPage } from "@/features/master-data/master-page";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { useStoreSettings } from "@/features/master-data/store-settings";
import { useCurrentStore } from "@/features/org/use-current-store";
import { makeLocalId } from "@/features/master-data/utils";

// storeId?: 店舗スコープ（非破壊・任意）。未設定の既存ブロックは全店共通として扱う。
export type OnlineBlock = { id: string; date: string; name: string; blockId: string; startTime: string; endTime: string; storeId?: string };
export const onlineBlocksStorageKey = "luxas-online-blocks";
export const initialOnlineBlocks: OnlineBlock[] = [];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const inputClass = "rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-luxas-green";

export function OnlineBlocks() {
  const [settings] = useStoreSettings();
  const { currentStoreId, store } = useCurrentStore();
  const [blocks, setBlocks] = useLocalCollection<OnlineBlock>(onlineBlocksStorageKey, initialOnlineBlocks);
  const [date, setDate] = useState(today());
  const [form, setForm] = useState({ name: "", startTime: "10:00", endTime: "11:00" });

  // 現在店舗のブロック（storeId 一致 or 未設定の全店共通）だけを表示する。
  const dayBlocks = blocks.filter((b) => b.date === date && (!b.storeId || b.storeId === currentStoreId));

  function addBlock() {
    if (!form.name.trim()) return;
    setBlocks((current) => [
      { id: makeLocalId("blk"), date, name: form.name.trim(), blockId: makeLocalId("B").toUpperCase().slice(0, 8), startTime: form.startTime, endTime: form.endTime, storeId: currentStoreId },
      ...current
    ]);
    setForm({ name: "", startTime: "10:00", endTime: "11:00" });
  }

  return (
    <MasterPage title="本日のオンライン設定状況" description={`開店/閉店・オンライン公開状況の確認と、オンライン予約ブロックの設定を行います（v0.1）。設定対象店舗: ${store?.name ?? "現在店舗"}`}>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-luxas-line bg-white p-4"><p className="text-xs text-stone-500">開店/閉店状況</p><p className="mt-1 text-lg font-semibold text-luxas-ink">営業時間 {settings.businessStartTime}-{settings.businessEndTime}</p></div>
        <div className="rounded-lg border border-luxas-line bg-white p-4"><p className="text-xs text-stone-500">オンライン公開状況</p><p className="mt-1 text-lg font-semibold text-luxas-ink">{settings.onlineReservationEnabled ? "公開中（モック）" : "非公開"}</p></div>
        <div className="rounded-lg border border-luxas-line bg-white p-4"><p className="text-xs text-stone-500">シフト状況</p><p className="mt-1 text-lg font-semibold text-luxas-ink">月間シフトで管理</p></div>
      </div>

      <section className="rounded-lg border border-luxas-line bg-white">
        <div className="flex flex-wrap items-end gap-3 border-b border-luxas-line px-4 py-3 text-sm">
          <label className="flex items-center gap-2 text-stone-700"><span className="font-medium">日付</span><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">ブロック名<input className={inputClass} value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="例: 研修のため停止" /></label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">開始<input type="time" className={inputClass} value={form.startTime} onChange={(e) => setForm((c) => ({ ...c, startTime: e.target.value }))} /></label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">終了<input type="time" className={inputClass} value={form.endTime} onChange={(e) => setForm((c) => ({ ...c, endTime: e.target.value }))} /></label>
          <button type="button" onClick={addBlock} className="inline-flex items-center gap-1.5 rounded-md bg-luxas-green px-3 py-2 text-sm font-semibold text-white hover:bg-[#285f51]"><Plus size={15} aria-hidden="true" />新規</button>
          <span className="ml-auto text-stone-500">{dayBlocks.length}件</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">日付</th>
                <th className="px-4 py-3">名前</th>
                <th className="px-4 py-3">ブロックID</th>
                <th className="px-4 py-3">開始</th>
                <th className="px-4 py-3">終了</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {dayBlocks.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-stone-500">この日のオンラインブロックはありません。</td></tr>
              ) : (
                dayBlocks.map((b) => (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-400">{b.id.slice(0, 8)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{b.date}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-luxas-ink">{b.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-500">{b.blockId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{b.startTime}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-700">{b.endTime}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button type="button" className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50" onClick={() => setBlocks((current) => current.filter((x) => x.id !== b.id))}>
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </td>
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
