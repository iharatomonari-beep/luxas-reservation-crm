"use client";

import { ChangeEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Download, FileText, ListFilter, Upload } from "lucide-react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { exportCustomersViaRpc, isOwner, logAudit } from "@/features/master-data/remote-collection";
import { backendFor } from "@/features/master-data/migration-config";
import { initialCustomers, customersStorageKey } from "@/features/customers/mock-data";
import type { Customer } from "@/features/customers/types";
import { initialStaff, initialServices, initialRooms, staffStorageKey, servicesStorageKey, roomsStorageKey } from "@/features/master-data/mock-data";
import type { StaffMember, ServiceMenu, ServiceRoom, StaffRole } from "@/features/master-data/types";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import type { Reservation, ReservationStatus } from "@/features/reservations/types";
import { isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { parseCsvRows, parseCsvText, serializeCsv } from "@/features/import-export/csv-utils";
import { filterReservationsByStore } from "@/features/reservations/store-scope";
import { isStaffHomeStore } from "@/features/master-data/store-staff-scope";
import { filterMenusByStore } from "@/features/master-data/store-menu-scope";
import { useCurrentStore } from "@/features/org/use-current-store";

type DatasetKey = "customers" | "staff" | "services" | "reservations";
type PeakManagerPreviewFields =
  | "peakManagerCustomerId"
  | "name"
  | "membershipNumber"
  | "rank"
  | "totalVisits"
  | "totalSalesIncTax"
  | "cancelCount"
  | "noShowCount"
  | "firstVisitStore"
  | "lastVisitStore";

type PreviewStatus = "ready" | "duplicate" | "error";

type PreviewRow = {
  rowNumber: number;
  values: Record<string, string>;
  status: PreviewStatus;
  errors: string[];
};

type PreviewState = {
  fileName: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  rows: PreviewRow[];
};

type DatasetSummary = {
  key: DatasetKey;
  title: string;
  description: string;
  fileName: string;
  importLabel: string;
  exportLabel: string;
  previewFields: string[];
};

type PeakManagerPreviewState = PreviewState;

type ImportRowResult<T> = {
  data?: T;
  errors: string[];
  duplicateKey: string;
};

const datasetSummaries: Record<DatasetKey, DatasetSummary> = {
  customers: {
    key: "customers",
    title: "顧客CSV",
    description: "氏名と電話番号を必須として、顧客データを追加します。",
    fileName: "customers.csv",
    importLabel: "顧客CSVを取り込む",
    exportLabel: "顧客CSVを書き出す",
    previewFields: ["name", "phone", "nameKana", "email", "tags", "isActive"]
  },
  staff: {
    key: "staff",
    title: "スタッフCSV",
    description: "氏名と表示名を必須として、スタッフデータを追加します。",
    fileName: "staff.csv",
    importLabel: "スタッフCSVを取り込む",
    exportLabel: "スタッフCSVを書き出す",
    previewFields: ["name", "displayName", "role", "sortOrder", "serviceMenuIds", "isActive"]
  },
  services: {
    key: "services",
    title: "メニューCSV",
    description: "メニュー名、所要時間、価格を必須として、メニューを追加します。",
    fileName: "services.csv",
    importLabel: "メニューCSVを取り込む",
    exportLabel: "メニューCSVを書き出す",
    previewFields: ["name", "durationMinutes", "price", "category", "sortOrder", "isActive"]
  },
  reservations: {
    key: "reservations",
    title: "予約CSV",
    description: "顧客名、メニュー名、スタッフ名、ブース名、日時を必須として追加します。",
    fileName: "reservations.csv",
    importLabel: "予約CSVを取り込む",
    exportLabel: "予約CSVを書き出す",
    previewFields: ["customerName", "serviceName", "staffName", "roomName", "date", "startTime", "endTime", "status"]
  }
};

const peakManagerPreviewFields: Array<{ key: PeakManagerPreviewFields; label: string }> = [
  { key: "peakManagerCustomerId", label: "顧客ID" },
  { key: "name", label: "顧客名" },
  { key: "membershipNumber", label: "会員番号" },
  { key: "rank", label: "ランク" },
  { key: "totalVisits", label: "総来店回数" },
  { key: "totalSalesIncTax", label: "総売上金額（税込）" },
  { key: "cancelCount", label: "取消" },
  { key: "noShowCount", label: "無断キャンセル" },
  { key: "firstVisitStore", label: "初回来店店舗" },
  { key: "lastVisitStore", label: "最終来店店舗" }
];

export function ImportExportManager() {
  const [customers, setCustomers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const [staff, setStaff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [services, setServices] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [rooms] = useLocalCollection<ServiceRoom>(roomsStorageKey, initialRooms);
  const [reservations, setReservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const { currentStoreId } = useCurrentStore();
  // 顧客CSVエクスポートの owner ゲート（フェーズ4 S3）。
  // supabase バックエンド時のみ owner 限定。local（開発・supabase未使用）は従来どおり許可。
  const customersAreSupabase = backendFor(customersStorageKey) === "supabase";
  const [canExportCustomers, setCanExportCustomers] = useState<boolean>(!customersAreSupabase);
  useEffect(() => {
    if (!customersAreSupabase) {
      setCanExportCustomers(true);
      return;
    }
    let cancelled = false;
    isOwner().then((owner) => {
      if (!cancelled) setCanExportCustomers(owner);
    });
    return () => {
      cancelled = true;
    };
  }, [customersAreSupabase]);
  const [peakManagerPreview, setPeakManagerPreview] = useState<PeakManagerPreviewState | null>(null);
  const [peakManagerMessage, setPeakManagerMessage] = useState<StatusMessageValue | null>(null);
  const [previewMap, setPreviewMap] = useState<Record<DatasetKey, PreviewState | null>>({
    customers: null,
    staff: null,
    services: null,
    reservations: null
  });
  const [messageMap, setMessageMap] = useState<Record<DatasetKey, StatusMessageValue | null>>({
    customers: null,
    staff: null,
    services: null,
    reservations: null
  });

  const staffNameMap = useMemo(() => buildStaffNameMap(staff), [staff]);
  const serviceNameMap = useMemo(() => buildServiceNameMap(services), [services]);
  const roomNameMap = useMemo(() => buildRoomNameMap(rooms), [rooms]);
  const staffByIdMap = useMemo(() => buildStaffIdMap(staff), [staff]);
  const serviceByIdMap = useMemo(() => buildServiceIdMap(services), [services]);
  const roomByIdMap = useMemo(() => buildRoomIdMap(rooms), [rooms]);

  // CSVインポートの参照解決・重複判定は「現在店舗の候補」に限定する（他店スタッフ/メニュー/予約への誤紐付けを防ぐ）。
  // 名前→IDの解決を現在店舗のスタッフ/メニューだけで行う。ブースは店舗スコープ未対応のため全体のまま。
  const importStaff = useMemo(() => staff.filter((s) => isStaffHomeStore(s, currentStoreId)), [staff, currentStoreId]);
  const importServices = useMemo(() => filterMenusByStore(services, currentStoreId), [services, currentStoreId]);
  const importReservations = useMemo(() => filterReservationsByStore(reservations, currentStoreId), [reservations, currentStoreId]);
  const importStaffNameMap = useMemo(() => buildStaffNameMap(importStaff), [importStaff]);
  const importServiceNameMap = useMemo(() => buildServiceNameMap(importServices), [importServices]);
  const importStaffByIdMap = useMemo(() => buildStaffIdMap(importStaff), [importStaff]);
  const importServiceByIdMap = useMemo(() => buildServiceIdMap(importServices), [importServices]);

  const summaries = useMemo(
    () => [
      { label: "顧客", value: `${customers.length}件` },
      { label: "スタッフ", value: `${staff.length}件` },
      { label: "メニュー", value: `${services.length}件` },
      { label: "予約", value: `${reservations.length}件` }
    ],
    [customers.length, staff.length, services.length, reservations.length]
  );

  function handleFileChange(dataset: DatasetKey, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    void file.text().then((text) => {
      const preview = buildPreview(dataset, file.name, text, {
        customers,
        staff: importStaff,
        services: importServices,
        rooms,
        reservations: importReservations,
        staffNameMap: importStaffNameMap,
        serviceNameMap: importServiceNameMap,
        roomNameMap,
        staffByIdMap: importStaffByIdMap,
        serviceByIdMap: importServiceByIdMap,
        roomByIdMap
      });

      setPreviewMap((current) => ({ ...current, [dataset]: preview }));
      setMessageMap((current) => ({
        ...current,
        [dataset]:
          preview.failureCount > 0
            ? {
                type: "error",
                text: `${preview.successCount}件を取り込み対象にしました。${preview.failureCount}件は確認が必要です。`
              }
            : {
                type: "success",
                text: `${preview.successCount}件を取り込み対象にしました。内容を確認してから取り込めます。`
              }
      }));
    });
  }

  function handleImport(dataset: DatasetKey) {
    const preview = previewMap[dataset];
    if (!preview) {
      return;
    }

    const acceptedRows = preview.rows.filter((row) => row.status === "ready");

    if (acceptedRows.length === 0) {
      setMessageMap((current) => ({
        ...current,
        [dataset]: { type: "error", text: "取り込める行がありません。" }
      }));
      return;
    }

    if (dataset === "customers") {
      const nextItems = acceptedRows.map((row) => toCustomer(row.values));
      setCustomers((current) => [...nextItems, ...current]);
      // ★件数のみ記録（取り込んだ氏名・電話等の本文は渡さない）。
      void logAudit("import", "customer_csv", null, { count: nextItems.length, format: "standard" });
    }

    if (dataset === "staff") {
      // 取り込んだスタッフは現在店舗の所属として扱う（未指定なら currentStoreId を付与）。
      const nextItems = acceptedRows.map((row) => {
        const s = toStaff(row.values);
        return { ...s, homeStoreId: s.homeStoreId ?? currentStoreId };
      });
      setStaff((current) => [...nextItems, ...current]);
    }

    if (dataset === "services") {
      // 取り込んだメニューは現在店舗の提供に限定する（未指定だと storeScope!=="selected" で全店共通になり、他店の予約候補に出てしまう）。
      const nextItems = acceptedRows.map((row) => {
        const m = toService(row.values);
        return m.storeScope === "selected"
          ? m
          : { ...m, storeScope: "selected" as const, storeIds: [currentStoreId] };
      });
      setServices((current) => [...nextItems, ...current]);
    }

    if (dataset === "reservations") {
      // 取り込んだ予約は現在店舗に紐付ける（未指定なら currentStoreId を付与）。
      const nextItems = acceptedRows.map((row) => {
        const r = toReservation(row.values, {
          staffNameMap: importStaffNameMap,
          serviceNameMap: importServiceNameMap,
          roomNameMap,
          staffByIdMap: importStaffByIdMap,
          serviceByIdMap: importServiceByIdMap,
          roomByIdMap
        });
        return { ...r, storeId: r.storeId ?? currentStoreId };
      });
      setReservations((current) => [...nextItems, ...current]);
    }

    setPreviewMap((current) => ({ ...current, [dataset]: null }));
    setMessageMap((current) => ({
      ...current,
      [dataset]: {
        type: "success",
        text: `${acceptedRows.length}件を追加しました。`
      }
    }));
  }

  async function handleExport(dataset: DatasetKey) {
    const fileName = datasetSummaries[dataset].fileName;

    // ★顧客（supabase）は owner 限定の export_customers() RPC 経由でのみ出力する。
    //   UIを迂回しても non-owner はサーバーで拒否される。監査記録は RPC 内部で行われる。
    if (dataset === "customers" && customersAreSupabase) {
      try {
        const rows = await exportCustomersViaRpc();
        const csv = serializeCsv(
          ["name", "nameKana", "phone", "email", "birthDate", "gender", "address", "firstVisitDate", "lastVisitDate", "caution", "chartMemo", "tags", "isActive"],
          rows.map((r) => ({
            name: (r.name as string) ?? "",
            nameKana: (r.name_kana as string) ?? "",
            phone: (r.phone as string) ?? "",
            email: (r.email as string) ?? "",
            birthDate: (r.birth_date as string) ?? "",
            gender: (r.gender as string) ?? "",
            address: (r.address as string) ?? "",
            firstVisitDate: (r.first_visit_date as string) ?? "",
            lastVisitDate: (r.last_visit_date as string) ?? "",
            caution: (r.caution as string) ?? "",
            chartMemo: (r.chart_memo as string) ?? "",
            tags: Array.isArray(r.tags) ? (r.tags as string[]).join(", ") : "",
            isActive: r.is_active ? "true" : "false"
          }))
        );
        downloadCsv(fileName, csv);
        setMessageMap((current) => ({
          ...current,
          [dataset]: { type: "success", text: `${fileName} をダウンロードしました。（${rows.length}件）` }
        }));
      } catch {
        // owner 以外はサーバーで拒否される。
        setMessageMap((current) => ({
          ...current,
          [dataset]: { type: "error", text: "顧客CSVの書き出しは owner 権限が必要です。" }
        }));
      }
      return;
    }

    // CSV出力は現在店舗のデータのみに絞る（他店舗の予約/スタッフ/メニューを書き出さない）。
    // ※顧客（local時）は per-store フィールドが無く全件のまま（顧客の店舗スコープ化は別途・要モデル拡張）。
    const csv = buildExportCsv(dataset, {
      customers,
      staff: staff.filter((s) => isStaffHomeStore(s, currentStoreId)),
      services: filterMenusByStore(services, currentStoreId),
      reservations: filterReservationsByStore(reservations, currentStoreId),
      staffNameMap,
      serviceNameMap,
      roomNameMap,
      staffByIdMap,
      serviceByIdMap,
      roomByIdMap
    });
    downloadCsv(fileName, csv);
    setMessageMap((current) => ({
      ...current,
      [dataset]: {
        type: "success",
        text: `${fileName} をダウンロードしました。`
      }
    }));
  }

  function handlePeakManagerFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    void file.text().then((text) => {
      const preview = buildPeakManagerPreview(file.name, text, customers);
      setPeakManagerPreview(preview);
      setPeakManagerMessage(
        preview.failureCount > 0
          ? {
              type: "error",
              text: `${preview.successCount}件を取り込み対象にしました。${preview.failureCount}件は確認が必要です。`
            }
          : {
              type: "success",
              text: `${preview.successCount}件を取り込み対象にしました。内容を確認してから取り込めます。`
            }
      );
    });
  }

  function handlePeakManagerImport() {
    if (!peakManagerPreview) {
      return;
    }

    const acceptedRows = peakManagerPreview.rows.filter((row) => row.status === "ready");

    if (acceptedRows.length === 0) {
      setPeakManagerMessage({ type: "error", text: "取り込める行がありません。" });
      return;
    }

    const nextItems: Customer[] = [];
    for (const row of acceptedRows) {
      const result = parsePeakManagerCustomerRow(row.values, customers);

      if (result.data) {
        nextItems.push(result.data);
      }
    }
    setCustomers((current) => [...nextItems, ...current]);
    setPeakManagerPreview(null);
    setPeakManagerMessage({ type: "success", text: `${acceptedRows.length}件を追加しました。` });
    // ★件数のみ記録（PM名簿の氏名・電話等の本文は渡さない）。
    void logAudit("import", "customer_csv", null, { count: nextItems.length, format: "peakmanager" });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-luxas-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-luxas-green">CSV 入出力</p>
          <h1 className="mt-2 text-2xl font-semibold text-luxas-ink">CSV入出力</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            localStorage に保存された顧客、スタッフ、メニュー、予約データをCSVで追加・書き出しできます。インポート前に内容を確認してから取り込みます。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaries.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </section>

      <PeakManagerImportSection
        preview={peakManagerPreview}
        message={peakManagerMessage}
        onFileChange={handlePeakManagerFileChange}
        onImport={handlePeakManagerImport}
      />

      <section className="grid gap-6">
        {(["customers", "staff", "services", "reservations"] as const).map((dataset) => (
          <DatasetSection
            key={dataset}
            summary={datasetSummaries[dataset]}
            preview={previewMap[dataset]}
            message={messageMap[dataset]}
            onFileChange={(event) => handleFileChange(dataset, event)}
            onImport={() => handleImport(dataset)}
            onExport={() => {
              void handleExport(dataset);
            }}
            exportHidden={dataset === "customers" && customersAreSupabase && !canExportCustomers}
          />
        ))}
      </section>
    </div>
  );
}

function DatasetSection({
  summary,
  preview,
  message,
  onFileChange,
  onImport,
  onExport,
  exportHidden = false
}: {
  summary: DatasetSummary;
  preview: PreviewState | null;
  message: StatusMessageValue | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  onExport: () => void;
  exportHidden?: boolean;
}) {
  return (
    <section className="rounded-lg border border-luxas-line bg-white">
      <div className="flex flex-col gap-4 border-b border-luxas-line p-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-luxas-green" aria-hidden="true" />
            <h2 className="text-base font-semibold text-luxas-ink">{summary.title}</h2>
          </div>
          <p className="text-sm leading-6 text-stone-600">{summary.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {exportHidden ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-luxas-line bg-luxas-paper px-3 py-2 text-sm font-medium text-stone-400">
              <Download size={16} aria-hidden="true" />
              書き出しは owner のみ
            </span>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-luxas-ink transition hover:bg-luxas-paper"
              onClick={onExport}
            >
              <Download size={16} aria-hidden="true" />
              {summary.exportLabel}
            </button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-luxas-green px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#285f51]">
            <Upload size={16} aria-hidden="true" />
            {summary.importLabel}
            <input className="hidden" type="file" accept=".csv,text/csv" onChange={onFileChange} />
          </label>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <StatusMessage message={message} />

        {preview ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <InfoTile label="総行数" value={`${preview.totalCount}件`} />
              <InfoTile label="取り込み可" value={`${preview.successCount}件`} />
              <InfoTile label="確認が必要" value={`${preview.failureCount}件`} />
              <InfoTile label="ファイル" value={preview.fileName} />
            </div>

            <div className="overflow-hidden rounded-md border border-luxas-line">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-luxas-paper">
                    <tr>
                      <Th>行</Th>
                      {summary.previewFields.map((field) => (
                        <Th key={field}>{field}</Th>
                      ))}
                      <Th>結果</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.rowNumber} className="border-t border-luxas-line">
                        <Td>{row.rowNumber}</Td>
                        {summary.previewFields.map((field) => (
                          <Td key={field}>{row.values[field] || ""}</Td>
                        ))}
                        <Td>
                          <div className="space-y-1">
                            <PreviewBadge status={row.status} />
                            {row.errors.length > 0 ? (
                              <ul className="space-y-1 text-xs text-red-700">
                                {row.errors.map((error) => (
                                  <li key={error}>{error}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-luxas-line pt-4">
              <p className="text-xs leading-5 text-stone-500">
                必須項目が不足した行、重複行、参照先が見つからない行は取り込みません。
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-luxas-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f51] disabled:cursor-not-allowed disabled:bg-stone-300"
                onClick={onImport}
                disabled={preview.successCount === 0}
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                取り込む
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-md border border-dashed border-luxas-line bg-luxas-paper px-4 py-5 text-sm text-stone-600">
            <ListFilter className="mt-0.5 shrink-0 text-luxas-green" size={18} aria-hidden="true" />
            <p>
              CSVファイルを選ぶと、内容をプレビューできます。ヘッダーは1行目に置き、余分な列があっても取り込み処理は止まりません。
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function PeakManagerImportSection({
  preview,
  message,
  onFileChange,
  onImport
}: {
  preview: PeakManagerPreviewState | null;
  message: StatusMessageValue | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
}) {
  return (
    <section className="rounded-lg border border-luxas-line bg-white">
      <div className="flex flex-col gap-4 border-b border-luxas-line p-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-luxas-green" aria-hidden="true" />
            <h2 className="text-base font-semibold text-luxas-ink">PeakManager顧客明細CSV取り込み</h2>
          </div>
          <p className="text-sm leading-6 text-stone-600">
            1行目のタイトル行「顧客明細」を無視し、2行目のヘッダーを読み取って顧客情報を追加します。既存の顧客データは消しません。
          </p>
          <p className="text-xs leading-5 text-stone-500">
            まずは `docs/sample-csv/peakmanager-customers-sample.csv` で表示イメージを確認し、その後に同じ構造のCSVを取り込んでください。
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-luxas-green px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#285f51]">
          <Upload size={16} aria-hidden="true" />
          PeakManager顧客明細CSVを選ぶ
          <input className="hidden" type="file" accept=".csv,text/csv" onChange={onFileChange} />
        </label>
      </div>

      <div className="space-y-4 p-5">
        <StatusMessage message={message} />

        {preview ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <InfoTile label="総行数" value={`${preview.totalCount}件`} />
              <InfoTile label="取り込み可" value={`${preview.successCount}件`} />
              <InfoTile label="確認が必要" value={`${preview.failureCount}件`} />
              <InfoTile label="ファイル" value={preview.fileName} />
            </div>

            <div className="overflow-hidden rounded-md border border-luxas-line">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-luxas-paper">
                    <tr>
                      <Th>行</Th>
                      {peakManagerPreviewFields.map((field) => (
                        <Th key={field.key}>{field.label}</Th>
                      ))}
                      <Th>結果</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.rowNumber} className="border-t border-luxas-line">
                        <Td>{row.rowNumber}</Td>
                        {peakManagerPreviewFields.map((field) => (
                          <Td key={field.key}>{previewValue(row.values[field.key])}</Td>
                        ))}
                        <Td>
                          <div className="space-y-1">
                            <PreviewBadge status={row.status} />
                            {row.errors.length > 0 ? (
                              <ul className="space-y-1 text-xs text-red-700">
                                {row.errors.map((error) => (
                                  <li key={error}>{error}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-luxas-line pt-4">
              <p className="text-xs leading-5 text-stone-500">
                顧客IDがある行はそのまま保持します。既存の顧客と重複する行は取り込みません。
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-luxas-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f51] disabled:cursor-not-allowed disabled:bg-stone-300"
                onClick={onImport}
                disabled={preview.successCount === 0}
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                取り込む
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-md border border-dashed border-luxas-line bg-luxas-paper px-4 py-5 text-sm text-stone-600">
            <ListFilter className="mt-0.5 shrink-0 text-luxas-green" size={18} aria-hidden="true" />
            <p>
              PeakManager の顧客明細CSVを選ぶと、タイトル行を除いたヘッダーを読み取り、LUXASの顧客データとして取り込み前プレビューを表示します。
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function buildPreview(
  dataset: DatasetKey,
  fileName: string,
  text: string,
  context: {
    customers: Customer[];
    staff: StaffMember[];
    services: ServiceMenu[];
    rooms: ServiceRoom[];
    reservations: Reservation[];
    staffNameMap: Map<string, StaffMember>;
    serviceNameMap: Map<string, ServiceMenu>;
    roomNameMap: Map<string, ServiceRoom>;
    staffByIdMap: Map<string, StaffMember>;
    serviceByIdMap: Map<string, ServiceMenu>;
    roomByIdMap: Map<string, ServiceRoom>;
  }
): PreviewState {
  const { records } = parseCsvText(text);
  const previewRows: PreviewRow[] = [];
  let successCount = 0;
  let failureCount = 0;
  const seenKeys = new Set<string>();

  for (let index = 0; index < records.length; index += 1) {
    const rowNumber = index + 2;
    const values = records[index];
    const result = parseDatasetRow(dataset, values, context);
    const isDuplicate = !result.errors.length && (result.duplicateKey.length > 0 && seenKeys.has(result.duplicateKey));

    if (result.errors.length > 0) {
      failureCount += 1;
      previewRows.push({
        rowNumber,
        values,
        status: "error",
        errors: result.errors
      });
      continue;
    }

    if (isDuplicate) {
      failureCount += 1;
      previewRows.push({
        rowNumber,
        values,
        status: "duplicate",
        errors: ["既存データと重複しています。"]
      });
      continue;
    }

    if (result.duplicateKey.length > 0) {
      seenKeys.add(result.duplicateKey);
    }

    successCount += 1;
    previewRows.push({
      rowNumber,
      values,
      status: "ready",
      errors: []
    });
  }

  return {
    fileName,
    totalCount: records.length,
    successCount,
    failureCount,
    rows: previewRows
  };
}

function buildPeakManagerPreview(fileName: string, text: string, existingCustomers: Customer[]): PeakManagerPreviewState {
  const rows = parseCsvRows(text);

  if (rows.length < 2) {
    return {
      fileName,
      totalCount: 0,
      successCount: 0,
      failureCount: 1,
      rows: [
        {
          rowNumber: 2,
          values: {},
          status: "error",
          errors: ["2行目にヘッダー行が必要です。"]
        }
      ]
    };
  }

  const headers = rows[1].map((header) => normalizeText(header));
  const dataRows = rows.slice(2);
  const previewRows: PreviewRow[] = [];
  let successCount = 0;
  let failureCount = 0;
  const seenKeys = new Set<string>();

  for (let index = 0; index < dataRows.length; index += 1) {
    const rowNumber = index + 3;
    const values = toCsvRecord(headers, dataRows[index]);
    const result = parsePeakManagerCustomerRow(values, existingCustomers);
    const isDuplicate = !result.errors.length && result.duplicateKey.length > 0 && seenKeys.has(result.duplicateKey);

    if (result.errors.length > 0) {
      failureCount += 1;
      previewRows.push({
        rowNumber,
        values,
        status: "error",
        errors: result.errors
      });
      continue;
    }

    if (isDuplicate) {
      failureCount += 1;
      previewRows.push({
        rowNumber,
        values,
        status: "duplicate",
        errors: ["既存データと重複しています。"]
      });
      continue;
    }

    if (result.duplicateKey.length > 0) {
      seenKeys.add(result.duplicateKey);
    }

    successCount += 1;
    previewRows.push({
      rowNumber,
      values,
      status: "ready",
      errors: []
    });
  }

  return {
    fileName,
    totalCount: dataRows.length,
    successCount,
    failureCount,
    rows: previewRows
  };
}

function parsePeakManagerCustomerRow(values: Record<string, string>, existing: Customer[]) {
  const peakManagerCustomerId = normalizeText(values["顧客ID"] || "");
  const name = normalizeText(values["顧客名"] || "") || "氏名未設定";
  const nameKana = normalizeText(values["カナ"] || "");
  const gender = normalizeCustomerGender(values["性別"] || "");
  const phone = normalizeText(values["電話番号"] || "");
  const membershipNumber = normalizeText(values["会員番号"] || "");
  const birthDate = normalizeText(values["生年月日"] || "");
  const occupation = normalizeText(values["職業"] || "");
  const postalCode = normalizeText(values["郵便番号"] || "");
  const prefecture = normalizeText(values["都道府県"] || "");
  const addressLine1 = normalizeText(values["住所１"] || "");
  const addressLine2 = normalizeText(values["住所2"] || "");
  const dmSend = normalizeText(values["DM送付"] || "");
  const newsletterEmail = normalizeText(values["お知らせメール"] || "");
  const rank = normalizeText(values["ランク"] || "");
  const caution1 = normalizeText(values["備考１"] || "");
  const caution2 = normalizeText(values["備考２"] || "");
  const firstVisitAt = normalizeText(values["初回来店日時"] || "");
  const firstVisitStore = normalizeText(values["初回来店店舗"] || "");
  const lastVisitAt = normalizeText(values["最終来店日時"] || "");
  const lastVisitStore = normalizeText(values["最終来店店舗"] || "");
  const totalVisits = normalizeText(values["総来店回数"] || "");
  const totalSalesExTax = normalizeText(values["総売上金額（税抜）"] || "");
  const totalSalesIncTax = normalizeText(values["総売上金額（税込）"] || "");
  const phoneReservationCount = normalizeText(values["電話"] || "");
  const pcOnlineReservationCount = normalizeText(values["PCオンライン"] || "");
  const mobileOnlineReservationCount = normalizeText(values["携帯オンライン"] || "");
  const cancelCount = normalizeText(values["取消"] || "");
  const noShowCount = normalizeText(values["無断キャンセル"] || "");
  const email = normalizeText(values["メールアドレス"] || "");
  const chartMemo = normalizeText(values["コメント"] || "");
  const tags = normalizeTags(values["顧客タグ"] || "");
  const caution = combineText([caution1, caution2], "\n");
  const address = combineText([prefecture, addressLine1, addressLine2], "");
  const firstVisitDate = extractDatePart(firstVisitAt);
  const lastVisitDate = extractDatePart(lastVisitAt);
  const isActive = true;

  const duplicateKey = buildPeakManagerDuplicateKey({
    peakManagerCustomerId,
    membershipNumber,
    name,
    phone
  });

  const errors = [];
  if (
    duplicateExistsInCustomers(existing, {
      peakManagerCustomerId,
      membershipNumber,
      name,
      phone
    })
  ) {
    errors.push("既存の顧客と重複しています。");
  }

  if (errors.length > 0) {
    return { errors, duplicateKey };
  }

  return {
    data: {
      id: makeLocalId("customer"),
      peakManagerCustomerId,
      name,
      nameKana,
      phone,
      email,
      birthDate,
      gender,
      address,
      membershipNumber,
      occupation,
      postalCode,
      prefecture,
      addressLine1,
      addressLine2,
      dmSend,
      newsletterEmail,
      rank,
      caution1,
      caution2,
      firstVisitAt,
      firstVisitStore,
      lastVisitAt,
      lastVisitStore,
      totalVisits,
      totalSalesExTax,
      totalSalesIncTax,
      phoneReservationCount,
      pcOnlineReservationCount,
      mobileOnlineReservationCount,
      cancelCount,
      noShowCount,
      firstVisitDate,
      lastVisitDate,
      caution,
      chartMemo,
      tags,
      isActive
    },
    errors: [],
    duplicateKey
  };
}

function parseDatasetRow(
  dataset: DatasetKey,
  values: Record<string, string>,
  context: {
    customers: Customer[];
    staff: StaffMember[];
    services: ServiceMenu[];
    rooms: ServiceRoom[];
    reservations: Reservation[];
    staffNameMap: Map<string, StaffMember>;
    serviceNameMap: Map<string, ServiceMenu>;
    roomNameMap: Map<string, ServiceRoom>;
    staffByIdMap: Map<string, StaffMember>;
    serviceByIdMap: Map<string, ServiceMenu>;
    roomByIdMap: Map<string, ServiceRoom>;
  }
): ImportRowResult<Customer | StaffMember | ServiceMenu | Reservation> {
  if (dataset === "customers") {
    return parseCustomerRow(values, context.customers);
  }

  if (dataset === "staff") {
    return parseStaffRow(values, context.staff);
  }

  if (dataset === "services") {
    return parseServiceRow(values, context.services);
  }

  return parseReservationRow(
    values,
    context.reservations,
    context.staffNameMap,
    context.serviceNameMap,
    context.roomNameMap,
    context.staffByIdMap,
    context.serviceByIdMap,
    context.roomByIdMap
  );
}

function parseCustomerRow(values: Record<string, string>, existing: Customer[]) {
  const name = normalizeText(values.name || values.fullName || "");
  const phone = normalizeText(values.phone || "");
  const nameKana = normalizeText(values.nameKana || values.kana || "");
  const email = normalizeText(values.email || "");
  const birthDate = normalizeText(values.birthDate || "");
  const gender = normalizeCustomerGender(values.gender || "");
  const address = normalizeText(values.address || "");
  const firstVisitDate = normalizeText(values.firstVisitDate || "");
  const lastVisitDate = normalizeText(values.lastVisitDate || "");
  const caution = normalizeText(values.caution || values.alertNote || "");
  const chartMemo = normalizeText(values.chartMemo || values.memo || "");
  const tags = normalizeTags(values.tags || "");
  const isActive = parseBoolean(values.isActive, true);
  const errors = [];

  if (isBlank(name)) {
    errors.push("name は必須です。");
  }

  if (isBlank(phone)) {
    errors.push("phone は必須です。");
  }

  const duplicateKey = `${name}|${phone}`;
  if (existing.some((customer) => `${normalizeText(customer.name)}|${normalizeText(customer.phone)}` === duplicateKey)) {
    errors.push("既存の顧客と重複しています。");
  }

  if (errors.length > 0) {
    return { errors, duplicateKey };
  }

  return {
    data: {
      id: makeLocalId("customer"),
      name,
      nameKana,
      phone,
      email,
      birthDate,
      gender,
      address,
      firstVisitDate,
      lastVisitDate,
      caution,
      chartMemo,
      tags,
      isActive
    },
    errors: [],
    duplicateKey
  };
}

function parseStaffRow(values: Record<string, string>, existing: StaffMember[]) {
  const name = normalizeText(values.name || values.fullName || "");
  const displayName = normalizeText(values.displayName || values.nickname || "");
  const role = normalizeStaffRole(values.role || "");
  const sortOrder = parsePositiveInteger(values.sortOrder) ?? 10;
  const serviceMenuIds = parseCsvList(values.serviceMenuIds || values.serviceIds || values.menuIds || "");
  const isActive = parseBoolean(values.isActive, true);
  const errors = [];

  if (isBlank(name)) {
    errors.push("name は必須です。");
  }

  if (isBlank(displayName)) {
    errors.push("displayName は必須です。");
  }

  const duplicateKey = `${name}|${displayName}`;
  if (existing.some((item) => `${normalizeText(item.fullName)}|${normalizeText(item.displayName)}` === duplicateKey)) {
    errors.push("既存のスタッフと重複しています。");
  }

  if (errors.length > 0) {
    return { errors, duplicateKey };
  }

  return {
    data: {
      id: makeLocalId("staff"),
      fullName: name,
      displayName,
      role,
      sortOrder,
      serviceMenuIds,
      isActive
    },
    errors: [],
    duplicateKey
  };
}

function parseServiceRow(values: Record<string, string>, existing: ServiceMenu[]) {
  const name = normalizeText(values.name || "");
  const durationMinutes = parsePositiveInteger(values.durationMinutes);
  const price = parsePositiveInteger(values.price);
  const category = normalizeText(values.category || "");
  const sortOrder = parsePositiveInteger(values.sortOrder) ?? 10;
  const isActive = parseBoolean(values.isActive, true);
  const errors = [];

  if (isBlank(name)) {
    errors.push("name は必須です。");
  }

  if (durationMinutes == null) {
    errors.push("durationMinutes は数値で指定してください。");
  }

  if (price == null) {
    errors.push("price は数値で指定してください。");
  }

  const duplicateKey = `${name}|${durationMinutes ?? ""}|${price ?? ""}`;
  if (existing.some((item) => `${normalizeText(item.name)}|${item.durationMinutes}|${item.price}` === duplicateKey)) {
    errors.push("既存のメニューと重複しています。");
  }

  if (errors.length > 0) {
    return { errors, duplicateKey };
  }

  return {
    data: {
      id: makeLocalId("service"),
      name,
      durationMinutes: durationMinutes ?? 0,
      price: price ?? 0,
      category,
      sortOrder,
      isActive
    },
    errors: [],
    duplicateKey
  };
}

function parseReservationRow(
  values: Record<string, string>,
  existing: Reservation[],
  staffNameMap: Map<string, StaffMember>,
  serviceNameMap: Map<string, ServiceMenu>,
  roomNameMap: Map<string, ServiceRoom>,
  staffByIdMap: Map<string, StaffMember>,
  serviceByIdMap: Map<string, ServiceMenu>,
  roomByIdMap: Map<string, ServiceRoom>
) {
  const customerName = normalizeText(values.customerName || "");
  const phone = normalizeText(values.phone || "");
  const serviceName = normalizeText(values.serviceName || "");
  const staffName = normalizeText(values.staffName || "");
  const roomName = normalizeText(values.roomName || "");
  const date = normalizeText(values.date || "");
  const startTime = normalizeText(values.startTime || "");
  const endTime = normalizeText(values.endTime || "");
  const status = normalizeReservationStatus(values.status || "");
  const memo = normalizeText(values.memo || "");
  const errors = [];

  if (isBlank(customerName)) {
    errors.push("customerName は必須です。");
  }

  if (isBlank(serviceName)) {
    errors.push("serviceName は必須です。");
  }

  if (isBlank(staffName)) {
    errors.push("staffName は必須です。");
  }

  if (isBlank(roomName)) {
    errors.push("roomName は必須です。");
  }

  if (isBlank(date)) {
    errors.push("date は必須です。");
  }

  if (isBlank(startTime)) {
    errors.push("startTime は必須です。");
  }

  if (isBlank(endTime)) {
    errors.push("endTime は必須です。");
  }

  const service = serviceNameMap.get(serviceName);
  const staff = staffNameMap.get(staffName) ?? [...staffNameMap.values()].find((item) => normalizeText(item.fullName) === staffName);
  const room = roomNameMap.get(roomName);

  if (!service) {
    errors.push(`メニューが見つかりません: ${serviceName}`);
  }

  if (!staff) {
    errors.push(`スタッフが見つかりません: ${staffName}`);
  }

  if (!room) {
    errors.push(`ブースが見つかりません: ${roomName}`);
  }

  const duplicateKey = `${customerName}|${serviceName}|${staffName}|${roomName}|${date}|${startTime}|${endTime}`;
  if (
    existing.some((item) =>
      `${normalizeText(item.customerName)}|${resolveServiceName(item.serviceMenuId, serviceByIdMap)}|${resolveStaffName(item.staffId, staffByIdMap)}|${resolveRoomName(item.roomId, roomByIdMap)}|${normalizeText(item.date)}|${normalizeText(item.startTime)}|${normalizeText(item.endTime)}` === duplicateKey
    )
  ) {
    errors.push("既存の予約と重複しています。");
  }

  if (errors.length > 0 || !service || !staff || !room) {
    return { errors, duplicateKey };
  }

  return {
    data: {
      id: makeLocalId("reservation"),
      date,
      startTime,
      endTime,
      customerName,
      phone,
      serviceMenuId: service.id,
      staffId: staff.id,
      roomId: room.id,
      status,
      memo
    },
    errors: [],
    duplicateKey
  };
}

function toCsvRecord(headers: string[], row: string[]) {
  const record: Record<string, string> = {};

  headers.forEach((header, index) => {
    if (header) {
      record[header] = normalizeText(row[index] ?? "");
    }
  });

  return record;
}

function buildExportCsv(
  dataset: DatasetKey,
  context: {
    customers: Customer[];
    staff: StaffMember[];
    services: ServiceMenu[];
    reservations: Reservation[];
    staffNameMap: Map<string, StaffMember>;
    serviceNameMap: Map<string, ServiceMenu>;
    roomNameMap: Map<string, ServiceRoom>;
    staffByIdMap: Map<string, StaffMember>;
    serviceByIdMap: Map<string, ServiceMenu>;
    roomByIdMap: Map<string, ServiceRoom>;
  }
) {
  if (dataset === "customers") {
    return serializeCsv(
      ["name", "nameKana", "phone", "email", "birthDate", "gender", "address", "firstVisitDate", "lastVisitDate", "caution", "chartMemo", "tags", "isActive"],
      context.customers.map((customer) => ({
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
        tags: customer.tags.join(", "),
        isActive: customer.isActive ? "true" : "false"
      }))
    );
  }

  if (dataset === "staff") {
    return serializeCsv(
      ["name", "displayName", "role", "sortOrder", "serviceMenuIds", "isActive"],
      context.staff.map((item) => ({
        name: item.fullName,
        displayName: item.displayName,
        role: item.role,
        sortOrder: item.sortOrder,
        serviceMenuIds: (item.serviceMenuIds ?? []).join(", "),
        isActive: item.isActive ? "true" : "false"
      }))
    );
  }

  if (dataset === "services") {
    return serializeCsv(
      ["name", "durationMinutes", "price", "category", "sortOrder", "isActive"],
      context.services.map((item) => ({
        name: item.name,
        durationMinutes: item.durationMinutes,
        price: item.price,
        category: item.category,
        sortOrder: item.sortOrder,
        isActive: item.isActive ? "true" : "false"
      }))
    );
  }

  return serializeCsv(
    ["customerName", "phone", "serviceName", "staffName", "roomName", "date", "startTime", "endTime", "status", "memo"],
    context.reservations.map((reservation) => ({
      customerName: reservation.customerName,
      phone: reservation.phone,
      serviceName: resolveServiceName(reservation.serviceMenuId, context.serviceByIdMap),
      staffName: resolveStaffName(reservation.staffId, context.staffByIdMap),
      roomName: resolveRoomName(reservation.roomId, context.roomByIdMap),
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      status: reservation.status,
      memo: reservation.memo
    }))
  );
}

function toCustomer(values: Record<string, string>): Customer {
  return {
    id: makeLocalId("customer"),
    name: normalizeText(values.name || values.fullName || ""),
    nameKana: normalizeText(values.nameKana || values.kana || ""),
    phone: normalizeText(values.phone || ""),
    email: normalizeText(values.email || ""),
    birthDate: normalizeText(values.birthDate || ""),
    gender: normalizeCustomerGender(values.gender || ""),
    address: normalizeText(values.address || ""),
    firstVisitDate: normalizeText(values.firstVisitDate || ""),
    lastVisitDate: normalizeText(values.lastVisitDate || ""),
    caution: normalizeText(values.caution || values.alertNote || ""),
    chartMemo: normalizeText(values.chartMemo || values.memo || ""),
    tags: normalizeTags(values.tags || ""),
    isActive: parseBoolean(values.isActive, true)
  };
}

function toStaff(values: Record<string, string>): StaffMember {
  return {
    id: makeLocalId("staff"),
    fullName: normalizeText(values.name || values.fullName || ""),
    displayName: normalizeText(values.displayName || values.nickname || ""),
    role: normalizeStaffRole(values.role || ""),
    sortOrder: parsePositiveInteger(values.sortOrder) ?? 10,
    serviceMenuIds: parseCsvList(values.serviceMenuIds || values.serviceIds || values.menuIds || ""),
    isActive: parseBoolean(values.isActive, true)
  };
}

function toService(values: Record<string, string>): ServiceMenu {
  return {
    id: makeLocalId("service"),
    name: normalizeText(values.name || ""),
    durationMinutes: parsePositiveInteger(values.durationMinutes) ?? 0,
    price: parsePositiveInteger(values.price) ?? 0,
    category: normalizeText(values.category || ""),
    sortOrder: parsePositiveInteger(values.sortOrder) ?? 10,
    isActive: parseBoolean(values.isActive, true)
  };
}

function toReservation(
  values: Record<string, string>,
  context: {
    staffNameMap: Map<string, StaffMember>;
    serviceNameMap: Map<string, ServiceMenu>;
    roomNameMap: Map<string, ServiceRoom>;
    staffByIdMap: Map<string, StaffMember>;
    serviceByIdMap: Map<string, ServiceMenu>;
    roomByIdMap: Map<string, ServiceRoom>;
  }
): Reservation {
  const staff = context.staffNameMap.get(normalizeText(values.staffName || "")) ?? [...context.staffNameMap.values()].find((item) => normalizeText(item.fullName) === normalizeText(values.staffName || ""));
  const service = context.serviceNameMap.get(normalizeText(values.serviceName || ""));
  const room = context.roomNameMap.get(normalizeText(values.roomName || ""));

  return {
    id: makeLocalId("reservation"),
    date: normalizeText(values.date || ""),
    startTime: normalizeText(values.startTime || ""),
    endTime: normalizeText(values.endTime || ""),
    customerName: normalizeText(values.customerName || ""),
    phone: normalizeText(values.phone || ""),
    serviceMenuId: service?.id ?? "",
    staffId: staff?.id ?? "",
    roomId: room?.id ?? "",
    status: normalizeReservationStatus(values.status || ""),
    memo: normalizeText(values.memo || "")
  };
}

function downloadCsv(fileName: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildStaffNameMap(items: StaffMember[]) {
  return new Map(items.map((item) => [normalizeText(item.displayName), item]));
}

function buildStaffIdMap(items: StaffMember[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function buildServiceNameMap(items: ServiceMenu[]) {
  return new Map(items.map((item) => [normalizeText(item.name), item]));
}

function buildServiceIdMap(items: ServiceMenu[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function buildRoomNameMap(items: ServiceRoom[]) {
  return new Map(items.map((item) => [normalizeText(item.name), item]));
}

function buildRoomIdMap(items: ServiceRoom[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function previewValue(value: string | undefined) {
  return value && value.length > 0 ? value : "";
}

function combineText(values: string[], separator: string) {
  return values
    .map((value) => normalizeText(value))
    .filter((value) => value.length > 0)
    .join(separator);
}

function extractDatePart(value: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  const candidate = normalized.split(/[ T]/)[0].replace(/\//g, "-");
  return candidate.length >= 10 ? candidate.slice(0, 10) : candidate;
}

function buildPeakManagerDuplicateKey(value: {
  peakManagerCustomerId: string;
  membershipNumber: string;
  name: string;
  phone: string;
}) {
  if (value.peakManagerCustomerId) {
    return `id:${value.peakManagerCustomerId}`;
  }

  if (value.membershipNumber) {
    return `membership:${value.membershipNumber}`;
  }

  if (value.phone) {
    return `phone:${value.phone}`;
  }

  if (value.name && value.name !== "氏名未設定") {
    return `name:${value.name}`;
  }

  return "";
}

function duplicateExistsInCustomers(
  customers: Customer[],
  value: {
    peakManagerCustomerId: string;
    membershipNumber: string;
    name: string;
    phone: string;
  }
) {
  return customers.some((customer) => {
    if (value.peakManagerCustomerId && customer.peakManagerCustomerId === value.peakManagerCustomerId) {
      return true;
    }

    if (value.membershipNumber && customer.membershipNumber === value.membershipNumber) {
      return true;
    }

    if (value.phone && normalizeText(customer.phone) === value.phone) {
      return true;
    }

    return normalizeText(customer.name) === value.name && value.name !== "氏名未設定";
  });
}

function resolveServiceName(serviceId: string, map: Map<string, ServiceMenu>) {
  return map.get(serviceId)?.name ?? "";
}

function resolveStaffName(staffId: string, map: Map<string, StaffMember>) {
  return map.get(staffId)?.displayName ?? "";
}

function resolveRoomName(roomId: string, map: Map<string, ServiceRoom>) {
  return map.get(roomId)?.name ?? "";
}

function normalizeTags(value: string) {
  return value
    .split(/[,、\n]/)
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 0);
}

function parseCsvList(value: string) {
  return value
    .split(/[,、\n]/)
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 0);
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalized = normalizeText(value).toLowerCase();

  if (["true", "1", "yes", "y", "有効"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n", "無効"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parsePositiveInteger(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = normalizeText(value).replace(/,/g, "");
  if (normalized.length === 0) {
    return null;
  }

  const number = Number.parseInt(normalized, 10);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeCustomerGender(value: string): Customer["gender"] {
  const normalized = normalizeText(value).toLowerCase();

  if (normalized === "female" || normalized === "女性") {
    return "female";
  }

  if (normalized === "male" || normalized === "男性") {
    return "male";
  }

  if (normalized === "other" || normalized === "その他") {
    return "other";
  }

  return "unspecified";
}

function normalizeStaffRole(value: string): StaffRole {
  const normalized = normalizeText(value).toLowerCase();

  if (normalized === "owner") {
    return "owner";
  }

  if (normalized === "manager") {
    return "manager";
  }

  if (normalized === "therapist") {
    return "therapist";
  }

  return "reception";
}

function normalizeReservationStatus(value: string): ReservationStatus {
  const normalized = normalizeText(value).toLowerCase();

  if (normalized === "completed" || normalized === "完了") {
    return "completed";
  }

  if (normalized === "canceled" || normalized === "cancelled" || normalized === "キャンセル") {
    return "canceled";
  }

  return "booked";
}

function StatCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-luxas-line bg-white p-5">
      <p className="text-sm font-medium text-stone-600">{label}</p>
      <p className="mt-3 text-xl font-semibold text-luxas-ink">{value}</p>
    </div>
  );
}

function InfoTile({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-luxas-line bg-luxas-paper p-4">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-luxas-ink">{value}</p>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap border-b border-luxas-line px-3 py-2 text-left text-xs font-semibold text-stone-600">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="whitespace-nowrap px-3 py-2 align-top text-sm text-luxas-ink">{children}</td>;
}

function PreviewBadge({ status }: { status: PreviewStatus }) {
  const className =
    status === "ready"
      ? "bg-emerald-50 text-emerald-700"
      : status === "duplicate"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";
  const label =
    status === "ready" ? "取り込み可" : status === "duplicate" ? "重複" : "エラー";

  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>;
}
