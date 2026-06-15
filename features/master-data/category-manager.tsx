"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { categoriesStorageKey, initialCategories } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import type { MenuCategory } from "@/features/master-data/types";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

const COLORS = ["green", "rose", "sky", "amber", "stone"];

type CategoryForm = { name: string; sortOrder: string; color: string; isActive: boolean };
const emptyForm: CategoryForm = { name: "", sortOrder: "10", color: "green", isActive: true };

export function CategoryManager() {
  const [categories, setCategories] = useLocalCollection<MenuCategory>(categoriesStorageKey, initialCategories);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
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
      sortOrder: Number(form.sortOrder) || 0,
      color: form.color,
      isActive: form.isActive
    };
    if (editingId) {
      setCategories((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "カテゴリを更新しました。" });
    } else {
      setCategories((current) => [{ id: makeLocalId("category"), ...payload }, ...current]);
      setMessage({ type: "success", text: "カテゴリを追加しました。" });
    }
    resetForm();
  }

  function handleEdit(item: MenuCategory) {
    setEditingId(item.id);
    setForm({ name: item.name, sortOrder: String(item.sortOrder), color: item.color, isActive: item.isActive });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setCategories((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: "カテゴリを削除しました。" });
  }

  const columns: MasterColumn<MenuCategory>[] = [
    { key: "id", header: "ID", render: (i) => <span className="font-mono text-xs text-stone-400">{i.id.slice(0, 8)}</span> },
    { key: "name", header: "カテゴリ名", render: (i) => <span className="font-medium text-luxas-ink">{i.name}</span> },
    { key: "color", header: "色", render: (i) => i.color },
    { key: "sortOrder", header: "表示順", render: (i) => i.sortOrder },
    { key: "status", header: "状態", render: (i) => <ActiveBadge isActive={i.isActive} /> }
  ];

  function renderDetail() {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "カテゴリを編集" : "カテゴリを追加"}</h2>
          {editingId !== null ? (
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
              <RotateCcw size={14} aria-hidden="true" />
              閉じる
            </button>
          ) : null}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField label="カテゴリ名" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: ボディケア" required />
          <TextField label="表示順" value={form.sortOrder} onChange={(v) => setForm((c) => ({ ...c, sortOrder: v }))} type="number" min="0" />
          <SelectField label="色" value={form.color} onChange={(v) => setForm((c) => ({ ...c, color: v }))}>
            {COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </SelectField>
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
    <MasterPage title="メニューカテゴリ管理" description="メニューのカテゴリ（色分け）を管理します。メニュー側の文字列カテゴリと名称で対応します。">
      <MasterSplitPanel
        items={sortedCategories}
        columns={columns}
        searchKeys={["name"]}
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
