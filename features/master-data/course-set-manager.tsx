"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { TextField, ToggleField } from "@/features/master-data/form-controls";
import { courseSetsStorageKey, initialCourseSets } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import type { CourseSet } from "@/features/master-data/types";
import { compareBySortOrder, formatCurrency, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type SetForm = { name: string; category: string; price: string; sortOrder: string; onlineBooking: boolean; isActive: boolean };
const emptyForm: SetForm = { name: "", category: "セット", price: "0", sortOrder: "10", onlineBooking: false, isActive: true };

export function CourseSetManager() {
  const [sets, setSets] = useLocalCollection<CourseSet>(courseSetsStorageKey, initialCourseSets);
  const [form, setForm] = useState<SetForm>(emptyForm);
  // null=未選択 / ""=新規 / id=編集。
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const sortedSets = useMemo(() => [...sets].sort(compareBySortOrder), [sets]);

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
      setMessage({ type: "error", text: "セット商品名を入力してください。" });
      return;
    }
    const payload = {
      name: normalizeText(form.name),
      category: normalizeText(form.category) || "セット",
      price: Number(form.price) || 0,
      sortOrder: Number(form.sortOrder) || 0,
      onlineBooking: form.onlineBooking,
      isActive: form.isActive
    };
    if (editingId) {
      setSets((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "セット商品を更新しました。" });
    } else {
      setSets((current) => [{ id: makeLocalId("set"), ...payload }, ...current]);
      setMessage({ type: "success", text: "セット商品を追加しました。" });
    }
    resetForm();
  }

  function handleEdit(item: CourseSet) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      sortOrder: String(item.sortOrder),
      onlineBooking: item.onlineBooking ?? false,
      isActive: item.isActive
    });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setSets((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: "セット商品を削除しました。" });
  }

  const columns: MasterColumn<CourseSet>[] = [
    { key: "id", header: "ID", render: (i) => <span className="font-mono text-xs text-stone-400">{i.id.slice(0, 8)}</span> },
    { key: "category", header: "カテゴリ", render: (i) => i.category },
    { key: "name", header: "セット名", render: (i) => <span className="font-medium text-luxas-ink">{i.name}</span> },
    { key: "price", header: "施術料金", render: (i) => formatCurrency(i.price) },
    { key: "sortOrder", header: "表示順", render: (i) => i.sortOrder },
    { key: "online", header: "オンライン予約", render: (i) => (i.onlineBooking ? "○" : "×") },
    { key: "status", header: "状態", render: (i) => <ActiveBadge isActive={i.isActive} /> }
  ];

  function renderDetail() {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "セット商品を編集" : "セット商品を追加"}</h2>
          {editingId !== null ? (
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
              <RotateCcw size={14} aria-hidden="true" />
              閉じる
            </button>
          ) : null}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField label="セット名" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: ボディ+フェイシャル 90分セット" required />
          <TextField label="カテゴリ" value={form.category} onChange={(v) => setForm((c) => ({ ...c, category: v }))} placeholder="例: セット" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="施術料金（税込・円）" value={form.price} onChange={(v) => setForm((c) => ({ ...c, price: v }))} type="number" min="0" />
            <TextField label="表示順" value={form.sortOrder} onChange={(v) => setForm((c) => ({ ...c, sortOrder: v }))} type="number" min="0" />
          </div>
          <ToggleField label="オンライン予約に掲載" checked={form.onlineBooking} onChange={(v) => setForm((c) => ({ ...c, onlineBooking: v }))} />
          <ToggleField label="有効にする" checked={form.isActive} onChange={(v) => setForm((c) => ({ ...c, isActive: v }))} />
          <StatusMessage message={message} />
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
              <Plus size={17} aria-hidden="true" />
              {editingId ? "更新する" : "追加する"}
            </button>
            {editingId ? (
              <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-3 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => handleDelete(editingId)}>
                <Trash2 size={15} aria-hidden="true" />
                削除
              </button>
            ) : null}
          </div>
        </form>
      </div>
    );
  }

  return (
    <MasterPage title="セット商品マスタ" description="複数コースの組み合わせなどをセット商品として管理します（PM準拠・T053）。">
      <MasterSplitPanel
        items={sortedSets}
        columns={columns}
        searchKeys={["name", "category"]}
        selectedId={editingId}
        onSelect={handleEdit}
        onCreate={startCreate}
        renderDetail={renderDetail}
        searchPlaceholder="セット名で検索"
        createLabel="新規作成"
      />
    </MasterPage>
  );
}
