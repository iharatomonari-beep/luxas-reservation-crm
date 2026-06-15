"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { initialServices, initialStaff, servicesStorageKey, staffStorageKey } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { staffRoleLabels, type ServiceMenu, type StaffMember, type StaffRole } from "@/features/master-data/types";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type StaffForm = {
  fullName: string;
  displayName: string;
  role: StaffRole;
  sortOrder: string;
  serviceMenuIds: string[];
  isActive: boolean;
};

const emptyForm: StaffForm = {
  fullName: "",
  displayName: "",
  role: "therapist",
  sortOrder: "10",
  serviceMenuIds: [],
  isActive: true
};

const roles = Object.entries(staffRoleLabels) as [StaffRole, string][];

export function StaffManager() {
  const [staff, setStaff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  // null=未選択（右ペイン非表示）/ ""=新規 / id=編集。
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const sortedServices = useMemo(() => [...services].sort(compareBySortOrder), [services]);
  const sortedStaff = useMemo(() => [...staff].sort(compareBySortOrder), [staff]);

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
    if (isBlank(form.fullName)) {
      return "氏名を入力してください。";
    }

    if (isBlank(form.displayName)) {
      return "表示名を入力してください。";
    }

    if (!Number.isInteger(Number(form.sortOrder)) || Number(form.sortOrder) < 0) {
      return "表示順は0以上の整数で入力してください。";
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
      fullName: normalizeText(form.fullName),
      displayName: normalizeText(form.displayName),
      role: form.role,
      sortOrder: Number(form.sortOrder),
      serviceMenuIds: form.serviceMenuIds,
      isActive: form.isActive
    };

    if (editingId) {
      setStaff((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "スタッフ情報を更新しました。" });
    } else {
      setStaff((current) => [{ id: makeLocalId("staff"), ...payload }, ...current]);
      setMessage({ type: "success", text: "スタッフを追加しました。" });
    }

    resetForm();
  }

  function handleEdit(item: StaffMember) {
    setEditingId(item.id);
    setForm({
      fullName: item.fullName,
      displayName: item.displayName,
      role: item.role,
      sortOrder: String(item.sortOrder ?? 10),
      serviceMenuIds: item.serviceMenuIds ?? [],
      isActive: item.isActive
    });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setStaff((current) => current.filter((item) => item.id !== id));

    if (editingId === id) {
      resetForm();
    }

    setMessage({ type: "success", text: "スタッフを削除しました。" });
  }

  const columns: MasterColumn<StaffMember>[] = [
    { key: "id", header: "ID", render: (s) => <span className="font-mono text-xs text-stone-400">{s.id.slice(0, 8)}</span> },
    { key: "fullName", header: "氏名", render: (s) => <span className="font-medium text-luxas-ink">{s.fullName}</span> },
    { key: "displayName", header: "ニックネーム", render: (s) => s.displayName },
    { key: "role", header: "役割", render: (s) => staffRoleLabels[s.role] },
    { key: "sortOrder", header: "表示順", render: (s) => s.sortOrder ?? 0 },
    { key: "status", header: "状態", render: (s) => <ActiveBadge isActive={s.isActive} /> }
  ];

  function renderDetail() {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "スタッフを編集" : "スタッフを追加"}</h2>
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
            label="氏名"
            value={form.fullName}
            onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
            placeholder="例: 青山 真央"
            required
          />
          <TextField
            label="表示名（ニックネーム）"
            value={form.displayName}
            onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
            placeholder="例: 青山"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="役割"
              value={form.role}
              onChange={(value) => setForm((current) => ({ ...current, role: value }))}
            >
              {roles.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <TextField
              label="表示順"
              value={form.sortOrder}
              onChange={(value) => setForm((current) => ({ ...current, sortOrder: value }))}
              type="number"
              min="0"
              required
              hint="小さい番号を上に表示します"
            />
          </div>
          <section className="rounded-md border border-luxas-line bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-stone-700">対応可能メニュー</p>
                <p className="mt-1 text-xs text-stone-500">
                  未選択の場合は全メニュー対応として扱います。予約作成時の絞り込みに使います。
                </p>
              </div>
              {form.serviceMenuIds.length > 0 ? (
                <button
                  type="button"
                  className="rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper"
                  onClick={() => setForm((current) => ({ ...current, serviceMenuIds: [] }))}
                >
                  解除
                </button>
              ) : null}
            </div>
            {sortedServices.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {sortedServices.map((service) => {
                  const checked = form.serviceMenuIds.includes(service.id);

                  return (
                    <label
                      key={service.id}
                      className={[
                        "flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-sm",
                        checked ? "border-luxas-green bg-luxas-mist" : "border-luxas-line bg-white"
                      ].join(" ")}
                    >
                      <span className="min-w-0">
                        <span className="block font-medium text-luxas-ink">{service.name}</span>
                        <span className="mt-0.5 block text-xs text-stone-500">
                          {service.category} / {service.durationMinutes}分
                        </span>
                      </span>
                      <input
                        className="h-4 w-4 accent-luxas-green"
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            serviceMenuIds: event.target.checked
                              ? [...current.serviceMenuIds, service.id]
                              : current.serviceMenuIds.filter((id) => id !== service.id)
                          }))
                        }
                      />
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-500">先にメニューを作成すると対応可能メニューを設定できます。</p>
            )}
          </section>
          <ToggleField
            label="有効にする"
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
      title="スタッフ管理"
      description="予約担当者、受付、店長など、single store内で使うスタッフマスタを管理します。"
    >
      <MasterSplitPanel
        items={sortedStaff}
        columns={columns}
        searchKeys={["fullName", "displayName"]}
        selectedId={editingId}
        onSelect={handleEdit}
        onCreate={startCreate}
        renderDetail={renderDetail}
        searchPlaceholder="氏名・表示名で検索"
        createLabel="新規作成"
        emptyDetail="左の一覧から選択するか「新規作成」を押してください。"
      />
    </MasterPage>
  );
}
