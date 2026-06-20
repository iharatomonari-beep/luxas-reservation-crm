"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { checkoutItemsStorageKey, initialCheckoutItems } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { checkoutItemKindLabels, type CheckoutItem, type CheckoutItemKind } from "@/features/master-data/types";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

const KIND_ORDER: CheckoutItemKind[] = ["discount", "couponUse", "ticketUse", "couponSale", "ticketSale", "retail"];
const KIND_HINTS: Record<CheckoutItemKind, string> = {
  discount: "支払金額から−／売上マイナス",
  couponUse: "支払金額から−／売上計上（個人にも紐付け）",
  ticketUse: "支払金額から−／売上計上（個人にも紐付け）",
  couponSale: "支払金額に＋／預り金として計上",
  ticketSale: "支払金額に＋／預り金として計上",
  retail: "支払金額に＋／売上計上／担当スタッフ紐付け"
};

type ItemForm = { kind: CheckoutItemKind; name: string; amount: string; sortOrder: string; isActive: boolean };
const emptyForm: ItemForm = { kind: "discount", name: "", amount: "0", sortOrder: "10", isActive: true };

export function CheckoutItemManager() {
  const [items, setItems] = useLocalCollection<CheckoutItem>(checkoutItemsStorageKey, initialCheckoutItems);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const k = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
        return k !== 0 ? k : compareBySortOrder(a, b);
      }),
    [items]
  );

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
      setMessage({ type: "error", text: "アイテム名を入力してください。" });
      return;
    }
    const payload = {
      kind: form.kind,
      name: normalizeText(form.name),
      amount: Number(form.amount) || 0,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive
    };
    if (editingId) {
      setItems((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "会計アイテムを更新しました。" });
    } else {
      setItems((current) => [{ id: makeLocalId("checkout-item"), ...payload }, ...current]);
      setMessage({ type: "success", text: "会計アイテムを追加しました。" });
    }
    resetForm();
  }

  function handleEdit(item: CheckoutItem) {
    setEditingId(item.id);
    setForm({ kind: item.kind, name: item.name, amount: String(item.amount), sortOrder: String(item.sortOrder), isActive: item.isActive });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: "会計アイテムを削除しました。" });
  }

  const columns: MasterColumn<CheckoutItem>[] = [
    { key: "kind", header: "区分", render: (i) => <span className="rounded-full bg-luxas-mist px-2 py-0.5 text-xs font-medium text-luxas-green">{checkoutItemKindLabels[i.kind]}</span> },
    { key: "name", header: "名前", render: (i) => <span className="font-medium text-luxas-ink">{i.name}</span> },
    { key: "amount", header: "金額", render: (i) => `¥${i.amount.toLocaleString()}` },
    { key: "sortOrder", header: "表示順", render: (i) => i.sortOrder },
    { key: "status", header: "状態", render: (i) => <ActiveBadge isActive={i.isActive} /> }
  ];

  function renderDetail() {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "会計アイテムを編集" : "会計アイテムを追加"}</h2>
          {editingId !== null ? (
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
              <RotateCcw size={14} aria-hidden="true" />
              閉じる
            </button>
          ) : null}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <SelectField label="区分" value={form.kind} onChange={(v) => setForm((c) => ({ ...c, kind: v as CheckoutItemKind }))}>
            {KIND_ORDER.map((k) => (
              <option key={k} value={k}>{checkoutItemKindLabels[k]}</option>
            ))}
          </SelectField>
          <p className="-mt-2 text-xs text-stone-500">{KIND_HINTS[form.kind]}</p>
          <TextField label="名前" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: シャンプー / 回数券 / 500円クーポン" required />
          <TextField label="金額（円）" value={form.amount} onChange={(v) => setForm((c) => ({ ...c, amount: v }))} type="number" min="0" />
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
    <MasterPage title="会計アイテムマスタ" description="会計画面の4区分（物販／チケット販売／チケット利用／割引）の事前登録アイテムを管理します。会計で選ぶと金額が自動反映されます。">
      <MasterSplitPanel
        items={sortedItems}
        columns={columns}
        searchKeys={["name"]}
        selectedId={editingId}
        onSelect={handleEdit}
        onCreate={startCreate}
        renderDetail={renderDetail}
        searchPlaceholder="アイテム名で検索"
        createLabel="新規作成"
      />
    </MasterPage>
  );
}
