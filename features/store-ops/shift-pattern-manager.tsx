"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { TextField } from "@/features/master-data/form-controls";
import { MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type ShiftPattern = { id: string; name: string; startTime: string; endTime: string; sortOrder: number };
const shiftPatternsStorageKey = "luxas-shift-patterns";
const initialShiftPatterns: ShiftPattern[] = [
  { id: "sp-001", name: "早番", startTime: "10:00", endTime: "19:00", sortOrder: 10 },
  { id: "sp-002", name: "遅番", startTime: "13:00", endTime: "22:00", sortOrder: 20 },
  { id: "sp-003", name: "通し", startTime: "10:00", endTime: "22:00", sortOrder: 30 }
];

type PatForm = { name: string; startTime: string; endTime: string; sortOrder: string };
const emptyForm: PatForm = { name: "", startTime: "10:00", endTime: "19:00", sortOrder: "10" };

export function ShiftPatternManager() {
  const [patterns, setPatterns] = useLocalCollection<ShiftPattern>(shiftPatternsStorageKey, initialShiftPatterns);
  const [form, setForm] = useState<PatForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const sorted = useMemo(() => [...patterns].sort(compareBySortOrder), [patterns]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }
  function startCreate() {
    setForm(emptyForm);
    setEditingId("");
    setMessage(null);
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBlank(form.name)) {
      setMessage({ type: "error", text: "パターン名を入力してください。" });
      return;
    }
    const payload = { name: normalizeText(form.name), startTime: form.startTime, endTime: form.endTime, sortOrder: Number(form.sortOrder) || 0 };
    if (editingId) {
      setPatterns((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "シフトパターンを更新しました。" });
    } else {
      setPatterns((current) => [{ id: makeLocalId("sp"), ...payload }, ...current]);
      setMessage({ type: "success", text: "シフトパターンを追加しました。" });
    }
    resetForm();
  }
  function handleEdit(item: ShiftPattern) {
    setEditingId(item.id);
    setForm({ name: item.name, startTime: item.startTime, endTime: item.endTime, sortOrder: String(item.sortOrder) });
    setMessage(null);
  }
  function handleDelete(id: string) {
    setPatterns((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: "シフトパターンを削除しました。" });
  }

  const columns: MasterColumn<ShiftPattern>[] = [
    { key: "id", header: "ID", render: (i) => <span className="font-mono text-xs text-stone-400">{i.id.slice(0, 8)}</span> },
    { key: "name", header: "名前", render: (i) => <span className="font-medium text-luxas-ink">{i.name}</span> },
    { key: "time", header: "シフト時間", render: (i) => `${i.startTime} - ${i.endTime}` },
    { key: "sortOrder", header: "表示順", render: (i) => i.sortOrder }
  ];

  function renderDetail() {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "パターンを編集" : "パターンを追加"}</h2>
          {editingId !== null ? (
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
              <RotateCcw size={14} aria-hidden="true" />閉じる
            </button>
          ) : null}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField label="パターン名" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: 早番" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="開始時刻" type="time" value={form.startTime} onChange={(v) => setForm((c) => ({ ...c, startTime: v }))} />
            <TextField label="終了時刻" type="time" value={form.endTime} onChange={(v) => setForm((c) => ({ ...c, endTime: v }))} />
          </div>
          <TextField label="表示順" type="number" min="0" value={form.sortOrder} onChange={(v) => setForm((c) => ({ ...c, sortOrder: v }))} />
          <StatusMessage message={message} />
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
              <Plus size={17} aria-hidden="true" />{editingId ? "更新する" : "追加する"}
            </button>
            {editingId ? (
              <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-3 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => handleDelete(editingId)}>
                <Trash2 size={15} aria-hidden="true" />削除
              </button>
            ) : null}
          </div>
        </form>
      </div>
    );
  }

  return (
    <MasterPage title="シフトパターン設定" description="シフトの時間帯パターンを管理します（シフト作成時の選択肢）。">
      <MasterSplitPanel items={sorted} columns={columns} searchKeys={["name"]} selectedId={editingId} onSelect={handleEdit} onCreate={startCreate} renderDetail={renderDetail} searchPlaceholder="名前で検索" createLabel="新規作成" />
    </MasterPage>
  );
}
