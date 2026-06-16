"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { formatTimestamp, stampCreate, stampUpdate } from "@/features/master-data/timestamps";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  areasStorageKey,
  initialAreas,
  initialStores,
  initialTenants,
  storesStorageKey,
  tenantsStorageKey
} from "@/features/org/mock-data";
import type { Area, Store, Tenant } from "@/features/org/types";

type OrgTab = "tenant" | "area" | "store";
const TABS: { key: OrgTab; label: string }[] = [
  { key: "tenant", label: "テナント" },
  { key: "area", label: "エリア" },
  { key: "store", label: "店舗" }
];

export function OrgAdmin() {
  const [tab, setTab] = useState<OrgTab>("tenant");
  const [tenants, setTenants] = useLocalCollection<Tenant>(tenantsStorageKey, initialTenants);
  const [areas, setAreas] = useLocalCollection<Area>(areasStorageKey, initialAreas);
  const [stores, setStores] = useLocalCollection<Store>(storesStorageKey, initialStores);

  return (
    <MasterPage title="組織管理" description="テナント（契約法人）→ エリア → 店舗 の階層を管理します。この段階では既存の予約/顧客/会計データは絞り込みません（非破壊）。">
      <div className="mb-4 inline-flex flex-wrap overflow-hidden rounded-md border border-luxas-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={["px-3 py-2 text-sm font-medium transition", tab === t.key ? "bg-luxas-green text-white" : "bg-white text-stone-600 hover:bg-luxas-paper"].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tenant" ? <TenantPanel tenants={tenants} setTenants={setTenants} /> : null}
      {tab === "area" ? <AreaPanel areas={areas} setAreas={setAreas} tenants={tenants} /> : null}
      {tab === "store" ? <StorePanel stores={stores} setStores={setStores} tenants={tenants} areas={areas} /> : null}
    </MasterPage>
  );
}

function DetailHeader({ editingId, title, onReset }: { editingId: string | null; title: string; onReset: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-luxas-ink">{title}</h2>
      {editingId !== null ? (
        <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={onReset}>
          <RotateCcw size={14} aria-hidden="true" />閉じる
        </button>
      ) : null}
    </div>
  );
}

function SaveDeleteRow({ editingId, onDelete, deleteLabel = "削除" }: { editingId: string | null; onDelete: () => void; deleteLabel?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
        <Plus size={17} aria-hidden="true" />{editingId ? "更新する" : "追加する"}
      </button>
      {editingId ? (
        <button type="button" className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-3 py-3 text-sm font-medium text-amber-800 hover:bg-amber-50" onClick={onDelete}>
          <Trash2 size={15} aria-hidden="true" />{deleteLabel}
        </button>
      ) : null}
    </div>
  );
}

// --- テナント ---
type TenantForm = { name: string; code: string; plan: string; sortOrder: string; isActive: boolean };
const emptyTenantForm: TenantForm = { name: "", code: "", plan: "", sortOrder: "10", isActive: true };

function TenantPanel({ tenants, setTenants }: { tenants: Tenant[]; setTenants: (u: (c: Tenant[]) => Tenant[]) => void }) {
  const [form, setForm] = useState<TenantForm>(emptyTenantForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const sorted = useMemo(() => [...tenants].sort(compareBySortOrder), [tenants]);

  function reset() { setForm(emptyTenantForm); setEditingId(null); }
  function startCreate() { setForm(emptyTenantForm); setEditingId(""); setMessage(null); }
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isBlank(form.name)) { setMessage({ type: "error", text: "テナント名を入力してください。" }); return; }
    const payload = { name: normalizeText(form.name), code: normalizeText(form.code), plan: normalizeText(form.plan), sortOrder: Number(form.sortOrder) || 0, isActive: form.isActive };
    if (editingId) {
      setTenants((c) => c.map((i) => (i.id === editingId ? { ...i, ...payload } : i)));
      setMessage({ type: "success", text: "テナントを更新しました。" });
    } else {
      setTenants((c) => [{ id: makeLocalId("tenant"), ...payload }, ...c]);
      setMessage({ type: "success", text: "テナントを追加しました。" });
    }
    reset();
  }
  function handleEdit(i: Tenant) {
    setEditingId(i.id);
    setForm({ name: i.name, code: i.code ?? "", plan: i.plan ?? "", sortOrder: String(i.sortOrder ?? 0), isActive: i.isActive });
    setMessage(null);
  }
  function handleDelete(id: string) { setTenants((c) => c.filter((i) => i.id !== id)); if (editingId === id) reset(); setMessage({ type: "success", text: "テナントを削除しました。" }); }

  const columns: MasterColumn<Tenant>[] = [
    { key: "id", header: "ID", render: (i) => <span className="font-mono text-xs text-stone-400">{i.id.slice(0, 10)}</span> },
    { key: "name", header: "テナント名", render: (i) => <span className="font-medium text-luxas-ink">{i.name}</span> },
    { key: "plan", header: "プラン", render: (i) => i.plan || "—" },
    { key: "status", header: "状態", render: (i) => <ActiveBadge isActive={i.isActive} /> }
  ];

  return (
    <MasterSplitPanel
      items={sorted}
      columns={columns}
      searchKeys={["name", "code"]}
      selectedId={editingId}
      onSelect={handleEdit}
      onCreate={startCreate}
      searchPlaceholder="テナント名で検索"
      renderDetail={() => (
        <div>
          <DetailHeader editingId={editingId} title={editingId ? "テナントを編集" : "テナントを追加"} onReset={reset} />
          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField label="テナント名" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: 株式会社東邦" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="管理コード" value={form.code} onChange={(v) => setForm((c) => ({ ...c, code: v }))} />
              <TextField label="プラン" value={form.plan} onChange={(v) => setForm((c) => ({ ...c, plan: v }))} placeholder="例: standard" />
            </div>
            <TextField label="表示順" type="number" min="0" value={form.sortOrder} onChange={(v) => setForm((c) => ({ ...c, sortOrder: v }))} />
            <ToggleField label="有効にする" checked={form.isActive} onChange={(v) => setForm((c) => ({ ...c, isActive: v }))} />
            <StatusMessage message={message} />
            <SaveDeleteRow editingId={editingId} onDelete={() => editingId && handleDelete(editingId)} />
          </form>
        </div>
      )}
    />
  );
}

// --- エリア ---
type AreaForm = { tenantId: string; name: string; code: string; sortOrder: string; isActive: boolean };
const emptyAreaForm: AreaForm = { tenantId: "", name: "", code: "", sortOrder: "10", isActive: true };

function AreaPanel({ areas, setAreas, tenants }: { areas: Area[]; setAreas: (u: (c: Area[]) => Area[]) => void; tenants: Tenant[] }) {
  const [form, setForm] = useState<AreaForm>(emptyAreaForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const sorted = useMemo(() => [...areas].sort(compareBySortOrder), [areas]);
  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.name ?? "—";

  function reset() { setForm(emptyAreaForm); setEditingId(null); }
  function startCreate() { setForm({ ...emptyAreaForm, tenantId: tenants[0]?.id ?? "" }); setEditingId(""); setMessage(null); }
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isBlank(form.name)) { setMessage({ type: "error", text: "エリア名を入力してください。" }); return; }
    if (!form.tenantId) { setMessage({ type: "error", text: "所属テナントを選択してください。" }); return; }
    const payload = { tenantId: form.tenantId, name: normalizeText(form.name), code: normalizeText(form.code), sortOrder: Number(form.sortOrder) || 0, isActive: form.isActive };
    if (editingId) {
      setAreas((c) => c.map((i) => (i.id === editingId ? { ...i, ...payload } : i)));
      setMessage({ type: "success", text: "エリアを更新しました。" });
    } else {
      setAreas((c) => [{ id: makeLocalId("area"), ...payload }, ...c]);
      setMessage({ type: "success", text: "エリアを追加しました。" });
    }
    reset();
  }
  function handleEdit(i: Area) {
    setEditingId(i.id);
    setForm({ tenantId: i.tenantId, name: i.name, code: i.code ?? "", sortOrder: String(i.sortOrder ?? 0), isActive: i.isActive });
    setMessage(null);
  }
  function handleDelete(id: string) { setAreas((c) => c.filter((i) => i.id !== id)); if (editingId === id) reset(); setMessage({ type: "success", text: "エリアを削除しました。" }); }

  const columns: MasterColumn<Area>[] = [
    { key: "id", header: "ID", render: (i) => <span className="font-mono text-xs text-stone-400">{i.id.slice(0, 10)}</span> },
    { key: "name", header: "エリア名", render: (i) => <span className="font-medium text-luxas-ink">{i.name}</span> },
    { key: "tenant", header: "テナント", render: (i) => tenantName(i.tenantId) },
    { key: "status", header: "状態", render: (i) => <ActiveBadge isActive={i.isActive} /> }
  ];

  return (
    <MasterSplitPanel
      items={sorted}
      columns={columns}
      searchKeys={["name", "code"]}
      selectedId={editingId}
      onSelect={handleEdit}
      onCreate={startCreate}
      searchPlaceholder="エリア名で検索"
      renderDetail={() => (
        <div>
          <DetailHeader editingId={editingId} title={editingId ? "エリアを編集" : "エリアを追加"} onReset={reset} />
          <form className="space-y-4" onSubmit={handleSubmit}>
            <SelectField label="所属テナント" value={form.tenantId} onChange={(v) => setForm((c) => ({ ...c, tenantId: v }))}>
              <option value="">選択してください</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </SelectField>
            <TextField label="エリア名" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: 東京" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="管理コード" value={form.code} onChange={(v) => setForm((c) => ({ ...c, code: v }))} />
              <TextField label="表示順" type="number" min="0" value={form.sortOrder} onChange={(v) => setForm((c) => ({ ...c, sortOrder: v }))} />
            </div>
            <ToggleField label="有効にする" checked={form.isActive} onChange={(v) => setForm((c) => ({ ...c, isActive: v }))} />
            <StatusMessage message={message} />
            <SaveDeleteRow editingId={editingId} onDelete={() => editingId && handleDelete(editingId)} />
          </form>
        </div>
      )}
    />
  );
}

// --- 店舗 ---
type StoreForm = { tenantId: string; areaId: string; name: string; code: string; sortOrder: string; isActive: boolean };
const emptyStoreForm: StoreForm = { tenantId: "", areaId: "", name: "", code: "", sortOrder: "10", isActive: true };

function StorePanel({ stores, setStores, tenants, areas }: { stores: Store[]; setStores: (u: (c: Store[]) => Store[]) => void; tenants: Tenant[]; areas: Area[] }) {
  const [form, setForm] = useState<StoreForm>(emptyStoreForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const sorted = useMemo(() => [...stores].sort(compareBySortOrder), [stores]);
  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.name ?? "—";
  const areaName = (id: string) => areas.find((a) => a.id === id)?.name ?? "—";
  const areaOptions = areas.filter((a) => !form.tenantId || a.tenantId === form.tenantId);

  function reset() { setForm(emptyStoreForm); setEditingId(null); }
  function startCreate() {
    const t = tenants[0]?.id ?? "";
    setForm({ ...emptyStoreForm, tenantId: t, areaId: areas.find((a) => a.tenantId === t)?.id ?? "" });
    setEditingId(""); setMessage(null);
  }
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isBlank(form.name)) { setMessage({ type: "error", text: "店舗名を入力してください。" }); return; }
    if (!form.tenantId || !form.areaId) { setMessage({ type: "error", text: "所属テナント・エリアを選択してください。" }); return; }
    const payload = { tenantId: form.tenantId, areaId: form.areaId, name: normalizeText(form.name), code: normalizeText(form.code), sortOrder: Number(form.sortOrder) || 0, isActive: form.isActive };
    if (editingId) {
      setStores((c) => c.map((i) => (i.id === editingId ? { ...i, ...stampUpdate(payload, i) } : i)));
      setMessage({ type: "success", text: "店舗を更新しました。" });
    } else {
      setStores((c) => [{ id: makeLocalId("store"), ...stampCreate(payload) }, ...c]);
      setMessage({ type: "success", text: "店舗を追加しました。" });
    }
    reset();
  }
  function handleEdit(i: Store) {
    setEditingId(i.id);
    setForm({ tenantId: i.tenantId, areaId: i.areaId, name: i.name, code: i.code ?? "", sortOrder: String(i.sortOrder ?? 0), isActive: i.isActive });
    setMessage(null);
  }
  // 店舗は物理削除しない（履歴・現在店舗参照のためデータは残す）。無効化＝isActive=false。
  function handleDeactivate(id: string) {
    setStores((c) => c.map((i) => (i.id === id ? { ...i, ...stampUpdate({ ...i, isActive: false }, i) } : i)));
    setForm((current) => ({ ...current, isActive: false }));
    setMessage({ type: "success", text: "店舗を「無効化（表示しない）」にしました。" });
  }

  const columns: MasterColumn<Store>[] = [
    { key: "id", header: "ID", render: (i) => <span className="font-mono text-xs text-stone-400">{i.id.slice(0, 10)}</span> },
    { key: "name", header: "店舗名", render: (i) => <span className="font-medium text-luxas-ink">{i.name}</span> },
    { key: "area", header: "エリア", render: (i) => areaName(i.areaId) },
    { key: "tenant", header: "テナント", render: (i) => tenantName(i.tenantId) },
    { key: "status", header: "状態", render: (i) => <ActiveBadge isActive={i.isActive} /> }
  ];

  return (
    <MasterSplitPanel
      items={sorted}
      columns={columns}
      searchKeys={["name", "code"]}
      selectedId={editingId}
      onSelect={handleEdit}
      onCreate={startCreate}
      searchPlaceholder="店舗名で検索"
      renderDetail={() => (
        <div>
          <DetailHeader editingId={editingId} title={editingId ? "店舗を編集" : "店舗を追加"} onReset={reset} />
          {editingId ? (
            (() => {
              const editing = stores.find((s) => s.id === editingId);
              return editing ? (
                <p className="mb-3 text-[11px] text-stone-400">作成日: {formatTimestamp(editing.createdAt)} ／ 最終更新日: {formatTimestamp(editing.updatedAt)}</p>
              ) : null;
            })()
          ) : null}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <SelectField label="所属テナント" value={form.tenantId} onChange={(v) => setForm((c) => ({ ...c, tenantId: v, areaId: "" }))}>
              <option value="">選択してください</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </SelectField>
            <SelectField label="所属エリア" value={form.areaId} onChange={(v) => setForm((c) => ({ ...c, areaId: v }))}>
              <option value="">選択してください</option>
              {areaOptions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </SelectField>
            <TextField label="店舗名" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: LUXAS渋谷" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="管理コード" value={form.code} onChange={(v) => setForm((c) => ({ ...c, code: v }))} />
              <TextField label="表示順" type="number" min="0" value={form.sortOrder} onChange={(v) => setForm((c) => ({ ...c, sortOrder: v }))} />
            </div>
            <ToggleField label="有効にする" checked={form.isActive} onChange={(v) => setForm((c) => ({ ...c, isActive: v }))} />
            <StatusMessage message={message} />
            <SaveDeleteRow editingId={editingId} onDelete={() => editingId && handleDeactivate(editingId)} deleteLabel="無効化（表示しない）" />
          </form>
        </div>
      )}
    />
  );
}
