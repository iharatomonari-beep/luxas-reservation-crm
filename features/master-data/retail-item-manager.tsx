"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import {
  initialRetailCategories,
  initialRetailItems,
  retailCategoriesStorageKey,
  retailItemsStorageKey
} from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import type { RetailCategory, RetailItem } from "@/features/master-data/types";
import { compareBySortOrder, formatCurrency, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { formatTimestamp, stampCreate, stampUpdate } from "@/features/master-data/timestamps";

type ItemForm = { name: string; category: string; price: string; sortOrder: string; isActive: boolean };
type CategoryForm = { name: string; sortOrder: string; isActive: boolean };

const emptyItemForm: ItemForm = { name: "", category: "", price: "0", sortOrder: "10", isActive: true };
const emptyCategoryForm: CategoryForm = { name: "", sortOrder: "10", isActive: true };

export function RetailItemManager() {
  const [categories, setCategories] = useLocalCollection<RetailCategory>(retailCategoriesStorageKey, initialRetailCategories);
  const [items, setItems] = useLocalCollection<RetailItem>(retailItemsStorageKey, initialRetailItems);

  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemMessage, setItemMessage] = useState<StatusMessageValue | null>(null);

  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState<StatusMessageValue | null>(null);

  const activeCategories = [...categories].sort(compareBySortOrder).filter((c) => c.isActive);

  function resetItemForm() {
    setItemForm(emptyItemForm);
    setEditingItemId(null);
  }

  function handleItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBlank(itemForm.name)) {
      setItemMessage({ type: "error", text: "商品名を入力してください。" });
      return;
    }
    const payload = {
      name: normalizeText(itemForm.name),
      category: itemForm.category,
      price: Number(itemForm.price) || 0,
      sortOrder: Number(itemForm.sortOrder) || 0,
      isActive: itemForm.isActive
    };
    if (editingItemId) {
      setItems((current) => current.map((item) => (item.id === editingItemId ? { ...item, ...stampUpdate(payload, item) } : item)));
      setItemMessage({ type: "success", text: "物販商品を更新しました。" });
    } else {
      setItems((current) => [{ id: makeLocalId("retail"), ...stampCreate(payload) }, ...current]);
      setItemMessage({ type: "success", text: "物販商品を追加しました。" });
    }
    resetItemForm();
  }

  function handleItemEdit(item: RetailItem) {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      sortOrder: String(item.sortOrder),
      isActive: item.isActive
    });
    setItemMessage(null);
  }

  // 物理削除はしない（物販履歴の商品名解決のためデータは残す）。販売停止＝isActive=false。
  function handleItemDeactivate(id: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...stampUpdate({ ...item, isActive: false }, item) } : item)));
    setItemMessage({ type: "success", text: "物販商品を販売停止（無効）にしました。物販履歴の商品名は引き続き表示されます。" });
  }

  function resetCategoryForm() {
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId(null);
  }

  function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBlank(categoryForm.name)) {
      setCategoryMessage({ type: "error", text: "カテゴリ名を入力してください。" });
      return;
    }
    const payload = {
      name: normalizeText(categoryForm.name),
      sortOrder: Number(categoryForm.sortOrder) || 0,
      isActive: categoryForm.isActive
    };
    if (editingCategoryId) {
      setCategories((current) => current.map((item) => (item.id === editingCategoryId ? { ...item, ...payload } : item)));
      setCategoryMessage({ type: "success", text: "物販カテゴリを更新しました。" });
    } else {
      setCategories((current) => [{ id: makeLocalId("retail-cat"), ...payload }, ...current]);
      setCategoryMessage({ type: "success", text: "物販カテゴリを追加しました。" });
    }
    resetCategoryForm();
  }

  function handleCategoryEdit(item: RetailCategory) {
    setEditingCategoryId(item.id);
    setCategoryForm({ name: item.name, sortOrder: String(item.sortOrder), isActive: item.isActive });
    setCategoryMessage(null);
  }

  function handleCategoryDelete(id: string) {
    setCategories((current) => current.filter((item) => item.id !== id));
    if (editingCategoryId === id) resetCategoryForm();
    setCategoryMessage({ type: "success", text: "物販カテゴリを削除しました。" });
  }

  return (
    <MasterPage title="物販商品マスタ" description="店頭で販売する物販商品とそのカテゴリを管理します。販売登録は「物販販売」画面から行います。">
      <div className="space-y-8">
        {/* 物販商品 */}
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-luxas-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-luxas-ink">{editingItemId ? "物販商品を編集" : "物販商品を追加"}</h2>
              {editingItemId ? (
                <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetItemForm}>
                  <RotateCcw size={14} aria-hidden="true" />
                  解除
                </button>
              ) : null}
            </div>
            {editingItemId ? (
              (() => {
                const editing = items.find((it) => it.id === editingItemId);
                return editing ? (
                  <p className="mb-3 text-[11px] text-stone-400">作成日: {formatTimestamp(editing.createdAt)} ／ 最終更新日: {formatTimestamp(editing.updatedAt)}</p>
                ) : null;
              })()
            ) : null}
            <form className="space-y-4" onSubmit={handleItemSubmit}>
              <TextField label="商品名" value={itemForm.name} onChange={(v) => setItemForm((c) => ({ ...c, name: v }))} placeholder="例: ホームケアオイル" required />
              <SelectField label="カテゴリ" value={itemForm.category} onChange={(v) => setItemForm((c) => ({ ...c, category: v }))}>
                <option value="">（未分類）</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </SelectField>
              <TextField label="単価（円・税込）" value={itemForm.price} onChange={(v) => setItemForm((c) => ({ ...c, price: v }))} type="number" min="0" />
              <TextField label="表示順" value={itemForm.sortOrder} onChange={(v) => setItemForm((c) => ({ ...c, sortOrder: v }))} type="number" min="0" />
              <ToggleField label="有効にする" checked={itemForm.isActive} onChange={(v) => setItemForm((c) => ({ ...c, isActive: v }))} />
              <StatusMessage message={itemMessage} />
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
                <Plus size={17} aria-hidden="true" />
                {editingItemId ? "更新する" : "追加する"}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-luxas-line bg-white">
            <div className="border-b border-luxas-line px-5 py-4">
              <h2 className="text-base font-semibold text-luxas-ink">物販商品一覧</h2>
              <p className="mt-1 text-sm text-stone-500">{items.length}件</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
                  <tr>
                    <th className="px-5 py-3">商品名</th>
                    <th className="px-5 py-3">カテゴリ</th>
                    <th className="px-5 py-3 text-right">単価</th>
                    <th className="px-5 py-3">表示順</th>
                    <th className="px-5 py-3">状態</th>
                    <th className="px-5 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxas-line">
                  {[...items].sort(compareBySortOrder).map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{item.name}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.category || "—"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-stone-700">{formatCurrency(item.price)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.sortOrder}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <ActiveBadge isActive={item.isActive} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={() => handleItemEdit(item)}>
                            <Pencil size={14} aria-hidden="true" />
                            編集
                          </button>
                          {item.isActive ? (
                            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50" onClick={() => handleItemDeactivate(item.id)}>
                              <Trash2 size={14} aria-hidden="true" />
                              販売停止
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-stone-500">物販商品がありません。</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* 物販カテゴリ */}
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-luxas-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-luxas-ink">{editingCategoryId ? "物販カテゴリを編集" : "物販カテゴリを追加"}</h2>
              {editingCategoryId ? (
                <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetCategoryForm}>
                  <RotateCcw size={14} aria-hidden="true" />
                  解除
                </button>
              ) : null}
            </div>
            <form className="space-y-4" onSubmit={handleCategorySubmit}>
              <TextField label="カテゴリ名" value={categoryForm.name} onChange={(v) => setCategoryForm((c) => ({ ...c, name: v }))} placeholder="例: ホームケア" required />
              <TextField label="表示順" value={categoryForm.sortOrder} onChange={(v) => setCategoryForm((c) => ({ ...c, sortOrder: v }))} type="number" min="0" />
              <ToggleField label="有効にする" checked={categoryForm.isActive} onChange={(v) => setCategoryForm((c) => ({ ...c, isActive: v }))} />
              <StatusMessage message={categoryMessage} />
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
                <Plus size={17} aria-hidden="true" />
                {editingCategoryId ? "更新する" : "追加する"}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-luxas-line bg-white">
            <div className="border-b border-luxas-line px-5 py-4">
              <h2 className="text-base font-semibold text-luxas-ink">物販カテゴリ一覧</h2>
              <p className="mt-1 text-sm text-stone-500">{categories.length}件</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
                  <tr>
                    <th className="px-5 py-3">カテゴリ名</th>
                    <th className="px-5 py-3">表示順</th>
                    <th className="px-5 py-3">状態</th>
                    <th className="px-5 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxas-line">
                  {[...categories].sort(compareBySortOrder).map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{item.name}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.sortOrder}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <ActiveBadge isActive={item.isActive} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={() => handleCategoryEdit(item)}>
                            <Pencil size={14} aria-hidden="true" />
                            編集
                          </button>
                          <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" onClick={() => handleCategoryDelete(item.id)}>
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
      </div>
    </MasterPage>
  );
}
