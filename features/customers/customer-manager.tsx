"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BadgeInfo,
  CalendarDays,
  ChevronRight,
  History,
  Mail,
  NotebookText,
  PencilLine,
  Phone,
  Plus,
  Save,
  Search,
  Tag,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { logAudit } from "@/features/master-data/remote-collection";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import type { Reservation } from "@/features/reservations/types";
import { reservationStatusLabels } from "@/features/reservations/types";
import { initialRooms, initialServices, initialStaff, roomsStorageKey, servicesStorageKey, staffStorageKey } from "@/features/master-data/mock-data";
import type { ServiceMenu, ServiceRoom, StaffMember } from "@/features/master-data/types";
import { formatCurrency, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { customersStorageKey, initialCustomers } from "@/features/customers/mock-data";
import type { Customer, CustomerGender } from "@/features/customers/types";
import { findDuplicateCustomers, type DuplicateMatch } from "@/features/customers/duplicate-detection";
import { DuplicateCustomerPrompt } from "@/features/customers/duplicate-prompt";
import { customerGenderLabels } from "@/features/customers/types";
import { formatTimestamp, stampCreate, stampUpdate } from "@/features/master-data/timestamps";
import { useCurrentStore } from "@/features/org/use-current-store";
import type { Store } from "@/features/org/types";

type CustomerForm = {
  name: string;
  nameKana: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: CustomerGender;
  address: string;
  firstVisitDate: string;
  lastVisitDate: string;
  caution: string;
  chartMemo: string;
  tagsText: string;
  isActive: boolean;
  // --- T067 拡張項目 ---
  membershipNumber: string;
  phone2: string;
  phone3: string;
  email2: string;
  postalCode: string;
  prefecture: string;
  addressLine1: string;
  addressLine2: string;
  acceptsEmail: boolean;
  acceptsDm: boolean;
  acceptsPush: boolean;
  occupation: string;
  rank: string;
  comment: string;
  note1: string;
  note2: string;
  homeStoreId: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
};

type FormMode = "create" | "edit";

type CustomerFilters = {
  name: string;
  nameKana: string;
  phone: string;
  email: string;
  tag: string;
};

const genderOptions = Object.entries(customerGenderLabels) as [CustomerGender, string][];

export function CustomerManager() {
  const [customers, setCustomers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const [reservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [rooms] = useLocalCollection<ServiceRoom>(roomsStorageKey, initialRooms);
  // 母店（所属店舗）の選択肢（T067）。補正後の有効店舗一覧を参照。
  const { stores } = useCurrentStore();
  const storeOptions = [...stores].filter((s) => s.isActive).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const storeName = (id?: string) => (id ? stores.find((s) => s.id === id)?.name ?? id : "—");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialCustomers[0]?.id ?? null);
  const [filters, setFilters] = useState<CustomerFilters>({
    name: "",
    nameKana: "",
    phone: "",
    email: "",
    tag: ""
  });
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>(createBlankForm());
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const [formMessage, setFormMessage] = useState<StatusMessageValue | null>(null);
  const [detailDraft, setDetailDraft] = useState({
    caution: "",
    chartMemo: ""
  });
  // ⑤ 重複検出ポップ（新規作成時に同一人物候補が出たら確認）。
  const [dupPrompt, setDupPrompt] = useState<{
    candidates: DuplicateMatch[];
    payload: ReturnType<typeof toCustomerPayload>;
  } | null>(null);

  const filteredCustomers = useMemo(() => {
    return [...customers]
      // ② 統合済み（重複として主に統合された）顧客は一覧に出さない。復元は顧客マージ画面から。
      .filter((customer) => !customer.mergedInto)
      .filter((customer) => matchesFilters(customer, filters))
      .sort((left, right) => {
        const visitOrder = (right.lastVisitDate || "").localeCompare(left.lastVisitDate || "");

        if (visitOrder !== 0) {
          return visitOrder;
        }

        return left.name.localeCompare(right.name, "ja");
      });
  }, [customers, filters]);

  const selectedCustomer =
    selectedCustomerId != null
      ? customers.find((customer) => customer.id === selectedCustomerId) ?? null
      : null;
  const relatedReservations = useMemo(() => {
    if (!selectedCustomer) {
      return [];
    }

    const targetName = normalizeText(selectedCustomer.name);
    const targetPhone = normalizePhone(selectedCustomer.phone);

    return [...reservations]
      .filter((reservation) => {
        const reservationName = normalizeText(reservation.customerName);
        const reservationPhone = normalizePhone(reservation.phone ?? "");

        return (targetPhone.length > 0 && reservationPhone === targetPhone) || reservationName === targetName;
      })
      .sort((left, right) => {
        const leftKey = `${left.date}-${left.startTime}`;
        const rightKey = `${right.date}-${right.startTime}`;
        return rightKey.localeCompare(leftKey, "ja");
      });
  }, [reservations, selectedCustomer]);
  const historyCount = relatedReservations.length;
  // 予約履歴（実データ）から来店サマリーを自動集計（T034）。
  // 既存の会員情報（総来店/総売上 等）は import 由来の文字列でアプリ作成顧客では空のため、実値で補完する。
  const visitSummary = useMemo(() => {
    const completed = relatedReservations.filter((r) => r.status === "completed");
    const paid = relatedReservations.filter((r) => r.paymentStatus === "paid");
    const canceled = relatedReservations.filter((r) => r.status === "canceled");
    const salesTotal = paid.reduce((sum, r) => sum + (r.saleAmount ?? 0), 0);
    const visitDates = relatedReservations
      .filter((r) => r.status !== "canceled")
      .map((r) => r.date)
      .filter(Boolean)
      .sort();
    const firstVisit = visitDates[0] ?? "";
    const lastVisit = visitDates[visitDates.length - 1] ?? "";
    // 客単価 = 会計済売上 / 会計済件数（経営指標トップと同じく会計確定分のみ）。
    const avgSpend = paid.length > 0 ? Math.round(salesTotal / paid.length) : 0;
    // 最終来店からの経過日数（来店履歴がある場合のみ）。
    const daysSinceLastVisit = lastVisit ? daysBetween(lastVisit, todayStr()) : null;
    // 平均来店間隔 = （最終来店 − 初回来店）/（来店回数 − 1）。2回以上の来店がある場合のみ。
    const avgIntervalDays =
      visitDates.length >= 2 ? Math.round(daysBetween(firstVisit, lastVisit) / (visitDates.length - 1)) : null;
    // 区分: 完了来店2回以上=リピート／1回=新規／0回=未来店。
    const visitorType = completed.length >= 2 ? "リピート" : completed.length === 1 ? "新規" : "未来店";
    return {
      reservationTotal: relatedReservations.length,
      visitCount: completed.length,
      paidCount: paid.length,
      salesTotal,
      avgSpend,
      firstVisit,
      lastVisit,
      daysSinceLastVisit,
      avgIntervalDays,
      visitorType,
      canceledCount: canceled.length
    };
  }, [relatedReservations]);
  const activeCount = useMemo(() => customers.filter((customer) => customer.isActive).length, [customers]);
  const historyLinkedCount = useMemo(
    () =>
      customers.filter((customer) => {
        const targetName = normalizeText(customer.name);
        const targetPhone = normalizePhone(customer.phone);

        return reservations.some((reservation) => {
          const reservationName = normalizeText(reservation.customerName);
          const reservationPhone = normalizePhone(reservation.phone ?? "");

          return (targetPhone.length > 0 && reservationPhone === targetPhone) || reservationName === targetName;
        });
      }).length,
    [customers, reservations]
  );
  const taggedCount = useMemo(() => customers.filter((customer) => customer.tags.length > 0).length, [customers]);
  const serviceNameMap = useMemo(() => new Map(services.map((service) => [service.id, service.name])), [services]);
  const staffNameMap = useMemo(
    () => new Map(staff.map((item) => [item.id, item.displayName])),
    [staff]
  );
  const roomNameMap = useMemo(() => new Map(rooms.map((room) => [room.id, room.name])), [rooms]);
  const selectedCustomerTags = selectedCustomer?.tags ?? [];

  useEffect(() => {
    if (filteredCustomers.length === 0) {
      setSelectedCustomerId(null);
      return;
    }

    if (!selectedCustomerId || !filteredCustomers.some((customer) => customer.id === selectedCustomerId)) {
      setSelectedCustomerId(filteredCustomers[0].id);
    }
  }, [filteredCustomers, selectedCustomerId]);

  useEffect(() => {
    if (!selectedCustomer) {
      setDetailDraft({ caution: "", chartMemo: "" });
      return;
    }

    setDetailDraft({
      caution: selectedCustomer.caution,
      chartMemo: selectedCustomer.chartMemo
    });
  }, [selectedCustomer]);

  function openCreateForm() {
    setForm(createBlankForm());
    setEditingCustomerId(null);
    setFormMode("create");
    setFormMessage(null);
    setMessage(null);
  }

  function openEditForm(customer: Customer) {
    setForm(toForm(customer));
    setEditingCustomerId(customer.id);
    setFormMode("edit");
    setFormMessage(null);
    setMessage(null);
  }

  function closeForm() {
    setFormMode(null);
    setEditingCustomerId(null);
    setFormMessage(null);
  }

  function saveForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateCustomerForm(form);
    if (validationError) {
      setFormMessage({ type: "error", text: validationError });
      return;
    }

    const payload = toCustomerPayload(form);

    if (editingCustomerId) {
      const before = customers.find((customer) => customer.id === editingCustomerId);
      // 変更した「列名」のみ算出（値は記録しない＝PIIを残さない）。
      const changedFields = before
        ? Object.keys(payload).filter(
            (key) =>
              JSON.stringify((before as unknown as Record<string, unknown>)[key]) !==
              JSON.stringify((payload as unknown as Record<string, unknown>)[key])
          )
        : Object.keys(payload);
      setCustomers((current) =>
        current.map((customer) => (customer.id === editingCustomerId ? { ...customer, ...stampUpdate(payload, customer) } : customer))
      );
      setSelectedCustomerId(editingCustomerId);
      setMessage({ type: "success", text: "顧客情報を更新しました。" });
      void logAudit("update", "customer", editingCustomerId, { changedFields });
    } else {
      // ⑤ 新規作成前に重複検出。同一人物候補があれば必ずポップで確認する。
      const candidates = findDuplicateCustomers(customers, {
        name: payload.name,
        nameKana: payload.nameKana,
        phone: payload.phone,
        email: payload.email
      });
      if (candidates.length > 0) {
        setDupPrompt({ candidates, payload });
        return; // ポップの選択を待つ（ここでは作成しない）。
      }
      performCreate(payload);
    }

    closeForm();
  }

  // 実際の新規作成（重複ポップで「別人として新規」を選んだ場合もここを通す）。
  function performCreate(payload: ReturnType<typeof toCustomerPayload>) {
    const id = makeLocalId("customer");
    setCustomers((current) => [{ id, ...stampCreate(payload) }, ...current]);
    setSelectedCustomerId(id);
    setMessage({ type: "success", text: "顧客を新規作成しました。" });
    void logAudit("create", "customer", id);
  }

  // ⑤ ポップで「この顧客を開く（既存を使う）」。新規は作らず既存顧客を表示する。
  function handleUseExisting(customer: Customer) {
    setDupPrompt(null);
    closeForm();
    setSelectedCustomerId(customer.id);
    void logAudit("view", "customer", customer.id);
    setMessage({ type: "success", text: `既存の顧客「${customer.name}」を開きました（新規は作成していません）。` });
  }

  // ⑤ ポップで「別人として新規登録」。
  function handleCreateNewAnyway() {
    if (!dupPrompt) return;
    performCreate(dupPrompt.payload);
    setDupPrompt(null);
    closeForm();
  }

  // 顧客詳細を開く＝監査ログに「閲覧」を記録（target_id のみ。氏名等の本文は渡さない）。
  function openDetail(customerId: string) {
    setSelectedCustomerId(customerId);
    void logAudit("view", "customer", customerId);
  }

  function saveMemo() {
    if (!selectedCustomer) {
      return;
    }

    const caution = normalizeText(detailDraft.caution);
    const chartMemo = normalizeText(detailDraft.chartMemo);

    setCustomers((current) =>
      current.map((customer) =>
        customer.id === selectedCustomer.id
          ? {
              ...customer,
              caution,
              chartMemo
            }
          : customer
      )
    );
    setMessage({ type: "success", text: "カルテメモを保存しました。" });
    // ★変更した「列名」のみ記録（カルテ本文・注意事項の中身は渡さない）。
    void logAudit("update", "customer", selectedCustomer.id, { changedFields: ["caution", "chartMemo"] });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-luxas-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-luxas-green">顧客管理</p>
          <h1 className="mt-2 text-2xl font-semibold text-luxas-ink">顧客管理</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            顧客一覧、検索、詳細、カルテメモ、注意事項、予約履歴を1画面で扱えるようにしたLUXAS向けの管理画面です。
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]"
          onClick={openCreateForm}
        >
          <Plus size={17} aria-hidden="true" />
          新規顧客
        </button>
      </section>

      <StatusMessage message={message} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="登録顧客" value={`${customers.length}件`} detail="localStorage に保存" />
        <SummaryCard label="有効顧客" value={`${activeCount}件`} detail="運用中の顧客" />
        <SummaryCard label="予約履歴あり" value={`${historyLinkedCount}件`} detail="予約台帳と連携" />
        <SummaryCard label="タグ付き" value={`${taggedCount}件`} detail="検索と絞り込みに利用" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="space-y-6">
          <section className="rounded-lg border border-luxas-line bg-white p-5">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-luxas-green" aria-hidden="true" />
              <h2 className="text-base font-semibold text-luxas-ink">顧客検索</h2>
              <span className="text-xs text-stone-500">条件に一致する顧客を即時表示</span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <SearchField label="氏名" value={filters.name} onChange={(value) => setFilters((current) => ({ ...current, name: value }))} />
              <SearchField
                label="フリガナ"
                value={filters.nameKana}
                onChange={(value) => setFilters((current) => ({ ...current, nameKana: value }))}
              />
              <SearchField
                label="電話番号"
                value={filters.phone}
                onChange={(value) => setFilters((current) => ({ ...current, phone: value }))}
              />
              <SearchField label="メール" value={filters.email} onChange={(value) => setFilters((current) => ({ ...current, email: value }))} />
              <SearchField label="タグ" value={filters.tag} onChange={(value) => setFilters((current) => ({ ...current, tag: value }))} />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-600">
                <span className="font-semibold text-luxas-ink">{filteredCustomers.length}</span>件の顧客を表示
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-luxas-paper"
                onClick={() =>
                  setFilters({
                    name: "",
                    nameKana: "",
                    phone: "",
                    email: "",
                    tag: ""
                  })
                }
              >
                検索条件をクリア
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-luxas-line bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-luxas-line px-5 py-3">
              <div className="flex items-center gap-2">
                <UsersRound size={18} className="text-luxas-green" aria-hidden="true" />
                <h2 className="text-base font-semibold text-luxas-ink">顧客一覧</h2>
              </div>
              <p className="text-xs text-stone-500">{filteredCustomers.length}件</p>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="px-5 py-10 text-sm text-stone-600">
                条件に一致する顧客がいません。検索条件を見直すか、新規顧客を作成してください。
              </div>
            ) : (
              <div className="divide-y divide-luxas-line">
                {filteredCustomers.map((customer) => {
                  const isSelected = customer.id === selectedCustomerId;

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      className={[
                        "flex w-full items-start gap-4 px-5 py-4 text-left transition",
                        isSelected ? "bg-luxas-mist/60" : "hover:bg-luxas-paper"
                      ].join(" ")}
                      onClick={() => openDetail(customer.id)}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-luxas-green ring-1 ring-inset ring-luxas-line">
                        <UserRound size={18} aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-luxas-ink">{customer.name}</h3>
                          <CustomerStatusBadge isActive={customer.isActive} />
                        </div>
                        <p className="mt-1 text-sm text-stone-500">{customer.nameKana}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-400">
                          <span>会員番号: {customer.membershipNumber?.trim() ? customer.membershipNumber : "-"}</span>
                          <span className="font-mono">ID: {customer.id.slice(0, 8)}</span>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-stone-600">
                          <span className="inline-flex items-center gap-1">
                            <Phone size={14} aria-hidden="true" />
                            {customer.phone || "未入力"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail size={14} aria-hidden="true" />
                            {customer.email || "未入力"}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {customer.tags.length > 0 ? (
                            customer.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-luxas-green ring-1 ring-inset ring-luxas-line"
                              >
                                <Tag size={12} aria-hidden="true" />
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-stone-400">タグなし</span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-luxas-green">
                          <span>詳細を開く</span>
                          <ChevronRight size={14} aria-hidden="true" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-lg border border-luxas-line bg-white p-5">
          {selectedCustomer ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-luxas-green">顧客詳細</p>
                  <h2 className="mt-1 text-lg font-semibold text-luxas-ink">{selectedCustomer.name}</h2>
                  <p className="mt-1 text-sm text-stone-500">{selectedCustomer.nameKana}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CustomerStatusBadge isActive={selectedCustomer.isActive} />
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-luxas-ink transition hover:bg-luxas-paper"
                    onClick={() => openEditForm(selectedCustomer)}
                  >
                    <PencilLine size={16} aria-hidden="true" />
                    編集
                  </button>
                </div>
              </div>

              <section className="rounded-lg border border-luxas-line bg-luxas-paper p-4">
                <div className="flex items-center gap-2">
                  <BadgeInfo size={18} className="text-luxas-green" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-luxas-ink">PeakManager情報</h3>
                    <p className="text-xs text-stone-500">移行元から持ち込んだ主要項目です。</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoCard label="会員番号" value={displayCustomerValue(selectedCustomer.membershipNumber)} />
                  <InfoCard label="ランク" value={displayCustomerValue(selectedCustomer.rank)} />
                  <InfoCard label="総来店回数" value={displayCustomerValue(selectedCustomer.totalVisits)} />
                  <InfoCard label="総売上金額（税込）" value={displayCustomerValue(selectedCustomer.totalSalesIncTax)} />
                  <InfoCard label="取消" value={displayCustomerValue(selectedCustomer.cancelCount)} />
                  <InfoCard label="無断キャンセル" value={displayCustomerValue(selectedCustomer.noShowCount)} />
                  <InfoCard label="初回来店店舗" value={displayCustomerValue(selectedCustomer.firstVisitStore)} />
                  <InfoCard label="最終来店店舗" value={displayCustomerValue(selectedCustomer.lastVisitStore)} />
                </div>
              </section>

              <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BadgeInfo size={18} className="text-amber-700" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-amber-950">注意事項</p>
                      <p className="text-xs text-amber-900/80">施術前に必ず確認する項目です。</p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/reservations?customerName=${encodeURIComponent(selectedCustomer.name)}&phone=${encodeURIComponent(
                      selectedCustomer.phone
                    )}`}
                    className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-amber-950 ring-1 ring-inset ring-amber-200 transition hover:bg-amber-50"
                  >
                    <CalendarDays size={16} aria-hidden="true" />
                    予約作成へ
                  </Link>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-amber-950">
                  {selectedCustomer.caution ? selectedCustomer.caution : "注意事項は登録されていません。"}
                </p>
              </section>

              <div className="flex flex-wrap gap-2">
                {selectedCustomerTags.length > 0 ? (
                  selectedCustomerTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-luxas-mist px-2.5 py-1 text-xs font-semibold text-luxas-green ring-1 ring-inset ring-luxas-line"
                    >
                      <Tag size={12} className="text-luxas-green" aria-hidden="true" />
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-stone-400">タグなし</span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard label="氏名" value={selectedCustomer.name} />
                <InfoCard label="フリガナ" value={selectedCustomer.nameKana || "未入力"} />
                <InfoCard label="電話番号" value={selectedCustomer.phone || "未入力"} />
                <InfoCard label="メール" value={selectedCustomer.email || "未入力"} />
                <InfoCard label="生年月日" value={formatDateLabel(selectedCustomer.birthDate)} />
                <InfoCard label="性別" value={customerGenderLabels[selectedCustomer.gender]} />
                <InfoCard label="住所" value={selectedCustomer.address || "未入力"} />
                <InfoCard label="母店（所属店舗）" value={storeName(selectedCustomer.homeStoreId)} />
                <InfoCard label="初回来店日" value={formatDateLabel(selectedCustomer.firstVisitDate)} />
                <InfoCard label="最終来店日" value={formatDateLabel(selectedCustomer.lastVisitDate)} />
                <InfoCard
                  label="配信設定"
                  value={[`メール:${selectedCustomer.acceptsEmail === false ? "不可" : "可"}`, `DM:${selectedCustomer.acceptsDm === false ? "不可" : "可"}`, `プッシュ:${selectedCustomer.acceptsPush ? "可" : "不可"}`].join(" / ")}
                />
                <InfoCard label="作成日時 / 更新日時" value={`${formatTimestamp(selectedCustomer.createdAt)} / ${formatTimestamp(selectedCustomer.updatedAt)}`} />
              </div>

              <section className="rounded-md border border-luxas-line bg-white p-4">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-luxas-green" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-luxas-ink">来店サマリー</h3>
                  <span className="text-xs text-stone-500">予約履歴から自動集計</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <InfoCard label="区分" value={visitSummary.visitorType} />
                  <InfoCard label="予約総数" value={`${visitSummary.reservationTotal}件`} />
                  <InfoCard label="来店（完了）" value={`${visitSummary.visitCount}件`} />
                  <InfoCard label="会計済" value={`${visitSummary.paidCount}件`} />
                  <InfoCard label="売上合計（会計済）" value={formatCurrency(visitSummary.salesTotal)} />
                  <InfoCard label="客単価（会計済）" value={visitSummary.paidCount > 0 ? formatCurrency(visitSummary.avgSpend) : "—"} />
                  <InfoCard label="初回来店（履歴）" value={visitSummary.firstVisit ? formatDateLabel(visitSummary.firstVisit) : "—"} />
                  <InfoCard label="最終来店（履歴）" value={visitSummary.lastVisit ? formatDateLabel(visitSummary.lastVisit) : "—"} />
                  <InfoCard
                    label="最終来店からの経過"
                    value={visitSummary.daysSinceLastVisit !== null ? `${visitSummary.daysSinceLastVisit}日` : "—"}
                  />
                  <InfoCard
                    label="平均来店間隔"
                    value={visitSummary.avgIntervalDays !== null ? `${visitSummary.avgIntervalDays}日` : "—"}
                  />
                  <InfoCard label="キャンセル" value={`${visitSummary.canceledCount}件`} />
                </div>
                <p className="mt-3 text-[11px] text-stone-400">
                  ※ 予約履歴（台帳）から自動集計。客単価=会計済売上÷会計済件数、来店間隔=（最終−初回来店）÷（来店回数−1）、区分=完了来店2回以上でリピート。
                </p>
              </section>

              <section className="rounded-md border border-luxas-line bg-luxas-paper p-4">
                <div className="flex items-center gap-2">
                  <NotebookText size={18} className="text-luxas-green" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-luxas-ink">注意事項 / カルテメモ</h3>
                </div>

                <div className="mt-4 grid gap-3">
                  <TextAreaField
                    label="注意事項"
                    value={detailDraft.caution}
                    onChange={(value) => setDetailDraft((current) => ({ ...current, caution: value }))}
                    placeholder="受付時に共有したい注意点"
                  />
                  <TextAreaField
                    label="カルテメモ"
                    value={detailDraft.chartMemo}
                    onChange={(value) => setDetailDraft((current) => ({ ...current, chartMemo: value }))}
                    placeholder="施術や会話のメモ"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-stone-500">変更はこの顧客にだけ保存されます。</p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md bg-luxas-green px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#285f51]"
                    onClick={saveMemo}
                  >
                    <Save size={16} aria-hidden="true" />
                    メモを保存
                  </button>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2">
                  <History size={18} className="text-luxas-gold" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-luxas-ink">予約履歴</h3>
                  <span className="text-xs text-stone-500">{historyCount}件</span>
                </div>

                {relatedReservations.length === 0 ? (
                  <div className="mt-4 rounded-md border border-dashed border-luxas-line bg-white p-4 text-sm text-stone-600">
                    この顧客に紐づく予約履歴はまだありません。
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {relatedReservations.map((reservation) => (
                      <article key={reservation.id} className="rounded-md border border-luxas-line bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-luxas-ink">
                            <CalendarDays size={15} className="text-luxas-green" aria-hidden="true" />
                            {formatDateLabel(reservation.date)}
                            <ChevronRight size={14} className="text-stone-400" aria-hidden="true" />
                            {reservation.startTime} - {reservation.endTime}
                          </div>
                          <ReservationStatusBadge status={reservation.status} />
                        </div>

                        <dl className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
                          <DetailRow label="メニュー" value={serviceNameMap.get(reservation.serviceMenuId) ?? "未設定"} compact />
                          <DetailRow label="担当スタッフ" value={`${staffNameMap.get(reservation.staffId) ?? "未設定"}${reservation.nominatedStaffId ? "（指名）" : ""}`} compact />
                          <DetailRow label="ブース" value={roomNameMap.get(reservation.roomId) ?? "未設定"} compact />
                          <DetailRow label="ステータス" value={reservationStatusLabels[reservation.status]} compact />
                          <DetailRow label="会計" value={reservation.paymentStatus === "paid" ? formatCurrency(reservation.saleAmount ?? 0) : "未会計"} compact />
                        </dl>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="flex h-full min-h-[560px] flex-col items-center justify-center rounded-md border border-dashed border-luxas-line bg-luxas-paper px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-luxas-green ring-1 ring-inset ring-luxas-line">
                <BadgeInfo size={22} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-luxas-ink">顧客を選択してください</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600">
                一覧から顧客を選ぶと、詳細、注意事項、カルテメモ、予約履歴を表示します。
              </p>
              <button
                type="button"
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-luxas-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f51]"
                onClick={openCreateForm}
              >
                <Plus size={16} aria-hidden="true" />
                新規顧客を作成
              </button>
            </div>
          )}
        </section>
      </section>

      <CustomerFormModal
        mode={formMode}
        form={form}
        formMessage={formMessage}
        storeOptions={storeOptions}
        onChange={setForm}
        onClose={closeForm}
        onSubmit={saveForm}
      />

      {dupPrompt && (
        <DuplicateCustomerPrompt
          candidates={dupPrompt.candidates}
          enteredName={dupPrompt.payload.name}
          useExistingLabel="この顧客を開く"
          onUseExisting={handleUseExisting}
          onCreateNew={handleCreateNewAnyway}
          onCancel={() => setDupPrompt(null)}
        />
      )}
    </div>
  );
}

function matchesFilters(customer: Customer, filters: CustomerFilters) {
  const name = normalizeSearchValue(customer.name);
  const nameKana = normalizeSearchValue(customer.nameKana);
  const phone = normalizePhone(customer.phone);
  const email = normalizeSearchValue(customer.email);
  const tags = customer.tags.map((tag) => normalizeSearchValue(tag));

  if (normalizeSearchValue(filters.name) && !name.includes(normalizeSearchValue(filters.name))) {
    return false;
  }

  if (normalizeSearchValue(filters.nameKana) && !nameKana.includes(normalizeSearchValue(filters.nameKana))) {
    return false;
  }

  if (normalizePhone(filters.phone) && !phone.includes(normalizePhone(filters.phone))) {
    return false;
  }

  if (normalizeSearchValue(filters.email) && !email.includes(normalizeSearchValue(filters.email))) {
    return false;
  }

  if (
    normalizeSearchValue(filters.tag) &&
    !tags.some((tag) => tag.includes(normalizeSearchValue(filters.tag)))
  ) {
    return false;
  }

  return true;
}

function validateCustomerForm(form: CustomerForm) {
  if (isBlank(form.name)) {
    return "氏名を入力してください。";
  }

  if (isBlank(form.nameKana)) {
    return "フリガナを入力してください。";
  }

  if (isBlank(form.phone)) {
    return "電話番号を入力してください。";
  }

  if (form.email && !form.email.includes("@")) {
    return "メールアドレスの形式を確認してください。";
  }

  return null;
}

function createBlankForm(): CustomerForm {
  return {
    name: "",
    nameKana: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "unspecified",
    address: "",
    firstVisitDate: "",
    lastVisitDate: "",
    caution: "",
    chartMemo: "",
    tagsText: "",
    isActive: true,
    membershipNumber: "",
    phone2: "",
    phone3: "",
    email2: "",
    postalCode: "",
    prefecture: "",
    addressLine1: "",
    addressLine2: "",
    acceptsEmail: true,
    acceptsDm: true,
    acceptsPush: false,
    occupation: "",
    rank: "",
    comment: "",
    note1: "",
    note2: "",
    homeStoreId: "",
    effectiveStartDate: "",
    effectiveEndDate: ""
  };
}

function toForm(customer: Customer): CustomerForm {
  return {
    name: customer.name,
    nameKana: customer.nameKana,
    phone: customer.phone,
    email: customer.email,
    birthDate: customer.birthDate,
    gender: customer.gender,
    address: customer.address,
    firstVisitDate: customer.firstVisitDate,
    lastVisitDate: customer.lastVisitDate,
    caution: customer.caution,
    chartMemo: customer.chartMemo,
    tagsText: customer.tags.join(", "),
    isActive: customer.isActive,
    membershipNumber: customer.membershipNumber ?? "",
    phone2: customer.phone2 ?? "",
    phone3: customer.phone3 ?? "",
    email2: customer.email2 ?? "",
    postalCode: customer.postalCode ?? "",
    prefecture: customer.prefecture ?? "",
    addressLine1: customer.addressLine1 ?? "",
    addressLine2: customer.addressLine2 ?? "",
    acceptsEmail: customer.acceptsEmail ?? true,
    acceptsDm: customer.acceptsDm ?? true,
    acceptsPush: customer.acceptsPush ?? false,
    occupation: customer.occupation ?? "",
    rank: customer.rank ?? "",
    comment: customer.comment ?? "",
    note1: customer.note1 ?? "",
    note2: customer.note2 ?? "",
    homeStoreId: customer.homeStoreId ?? "",
    effectiveStartDate: customer.effectiveStartDate ?? "",
    effectiveEndDate: customer.effectiveEndDate ?? ""
  };
}

function toCustomerPayload(form: CustomerForm): Omit<Customer, "id"> {
  return {
    name: normalizeText(form.name),
    nameKana: normalizeText(form.nameKana),
    phone: normalizeText(form.phone),
    email: normalizeText(form.email),
    birthDate: form.birthDate,
    gender: form.gender,
    address: normalizeText(form.address),
    firstVisitDate: form.firstVisitDate,
    lastVisitDate: form.lastVisitDate,
    caution: normalizeText(form.caution),
    chartMemo: normalizeText(form.chartMemo),
    tags: parseTags(form.tagsText),
    isActive: form.isActive,
    // --- T067 拡張項目（空文字は undefined にして非破壊）---
    membershipNumber: normalizeText(form.membershipNumber) || undefined,
    phone2: normalizeText(form.phone2) || undefined,
    phone3: normalizeText(form.phone3) || undefined,
    email2: normalizeText(form.email2) || undefined,
    postalCode: normalizeText(form.postalCode) || undefined,
    prefecture: normalizeText(form.prefecture) || undefined,
    addressLine1: normalizeText(form.addressLine1) || undefined,
    addressLine2: normalizeText(form.addressLine2) || undefined,
    acceptsEmail: form.acceptsEmail,
    acceptsDm: form.acceptsDm,
    acceptsPush: form.acceptsPush,
    occupation: normalizeText(form.occupation) || undefined,
    rank: normalizeText(form.rank) || undefined,
    comment: normalizeText(form.comment) || undefined,
    note1: normalizeText(form.note1) || undefined,
    note2: normalizeText(form.note2) || undefined,
    homeStoreId: form.homeStoreId || undefined,
    effectiveStartDate: form.effectiveStartDate || undefined,
    effectiveEndDate: form.effectiveEndDate || undefined
  };
}

function parseTags(value: string) {
  return value
    .split(/[,、\n]/)
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 0);
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeSearchValue(value: string) {
  return normalizeText(value).toLowerCase();
}

function formatDateLabel(value: string) {
  if (!value) {
    return "未設定";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

// 今日（ローカル）を "YYYY-MM-DD" で返す。
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// "YYYY-MM-DD" 同士の日数差（to − from）。不正な日付は 0 を返す。
function daysBetween(from: string, to: string) {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return 0;
  }
  return Math.round((b - a) / 86_400_000);
}

function SummaryCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-luxas-line bg-white p-5">
      <p className="text-sm font-medium text-stone-600">{label}</p>
      <p className="mt-3 text-xl font-semibold text-luxas-ink">{value}</p>
      <p className="mt-2 text-sm text-stone-500">{detail}</p>
    </div>
  );
}

function SearchField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="mt-2 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition placeholder:text-stone-400 focus:border-luxas-green"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <textarea
        className="mt-2 min-h-24 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition placeholder:text-stone-400 focus:border-luxas-green"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function DetailRow({
  label,
  value,
  compact = false
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "grid gap-0.5" : "rounded-md border border-luxas-line bg-white p-3"}>
      <span className="text-xs font-medium text-stone-500">{label}</span>
      <span className={compact ? "text-sm font-medium text-luxas-ink" : "mt-1 text-sm text-luxas-ink"}>{value}</span>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-luxas-line bg-white p-3">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-luxas-ink">{value}</p>
    </div>
  );
}

// 顧客フォームのセクション枠（T067）。
function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-md border border-luxas-line bg-luxas-paper/40 p-4">
      <p className="text-sm font-semibold text-luxas-ink">{title}</p>
      {children}
    </section>
  );
}

function displayCustomerValue(value?: string) {
  return value && value.length > 0 ? value : "未設定";
}

function ReservationStatusBadge({ status }: { status: Reservation["status"] }) {
  const styles: Record<Reservation["status"], string> = {
    booked: "bg-luxas-mist text-luxas-green",
    completed: "bg-emerald-50 text-emerald-800",
    canceled: "bg-stone-100 text-stone-500"
  };

  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>{reservationStatusLabels[status]}</span>;
}

function CustomerStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
      ].join(" ")}
    >
      {isActive ? "有効" : "無効"}
    </span>
  );
}

function CustomerFormModal({
  mode,
  form,
  formMessage,
  storeOptions,
  onChange,
  onClose,
  onSubmit
}: {
  mode: FormMode | null;
  form: CustomerForm;
  formMessage: StatusMessageValue | null;
  storeOptions: Store[];
  onChange: (value: CustomerForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!mode) {
    return null;
  }

  function update<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4 py-8">
      <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-luxas-line bg-white shadow-soft">
        <div className="flex items-center justify-between gap-4 border-b border-luxas-line px-5 py-4">
          <div>
            <p className="text-sm font-medium text-luxas-green">顧客フォーム</p>
            <h2 className="mt-1 text-lg font-semibold text-luxas-ink">{mode === "create" ? "新規顧客" : "顧客を編集"}</h2>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-luxas-line text-stone-600 hover:bg-luxas-paper"
            onClick={onClose}
            aria-label="閉じる"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="space-y-5 px-5 py-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="氏名" value={form.name} onChange={(value) => update("name", value)} placeholder="例: 森下 彩" required />
            <Field
              label="フリガナ"
              value={form.nameKana}
              onChange={(value) => update("nameKana", value)}
              placeholder="例: モリシタ アヤ"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="電話番号" value={form.phone} onChange={(value) => update("phone", value)} placeholder="例: 090-1111-2222" required />
            <Field label="メール" value={form.email} onChange={(value) => update("email", value)} placeholder="例: aya@example.jp" />
            <Field label="生年月日" type="date" value={form.birthDate} onChange={(value) => update("birthDate", value)} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SelectField label="性別" value={form.gender} onChange={(value) => update("gender", value)}>
              {genderOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <Field
              label="初回来店日"
              type="date"
              value={form.firstVisitDate}
              onChange={(value) => update("firstVisitDate", value)}
            />
            <Field
              label="最終来店日"
              type="date"
              value={form.lastVisitDate}
              onChange={(value) => update("lastVisitDate", value)}
            />
          </div>

          <Field
            label="住所"
            value={form.address}
            onChange={(value) => update("address", value)}
            placeholder="例: 東京都渋谷区神宮前1-1-1"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <TextAreaField
              label="注意事項"
              value={form.caution}
              onChange={(value) => update("caution", value)}
              placeholder="受付・施術時の注意事項"
            />
            <TextAreaField
              label="カルテメモ"
              value={form.chartMemo}
              onChange={(value) => update("chartMemo", value)}
              placeholder="施術履歴や会話の記録"
            />
          </div>

          <Field
            label="タグ"
            value={form.tagsText}
            onChange={(value) => update("tagsText", value)}
            placeholder="例: 初回, 肩, 再来"
          />

          {/* --- 連絡先（T067）--- */}
          <FormSection title="連絡先">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="会員番号" value={form.membershipNumber} onChange={(value) => update("membershipNumber", value)} placeholder="例: LX-000123" />
              <Field label="郵便番号" value={form.postalCode} onChange={(value) => update("postalCode", value)} placeholder="例: 150-0001" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="電話番号2" value={form.phone2} onChange={(value) => update("phone2", value)} />
              <Field label="電話番号3" value={form.phone3} onChange={(value) => update("phone3", value)} />
              <Field label="メール2" value={form.email2} onChange={(value) => update("email2", value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="都道府県" value={form.prefecture} onChange={(value) => update("prefecture", value)} placeholder="例: 東京都" />
              <Field label="住所1" value={form.addressLine1} onChange={(value) => update("addressLine1", value)} placeholder="市区町村・番地" />
              <Field label="住所2" value={form.addressLine2} onChange={(value) => update("addressLine2", value)} placeholder="建物名など" />
            </div>
          </FormSection>

          {/* --- 配信設定（T067）--- */}
          <FormSection title="配信設定">
            <div className="grid gap-3 md:grid-cols-3">
              <ToggleField label="メール受け取り" checked={form.acceptsEmail} onChange={(value) => update("acceptsEmail", value)} />
              <ToggleField label="DM受け取り" checked={form.acceptsDm} onChange={(value) => update("acceptsDm", value)} />
              <ToggleField label="プッシュ通知受け取り" checked={form.acceptsPush} onChange={(value) => update("acceptsPush", value)} />
            </div>
            <p className="text-xs text-stone-500">※ 店舗別の配信設定は将来追加予定（現状は共通のON/OFF）。</p>
          </FormSection>

          {/* --- 顧客属性（T067）--- */}
          <FormSection title="顧客属性">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="職業" value={form.occupation} onChange={(value) => update("occupation", value)} placeholder="例: 会社員" />
              <Field label="顧客ランク" value={form.rank} onChange={(value) => update("rank", value)} placeholder="例: ゴールド" />
              <SelectField label="母店（所属店舗）" value={form.homeStoreId} onChange={(value) => update("homeStoreId", value)}>
                <option value="">未設定（既定店舗）</option>
                {storeOptions.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <Field label="コメント" value={form.comment} onChange={(value) => update("comment", value)} placeholder="一般コメント" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="備考1" value={form.note1} onChange={(value) => update("note1", value)} />
              <Field label="備考2" value={form.note2} onChange={(value) => update("note2", value)} />
            </div>
          </FormSection>

          {/* --- 管理情報（T067）--- */}
          <FormSection title="管理情報">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="適用開始日" type="date" value={form.effectiveStartDate} onChange={(value) => update("effectiveStartDate", value)} />
              <Field label="適用終了日" type="date" value={form.effectiveEndDate} onChange={(value) => update("effectiveEndDate", value)} />
            </div>
            <ToggleField label="有効顧客として扱う" checked={form.isActive} onChange={(value) => update("isActive", value)} />
            <p className="text-xs text-stone-500">※ 作成日時・更新日時は保存時に自動記録されます。作成者ID・更新者IDは認証導入後に対応予定。</p>
          </FormSection>

          <StatusMessage message={formMessage} />

          <div className="flex flex-col gap-2 border-t border-luxas-line pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-luxas-line bg-white px-4 py-2.5 text-sm font-semibold text-luxas-ink transition hover:bg-luxas-mist"
              onClick={onClose}
            >
              閉じる
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            >
              <Save size={16} aria-hidden="true" />
              保存
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="mt-2 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition placeholder:text-stone-400 focus:border-luxas-green"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <select
        className="mt-2 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition focus:border-luxas-green"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {children}
      </select>
    </label>
  );
}

function ToggleField({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-luxas-line bg-white px-3 py-2.5">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="h-4 w-4 accent-luxas-green"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
