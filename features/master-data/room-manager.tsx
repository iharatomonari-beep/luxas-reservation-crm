"use client";

import { FormEvent, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { initialRooms, roomsStorageKey } from "@/features/master-data/mock-data";
import { MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { roomKindLabels, type RoomKind, type ServiceRoom } from "@/features/master-data/types";
import { isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type RoomForm = {
  name: string;
  kind: RoomKind;
  memo: string;
  isActive: boolean;
};

const emptyForm: RoomForm = {
  name: "",
  kind: "treatment",
  memo: "",
  isActive: true
};

const roomKinds = Object.entries(roomKindLabels) as [RoomKind, string][];

export function RoomManager() {
  const [rooms, setRooms] = useLocalCollection<ServiceRoom>(roomsStorageKey, initialRooms);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  // null=未選択 / ""=新規 / id=編集。
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startCreate() {
    setForm(emptyForm);
    setEditingId("");
    setMessage(null);
  }

  function validate() {
    if (isBlank(form.name)) {
      return "ブース名を入力してください。";
    }

    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validate();

    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }

    const payload = {
      name: normalizeText(form.name),
      kind: form.kind,
      memo: normalizeText(form.memo),
      isActive: form.isActive
    };

    if (editingId) {
      setRooms((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "ブース情報を更新しました。" });
    } else {
      setRooms((current) => [{ id: makeLocalId("room"), ...payload }, ...current]);
      setMessage({ type: "success", text: "ブースを追加しました。" });
    }

    resetForm();
  }

  function handleEdit(item: ServiceRoom) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      kind: item.kind,
      memo: item.memo ?? "",
      isActive: item.isActive
    });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setRooms((current) => current.filter((item) => item.id !== id));

    if (editingId === id) {
      resetForm();
    }

    setMessage({ type: "success", text: "ブースを削除しました。" });
  }

  const columns: MasterColumn<ServiceRoom>[] = [
    { key: "id", header: "ID", render: (i) => <span className="font-mono text-xs text-stone-400">{i.id.slice(0, 8)}</span> },
    { key: "name", header: "ブース名", render: (i) => <span className="font-medium text-luxas-ink">{i.name}</span> },
    { key: "kind", header: "種別", render: (i) => roomKindLabels[i.kind] },
    {
      key: "status",
      header: "利用状況",
      render: (i) => (
        <span
          className={[
            "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
            i.isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
          ].join(" ")}
        >
          {i.isActive ? "利用可能" : "停止中"}
        </span>
      )
    }
  ];

  function renderDetail() {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "ブースを編集" : "ブースを追加"}</h2>
          {editingId !== null ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper"
              onClick={resetForm}
            >
              <RotateCcw size={14} aria-hidden="true" />
              閉じる
            </button>
          ) : null}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField
            label="ブース名"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            placeholder="例: ブース A"
            required
          />
          <SelectField
            label="種別"
            value={form.kind}
            onChange={(value) => setForm((current) => ({ ...current, kind: value }))}
          >
            {roomKinds.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">メモ</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition placeholder:text-stone-400 focus:border-luxas-green"
              value={form.memo}
              onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
              placeholder="例: 入口近くの予約優先ブース"
            />
          </label>
          <ToggleField
            label="利用可能にする"
            checked={form.isActive}
            onChange={(value) => setForm((current) => ({ ...current, isActive: value }))}
          />
          <StatusMessage message={message} />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            >
              <Plus size={17} aria-hidden="true" />
              {editingId ? "更新する" : "追加する"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-3 text-sm font-medium text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(editingId)}
              >
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
    <MasterPage
      title="ブース管理"
      description="施術ブース、個室、カウンセリングスペースなど、予約割り当てに使う場所を管理します。"
    >
      <MasterSplitPanel
        items={rooms}
        columns={columns}
        searchKeys={["name"]}
        selectedId={editingId}
        onSelect={handleEdit}
        onCreate={startCreate}
        renderDetail={renderDetail}
        searchPlaceholder="ブース名で検索"
        createLabel="新規作成"
      />
    </MasterPage>
  );
}
