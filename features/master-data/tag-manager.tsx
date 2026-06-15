"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { TextField, ToggleField } from "@/features/master-data/form-controls";
import { initialTags, tagsStorageKey } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { tagKindLabels, type MasterTag, type TagKind } from "@/features/master-data/types";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type TagForm = { name: string; code: string; sortOrder: string; isActive: boolean };
const emptyForm: TagForm = { name: "", code: "", sortOrder: "10", isActive: true };

// 種別固定の1画面（PM準拠・T054）。顧客タグは管理コードなし、予約ルート/施術カルテは管理コードあり。
export function TagManager({ kind }: { kind: TagKind }) {
  const [tags, setTags] = useLocalCollection<MasterTag>(tagsStorageKey, initialTags);
  const [form, setForm] = useState<TagForm>(emptyForm);
  // null=未選択 / ""=新規 / id=編集。
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  const hasCode = kind !== "customer";
  const label = tagKindLabels[kind];
  const shown = useMemo(() => tags.filter((t) => t.kind === kind).sort(compareBySortOrder), [tags, kind]);

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
      setMessage({ type: "error", text: "タグ名を入力してください。" });
      return;
    }
    const payload = {
      name: normalizeText(form.name),
      code: hasCode ? normalizeText(form.code) : "",
      sortOrder: Number(form.sortOrder) || 0,
      kind,
      isActive: form.isActive
    };
    if (editingId) {
      setTags((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "タグを更新しました。" });
    } else {
      setTags((current) => [{ id: makeLocalId("tag"), ...payload }, ...current]);
      setMessage({ type: "success", text: "タグを追加しました。" });
    }
    resetForm();
  }

  function handleEdit(item: MasterTag) {
    setEditingId(item.id);
    setForm({ name: item.name, code: item.code, sortOrder: String(item.sortOrder), isActive: item.isActive });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setTags((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: "タグを削除しました。" });
  }

  const columns: MasterColumn<MasterTag>[] = [
    { key: "id", header: "ID", render: (i) => <span className="font-mono text-xs text-stone-400">{i.id.slice(0, 8)}</span> },
    { key: "name", header: "名前", render: (i) => <span className="font-medium text-luxas-ink">{i.name}</span> },
    ...(hasCode ? [{ key: "code", header: "管理コード", render: (i: MasterTag) => i.code || "—" }] : []),
    { key: "sortOrder", header: "表示順", render: (i) => i.sortOrder },
    { key: "status", header: "状態", render: (i) => <ActiveBadge isActive={i.isActive} /> }
  ];

  function renderDetail() {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "タグを編集" : "タグを追加"}</h2>
          {editingId !== null ? (
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
              <RotateCcw size={14} aria-hidden="true" />
              閉じる
            </button>
          ) : null}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField label="タグ名" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: VIP / Instagram" required />
          {hasCode ? (
            <TextField label="管理コード（任意）" value={form.code} onChange={(v) => setForm((c) => ({ ...c, code: v }))} placeholder="例: IG" />
          ) : null}
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
    <MasterPage title={`${label}管理`} description={`${label}を管理します。予約受付や顧客検索で参照します（PM準拠・種別ごとに独立画面）。`}>
      <MasterSplitPanel
        items={shown}
        columns={columns}
        searchKeys={["name", "code"]}
        selectedId={editingId}
        onSelect={handleEdit}
        onCreate={startCreate}
        renderDetail={renderDetail}
        searchPlaceholder="名前で検索"
        createLabel="新規作成"
      />
    </MasterPage>
  );
}
