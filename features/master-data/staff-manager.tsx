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
import { isStaffHomeStore } from "@/features/master-data/store-staff-scope";
import { useCurrentStore } from "@/features/org/use-current-store";
import { formatTimestamp, stampCreate, stampUpdate } from "@/features/master-data/timestamps";

type StaffForm = {
  fullName: string;
  displayName: string;
  role: StaffRole;
  sortOrder: string;
  serviceMenuIds: string[];
  isActive: boolean;
  homeStoreId: string;
  startDate: string;
  endDate: string;
  // --- PM スタッフ詳細準拠 ---
  employeeNumber: string;
  lastName: string;
  firstName: string;
  kanaLast: string;
  kanaFirst: string;
  nickname: string;
  gender: "" | "male" | "female";
  phone: string;
  email: string;
  personalNomination: boolean;
  genderNomination: boolean;
  personalNominationFee: string;
  freeMessage: string;
};

const emptyForm: StaffForm = {
  fullName: "",
  displayName: "",
  role: "therapist",
  sortOrder: "10",
  serviceMenuIds: [],
  isActive: true,
  homeStoreId: "",
  startDate: "",
  endDate: "",
  employeeNumber: "",
  lastName: "",
  firstName: "",
  kanaLast: "",
  kanaFirst: "",
  nickname: "",
  gender: "",
  phone: "",
  email: "",
  personalNomination: true,
  genderNomination: true,
  personalNominationFee: "",
  freeMessage: ""
};

const roles = Object.entries(staffRoleLabels) as [StaffRole, string][];

export function StaffManager() {
  const [staff, setStaff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const { stores, currentStoreId, store: currentStore } = useCurrentStore();
  const storeOptions = useMemo(() => [...stores].filter((s) => s.isActive).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [stores]);
  const storeName = (id?: string) => (id ? stores.find((s) => s.id === id)?.name ?? id : "—");
  const [form, setForm] = useState<StaffForm>(emptyForm);
  // null=未選択（右ペイン非表示）/ ""=新規 / id=編集。
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const sortedServices = useMemo(() => [...services].sort(compareBySortOrder), [services]);
  // 現在店舗に所属するスタッフだけ表示する（所属未設定は既定店舗=渋谷扱い）。
  const sortedStaff = useMemo(
    () => staff.filter((s) => isStaffHomeStore(s, currentStoreId)).sort(compareBySortOrder),
    [staff, currentStoreId]
  );

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startCreate() {
    setForm({ ...emptyForm, homeStoreId: currentStoreId });
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
      isActive: form.isActive,
      homeStoreId: form.homeStoreId || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      employeeNumber: normalizeText(form.employeeNumber) || undefined,
      lastName: normalizeText(form.lastName) || undefined,
      firstName: normalizeText(form.firstName) || undefined,
      kanaLast: normalizeText(form.kanaLast) || undefined,
      kanaFirst: normalizeText(form.kanaFirst) || undefined,
      nickname: normalizeText(form.nickname) || undefined,
      gender: form.gender || undefined,
      phone: normalizeText(form.phone) || undefined,
      email: normalizeText(form.email) || undefined,
      personalNomination: form.personalNomination,
      genderNomination: form.genderNomination,
      personalNominationFee:
        form.personalNominationFee.trim() === "" ? undefined : Number(form.personalNominationFee),
      freeMessage: normalizeText(form.freeMessage) || undefined
    };

    if (editingId) {
      setStaff((current) => current.map((item) => (item.id === editingId ? { ...item, ...stampUpdate(payload, item) } : item)));
      setMessage({ type: "success", text: "スタッフ情報を更新しました。" });
    } else {
      setStaff((current) => [{ id: makeLocalId("staff"), ...stampCreate(payload) }, ...current]);
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
      isActive: item.isActive,
      homeStoreId: item.homeStoreId ?? "",
      startDate: item.startDate ?? "",
      endDate: item.endDate ?? "",
      employeeNumber: item.employeeNumber ?? "",
      lastName: item.lastName ?? "",
      firstName: item.firstName ?? "",
      kanaLast: item.kanaLast ?? "",
      kanaFirst: item.kanaFirst ?? "",
      nickname: item.nickname ?? "",
      gender: item.gender ?? "",
      phone: item.phone ?? "",
      email: item.email ?? "",
      personalNomination: item.personalNomination ?? true,
      genderNomination: item.genderNomination ?? true,
      personalNominationFee:
        item.personalNominationFee === undefined ? "" : String(item.personalNominationFee),
      freeMessage: item.freeMessage ?? ""
    });
    setMessage(null);
  }

  // 物理削除はしない（過去予約・会計の担当名解決のためデータは残す）。無効化＝新規候補・台帳縦軸から外す。
  function handleDeactivate(id: string) {
    setStaff((current) =>
      current.map((item) => (item.id === id ? { ...item, ...stampUpdate({ ...item, isActive: false }, item) } : item))
    );
    setForm((current) => ({ ...current, isActive: false }));
    setMessage({ type: "success", text: "スタッフを「表示しない（無効）」にしました。過去予約の担当名は引き続き表示されます。" });
  }

  const columns: MasterColumn<StaffMember>[] = [
    { key: "id", header: "ID", render: (s) => <span className="font-mono text-xs text-stone-400">{s.id.slice(0, 8)}</span> },
    { key: "fullName", header: "氏名", render: (s) => <span className="font-medium text-luxas-ink">{s.fullName}</span> },
    { key: "displayName", header: "ニックネーム", render: (s) => s.nickname ?? s.displayName },
    { key: "role", header: "役割", render: (s) => staffRoleLabels[s.role] },
    { key: "homeStore", header: "所属店舗", render: (s) => storeName(s.homeStoreId) },
    { key: "sortOrder", header: "表示順", render: (s) => s.sortOrder ?? 0 },
    { key: "status", header: "状態", render: (s) => <ActiveBadge isActive={s.isActive} /> }
  ];

  function renderDetail() {
    const editingStaff = editingId ? staff.find((s) => s.id === editingId) ?? null : null;
    return (
      <div>
        {editingStaff ? (
          <p className="mb-3 text-[11px] text-stone-400">
            作成日: {formatTimestamp(editingStaff.createdAt)} ／ 最終更新日: {formatTimestamp(editingStaff.updatedAt)}
          </p>
        ) : null}
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
            label="表示名（台帳表示）"
            value={form.displayName}
            onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
            placeholder="例: 青山"
            required
          />

          {/* --- PM スタッフ詳細準拠の項目 --- */}
          <TextField
            label="社員番号"
            value={form.employeeNumber}
            onChange={(value) => setForm((current) => ({ ...current, employeeNumber: value }))}
            placeholder="任意"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="姓"
              value={form.lastName}
              onChange={(value) => setForm((current) => ({ ...current, lastName: value }))}
              placeholder="例: 青山"
            />
            <TextField
              label="名"
              value={form.firstName}
              onChange={(value) => setForm((current) => ({ ...current, firstName: value }))}
              placeholder="例: 真央"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="フリガナ（セイ）"
              value={form.kanaLast}
              onChange={(value) => setForm((current) => ({ ...current, kanaLast: value }))}
              placeholder="例: アオヤマ"
            />
            <TextField
              label="フリガナ（メイ）"
              value={form.kanaFirst}
              onChange={(value) => setForm((current) => ({ ...current, kanaFirst: value }))}
              placeholder="例: マオ"
            />
          </div>
          <TextField
            label="ニックネーム（PM表記）"
            value={form.nickname}
            onChange={(value) => setForm((current) => ({ ...current, nickname: value }))}
            placeholder="例: 青山(定休日→日月)"
            hint="PMの「◯◯(定休日→…)」表記をそのまま保持します"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="性別"
              value={form.gender}
              onChange={(value) => setForm((current) => ({ ...current, gender: value as StaffForm["gender"] }))}
            >
              <option value="">未設定</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </SelectField>
            <TextField
              label="電話番号"
              value={form.phone}
              onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
              placeholder="任意"
            />
          </div>
          <TextField
            label="Email"
            value={form.email}
            onChange={(value) => setForm((current) => ({ ...current, email: value }))}
            placeholder="任意"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ToggleField
              label="個人指名 可"
              checked={form.personalNomination}
              onChange={(value) => setForm((current) => ({ ...current, personalNomination: value }))}
            />
            <ToggleField
              label="男女指名 可"
              checked={form.genderNomination}
              onChange={(value) => setForm((current) => ({ ...current, genderNomination: value }))}
            />
          </div>
          <TextField
            label="個人指名料（円）"
            type="number"
            min="0"
            value={form.personalNominationFee}
            onChange={(value) => setForm((current) => ({ ...current, personalNominationFee: value }))}
            placeholder="任意"
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
          <div>
            <SelectField
              label="所属店舗"
              value={form.homeStoreId}
              onChange={(value) => setForm((current) => ({ ...current, homeStoreId: value }))}
            >
              <option value="">未設定（既定店舗）</option>
              {storeOptions.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </SelectField>
            <p className="mt-1.5 text-xs text-stone-500">
              未設定は既定店舗（渋谷）扱い。台帳の縦軸はシフト基準で表示され、所属だけでは表示されません。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="開始日"
              type="date"
              value={form.startDate}
              onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
              hint="在籍の開始日（任意）"
            />
            <TextField
              label="終了日"
              type="date"
              value={form.endDate}
              onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
              hint="在籍の終了日（任意）。終了後は無効化して新規候補・台帳から外す運用です。"
            />
          </div>
          <section className="rounded-md border border-luxas-line bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-stone-700">対応コース</p>
                <p className="mt-1 text-xs text-stone-500">
                  コースマスタ（メニュー）から自動表示されます。未選択の場合は全コース対応として扱います。予約作成時の絞り込みに使います。
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
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
              <p className="mt-3 text-sm text-stone-500">先にメニュー（コース）を作成すると対応コースを設定できます。</p>
            )}
          </section>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">フリーメッセージ</label>
            <textarea
              className="w-full rounded-md border border-luxas-line bg-white px-3 py-2 text-sm text-luxas-ink focus:border-luxas-green focus:outline-none focus:ring-1 focus:ring-luxas-green"
              rows={3}
              value={form.freeMessage}
              onChange={(event) => setForm((current) => ({ ...current, freeMessage: event.target.value }))}
              placeholder="揉み加減・注意事項などのメモ（任意）"
            />
          </div>
          <ToggleField
            label="表示する（有効）"
            checked={form.isActive}
            onChange={(value) => setForm((current) => ({ ...current, isActive: value }))}
          />
          <p className="text-xs text-stone-500">
            ※ スタッフは物理削除しません。「表示しない（無効）」にすると新規候補・台帳の縦軸から外れますが、過去予約・会計の担当名は引き続き表示されます。
          </p>
          <StatusMessage message={message} />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            >
              <Plus size={17} aria-hidden="true" />
              {editingId ? "更新する" : "追加する"}
            </button>
            {editingId && form.isActive ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-3 py-3 text-sm font-medium text-amber-800 hover:bg-amber-50"
                onClick={() => handleDeactivate(editingId)}
              >
                <Trash2 size={15} aria-hidden="true" />
                表示しない（無効化）
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
      description={`「${currentStore?.name ?? "現在店舗"}」に所属するスタッフを表示しています。上部バーの店舗切替で店舗を変えると、その店舗のスタッフに切り替わります。`}
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
        gridClassName="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]"
        listMaxHeightClassName="max-h-[72vh]"
      />
    </MasterPage>
  );
}
