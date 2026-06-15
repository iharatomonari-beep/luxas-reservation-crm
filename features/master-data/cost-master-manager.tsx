"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { TextField, ToggleField } from "@/features/master-data/form-controls";
import { expenseAccountsStorageKey, initialExpenseAccounts, type ExpenseAccount } from "@/features/master-data/cost-master";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type AccForm = { name: string; subName: string; sortOrder: string; isActive: boolean };
const emptyForm: AccForm = { name: "", subName: "", sortOrder: "10", isActive: true };

export function CostMasterManager() {
  const [accounts, setAccounts] = useLocalCollection<ExpenseAccount>(expenseAccountsStorageKey, initialExpenseAccounts);
  const [form, setForm] = useState<AccForm>(emptyForm);
  // null=未選択 / ""=新規 / id=編集。
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const sortedAccounts = useMemo(() => [...accounts].sort(compareBySortOrder), [accounts]);

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
      setMessage({ type: "error", text: "勘定科目名を入力してください。" });
      return;
    }
    const payload = {
      name: normalizeText(form.name),
      subName: normalizeText(form.subName),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive
    };
    if (editingId) {
      setAccounts((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "勘定科目を更新しました。" });
    } else {
      setAccounts((current) => [{ id: makeLocalId("acc"), ...payload }, ...current]);
      setMessage({ type: "success", text: "勘定科目を追加しました。" });
    }
    resetForm();
  }

  function handleEdit(item: ExpenseAccount) {
    setEditingId(item.id);
    setForm({ name: item.name, subName: item.subName, sortOrder: String(item.sortOrder), isActive: item.isActive });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setAccounts((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: "勘定科目を削除しました。" });
  }

  const columns: MasterColumn<ExpenseAccount>[] = [
    { key: "id", header: "ID", render: (i) => <span className="font-mono text-xs text-stone-400">{i.id.slice(0, 8)}</span> },
    { key: "name", header: "勘定科目", render: (i) => <span className="font-medium text-luxas-ink">{i.name}</span> },
    { key: "subName", header: "補助科目", render: (i) => i.subName || "—" },
    { key: "sortOrder", header: "表示順", render: (i) => i.sortOrder },
    { key: "status", header: "状態", render: (i) => <ActiveBadge isActive={i.isActive} /> }
  ];

  function renderDetail() {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "科目を編集" : "科目を追加"}</h2>
          {editingId !== null ? (
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
              <RotateCcw size={14} aria-hidden="true" />
              閉じる
            </button>
          ) : null}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField label="勘定科目" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: 消耗品費" required />
          <TextField label="補助科目（任意）" value={form.subName} onChange={(v) => setForm((c) => ({ ...c, subName: v }))} placeholder="例: 備品" />
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
    <MasterPage title="経費マスタ（勘定科目）" description="経費登録で使う勘定科目・補助科目を管理します。">
      <MasterSplitPanel
        items={sortedAccounts}
        columns={columns}
        searchKeys={["name", "subName"]}
        selectedId={editingId}
        onSelect={handleEdit}
        onCreate={startCreate}
        renderDetail={renderDetail}
        searchPlaceholder="勘定科目で検索"
        createLabel="新規作成"
      />
    </MasterPage>
  );
}
