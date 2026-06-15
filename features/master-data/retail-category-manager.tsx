"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { TextField, ToggleField } from "@/features/master-data/form-controls";
import { initialRetailCategories, retailCategoriesStorageKey } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import type { RetailCategory } from "@/features/master-data/types";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type CatForm = { name: string; shortName: string; sortOrder: string; isActive: boolean };
const emptyForm: CatForm = { name: "", shortName: "", sortOrder: "10", isActive: true };

export function RetailCategoryManager() {
  const [categories, setCategories] = useLocalCollection<RetailCategory>(retailCategoriesStorageKey, initialRetailCategories);
  const [form, setForm] = useState<CatForm>(emptyForm);
  // null=未選択 / ""=新規 / id=編集。
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const sortedCategories = useMemo(() => [...categories].sort(compareBySortOrder), [categories]);

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
      setMessage({ type: "error", text: "カテゴリ名を入力してください。" });
      return;
    }
    const payload = {
      name: normalizeText(form.name),
      shortName: normalizeText(form.shortName),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive
    };
    if (editingId) {
      setCategories((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "物販カテゴリを更新しました。" });
    } else {
      setCategories((current) => [{ id: makeLocalId("retail-cat"), ...payload }, ...current]);
      setMessage({ type: "success", text: "物販カテゴリを追加しました。" });
    }
    resetForm();
  }

  function handleEdit(item: RetailCategory) {
    setEditingId(item.id);
    setForm({ name: item.name, shortName: item.shortName ?? "", sortOrder: String(item.sortOrder), isActive: item.isActive });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setCategories((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: "物販カテゴリを削除しました。" });
  }

  const columns: MasterColumn<RetailCategory>[] = [
    { key: "id", header: "ID", render: (i) => <span className="font-mono text-xs text-stone-400">{i.id.slice(0, 10)}</span> },
    { key: "name", header: "名前", render: (i) => <span className="font-medium text-luxas-ink">{i.name}</span> },
    { key: "shortName", header: "省略名", render: (i) => i.shortName?.trim() ? i.shortName : "—" },
    { key: "sortOrder", header: "表示順", render: (i) => i.sortOrder },
    { key: "status", header: "状態", render: (i) => <ActiveBadge isActive={i.isActive} /> }
  ];

  function renderDetail() {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "物販カテゴリを編集" : "物販カテゴリを追加"}</h2>
          {editingId !== null ? (
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
              <RotateCcw size={14} aria-hidden="true" />
              閉じる
            </button>
          ) : null}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField label="名前" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: 物販" required />
          <TextField label="省略名（任意）" value={form.shortName} onChange={(v) => setForm((c) => ({ ...c, shortName: v }))} placeholder="例: 物" />
          <TextField label="表示順" value={form.sortOrder} onChange={(v) => setForm((c) => ({ ...c, sortOrder: v }))} type="number" min="0" />
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
    <MasterPage title="物販カテゴリマスタ" description="物販商品の分類を管理します（物販商品画面と同じデータを参照・PM準拠の省略名対応）。">
      <MasterSplitPanel
        items={sortedCategories}
        columns={columns}
        searchKeys={["name", "shortName"]}
        selectedId={editingId}
        onSelect={handleEdit}
        onCreate={startCreate}
        renderDetail={renderDetail}
        searchPlaceholder="カテゴリ名で検索"
        createLabel="新規作成"
      />
    </MasterPage>
  );
}
