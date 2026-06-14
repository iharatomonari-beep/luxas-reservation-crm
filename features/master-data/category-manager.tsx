"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { categoriesStorageKey, initialCategories } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
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

  return (
    <MasterPage title="メニューカテゴリ管理" description="メニューのカテゴリ（色分け）を管理します。メニュー側の文字列カテゴリと名称で対応します。">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "カテゴリを編集" : "カテゴリを追加"}</h2>
            {editingId ? (
              <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
                <RotateCcw size={14} aria-hidden="true" />
                解除
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
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
              <Plus size={17} aria-hidden="true" />
              {editingId ? "更新する" : "追加する"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-luxas-line bg-white">
          <div className="border-b border-luxas-line px-5 py-4">
            <h2 className="text-base font-semibold text-luxas-ink">カテゴリ一覧</h2>
            <p className="mt-1 text-sm text-stone-500">{categories.length}件</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
                <tr>
                  <th className="px-5 py-3">カテゴリ名</th>
                  <th className="px-5 py-3">色</th>
                  <th className="px-5 py-3">表示順</th>
                  <th className="px-5 py-3">状態</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxas-line">
                {[...categories].sort(compareBySortOrder).map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{item.name}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.color}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.sortOrder}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <ActiveBadge isActive={item.isActive} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={() => handleEdit(item)}>
                          <Pencil size={14} aria-hidden="true" />
                          編集
                        </button>
                        <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={14} aria-hidden="true" />
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MasterPage>
  );
}
