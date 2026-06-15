"use client";

import { FormEvent, useMemo, useState } from "react";
import { Mail, Pencil, Plus, RotateCcw, Send, Trash2, Undo2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { customersStorageKey, initialCustomers } from "@/features/customers/mock-data";
import type { Customer, CustomerGender } from "@/features/customers/types";
import { customerGenderLabels } from "@/features/customers/types";
import {
  initialMailAutoRules,
  initialMailDeliveries,
  initialMailTemplates,
  mailAutoRulesStorageKey,
  mailDeliveriesStorageKey,
  mailTemplatesStorageKey
} from "@/features/mail/mock-data";
import {
  mailAutoTriggerLabels,
  mailTemplateKindLabels,
  type MailAutoRule,
  type MailAutoTrigger,
  type MailDelivery,
  type MailTemplate,
  type MailTemplateKind
} from "@/features/mail/types";

type Tab = "templates" | "broadcast" | "history" | "auto";

const TABS: { key: Tab; label: string }[] = [
  { key: "templates", label: "定型文設定" },
  { key: "broadcast", label: "一斉配信" },
  { key: "history", label: "配信履歴" },
  { key: "auto", label: "eDM / シンプルeDM設定" }
];

const TEMPLATE_KINDS: MailTemplateKind[] = ["broadcast", "edm", "reminder", "thanks", "other"];
const AUTO_TRIGGERS: MailAutoTrigger[] = ["after_visit", "birthday", "no_visit_days", "reservation_reminder"];

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

// 独立画面の表示種別（T056）。"all"=旧統合タブ（後方互換）。
export type MailView = "all" | "history" | "cancel" | "templates" | "edm" | "edm-simple";

const MAIL_VIEW_META: Record<Exclude<MailView, "all">, { title: string; description: string }> = {
  history: { title: "メール配信履歴", description: "配信済みメールの履歴を確認します（実送信なし・記録のみ）。" },
  cancel: { title: "メール配信一括停止", description: "配信予定/配信済みメールを取消します（記録のみ・実送信なし）。" },
  templates: { title: "メール定型文設定", description: "メールの定型文を管理します。" },
  edm: { title: "eDM設定", description: "自動配信（eDM・詳細設定）ルールを管理します（実行はモック）。" },
  "edm-simple": { title: "シンプルeDM設定", description: "誕生日お祝い等のシンプルな自動配信を設定します（実行はモック）。" }
};

export function MailManager({ view = "all" }: { view?: MailView }) {
  const [tab, setTab] = useState<Tab>("templates");
  const [templates, setTemplates] = useLocalCollection<MailTemplate>(mailTemplatesStorageKey, initialMailTemplates);
  const [deliveries, setDeliveries] = useLocalCollection<MailDelivery>(mailDeliveriesStorageKey, initialMailDeliveries);
  const [autoRules, setAutoRules] = useLocalCollection<MailAutoRule>(mailAutoRulesStorageKey, initialMailAutoRules);

  const title = view === "all" ? "メール管理" : MAIL_VIEW_META[view].title;
  const description =
    view === "all"
      ? "定型文・一斉配信・配信履歴・自動配信(eDM)の設定を行います。v0.1 は実送信なし・記録のみのモックです。"
      : MAIL_VIEW_META[view].description;

  return (
    <MasterPage title={title} description={description}>
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
        ※ v0.1 ではメールの実送信は行いません。配信・取消はローカルへの記録のみです（送信API・外部連携は未接続）。
      </div>

      {view === "all" ? (
        <div className="mb-4 inline-flex flex-wrap overflow-hidden rounded-md border border-luxas-line">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={[
                "px-3 py-2 text-sm font-medium transition",
                tab === t.key ? "bg-luxas-green text-white" : "bg-white text-stone-600 hover:bg-luxas-paper"
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      {view === "all" && tab === "templates" ? <TemplatesTab templates={templates} setTemplates={setTemplates} /> : null}
      {view === "all" && tab === "broadcast" ? (
        <BroadcastTab templates={templates} setDeliveries={setDeliveries} deliveries={deliveries} onSent={() => setTab("history")} />
      ) : null}
      {view === "all" && tab === "history" ? <HistoryTab deliveries={deliveries} setDeliveries={setDeliveries} /> : null}
      {view === "all" && tab === "auto" ? <AutoTab autoRules={autoRules} setAutoRules={setAutoRules} templates={templates} /> : null}

      {/* 独立画面（T056） */}
      {view === "history" ? (
        <div className="space-y-4">
          <BroadcastTab templates={templates} setDeliveries={setDeliveries} deliveries={deliveries} onSent={() => undefined} />
          <HistoryTab deliveries={deliveries} setDeliveries={setDeliveries} />
        </div>
      ) : null}
      {view === "cancel" ? <CancelTab deliveries={deliveries} setDeliveries={setDeliveries} /> : null}
      {view === "templates" ? <TemplatesTab templates={templates} setTemplates={setTemplates} /> : null}
      {view === "edm" ? <AutoTab autoRules={autoRules} setAutoRules={setAutoRules} templates={templates} mode="edm" /> : null}
      {view === "edm-simple" ? <AutoTab autoRules={autoRules} setAutoRules={setAutoRules} templates={templates} mode="simple" /> : null}
    </MasterPage>
  );
}

// メール配信一括停止（T056）。配信済み(sent)を取消(canceled)にする。記録のみ・実送信なし。
function CancelTab({
  deliveries,
  setDeliveries
}: {
  deliveries: MailDelivery[];
  setDeliveries: (updater: (current: MailDelivery[]) => MailDelivery[]) => void;
}) {
  const [query, setQuery] = useState("");
  const rows = deliveries
    .filter((d) => {
      const q = query.trim();
      if (!q) return true;
      return d.subject.includes(q) || d.templateName.includes(q);
    })
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));

  function cancel(id: string) {
    setDeliveries((current) => current.map((d) => (d.id === id ? { ...d, status: "canceled" } : d)));
  }

  return (
    <section className="rounded-lg border border-luxas-line bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-luxas-line px-4 py-3 text-sm">
        <input
          type="search"
          className="rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-luxas-green"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="タイトル・定型文で検索"
        />
        <span className="ml-auto text-stone-500">{rows.length}件</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">タイトル</th>
              <th className="px-4 py-3">配信予定/配信</th>
              <th className="px-4 py-3">状態</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxas-line">
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-500">対象の配信はありません。</td></tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-400">{d.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 font-medium text-luxas-ink">{d.subject}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-700">{formatDateTime(d.sentAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {d.status === "canceled" ? (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">取消済</span>
                    ) : (
                      <span className="rounded-full bg-luxas-mist px-2 py-0.5 text-[11px] font-medium text-luxas-green">配信済</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {d.status === "canceled" ? (
                      <span className="text-xs text-stone-400">—</span>
                    ) : (
                      <button type="button" className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50" onClick={() => cancel(d.id)}>取消</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// --- 定型文設定 ---
type TemplateForm = { name: string; subject: string; body: string; kind: MailTemplateKind; isActive: boolean };
const emptyTemplateForm: TemplateForm = { name: "", subject: "", body: "", kind: "broadcast", isActive: true };

function TemplatesTab({
  templates,
  setTemplates
}: {
  templates: MailTemplate[];
  setTemplates: (updater: (current: MailTemplate[]) => MailTemplate[]) => void;
}) {
  const [form, setForm] = useState<TemplateForm>(emptyTemplateForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  function reset() {
    setForm(emptyTemplateForm);
    setEditingId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBlank(form.name) || isBlank(form.subject)) {
      setMessage({ type: "error", text: "定型文名と件名を入力してください。" });
      return;
    }
    const payload = {
      name: normalizeText(form.name),
      subject: normalizeText(form.subject),
      body: form.body,
      kind: form.kind,
      isActive: form.isActive
    };
    if (editingId) {
      setTemplates((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "定型文を更新しました。" });
    } else {
      setTemplates((current) => [{ id: makeLocalId("mail-tpl"), ...payload }, ...current]);
      setMessage({ type: "success", text: "定型文を追加しました。" });
    }
    reset();
  }

  function handleEdit(item: MailTemplate) {
    setEditingId(item.id);
    setForm({ name: item.name, subject: item.subject, body: item.body, kind: item.kind, isActive: item.isActive });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setTemplates((current) => current.filter((item) => item.id !== id));
    if (editingId === id) reset();
    setMessage({ type: "success", text: "定型文を削除しました。" });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "定型文を編集" : "定型文を追加"}</h2>
          {editingId ? (
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={reset}>
              <RotateCcw size={14} aria-hidden="true" />
              解除
            </button>
          ) : null}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField label="定型文名" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: 新メニューのご案内" required />
          <SelectField label="種別" value={form.kind} onChange={(v) => setForm((c) => ({ ...c, kind: v as MailTemplateKind }))}>
            {TEMPLATE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {mailTemplateKindLabels[kind]}
              </option>
            ))}
          </SelectField>
          <TextField label="件名" value={form.subject} onChange={(v) => setForm((c) => ({ ...c, subject: v }))} placeholder="メールの件名" required />
          <label className="block">
            <span className="text-sm font-medium text-stone-700">本文</span>
            <textarea
              className="mt-2 min-h-32 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition placeholder:text-stone-400 focus:border-luxas-green"
              value={form.body}
              onChange={(event) => setForm((c) => ({ ...c, body: event.target.value }))}
              placeholder="本文（差し込みは未対応のモック）"
            />
          </label>
          <ToggleField label="有効にする" checked={form.isActive} onChange={(v) => setForm((c) => ({ ...c, isActive: v }))} />
          <StatusMessage message={message} />
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
            <Plus size={17} aria-hidden="true" />
            {editingId ? "更新する" : "追加する"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-luxas-line bg-white">
        <div className="border-b border-luxas-line px-5 py-4">
          <h2 className="text-base font-semibold text-luxas-ink">定型文一覧</h2>
          <p className="mt-1 text-sm text-stone-500">{templates.length}件</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
              <tr>
                <th className="px-5 py-3">定型文名</th>
                <th className="px-5 py-3">種別</th>
                <th className="px-5 py-3">件名</th>
                <th className="px-5 py-3">状態</th>
                <th className="px-5 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {templates.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{item.name}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-stone-700">{mailTemplateKindLabels[item.kind]}</td>
                  <td className="px-5 py-4 text-stone-700">{item.subject}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <ActiveBadge isActive={item.isActive} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <div className="inline-flex gap-2">
                      <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={() => handleEdit(item)}>
                        <Pencil size={14} aria-hidden="true" />
                        編集
                      </button>
                      <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={14} aria-hidden="true" />
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-stone-500">定型文がありません。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// --- 一斉配信（対象抽出 → モック配信） ---
function BroadcastTab({
  templates,
  deliveries,
  setDeliveries,
  onSent
}: {
  templates: MailTemplate[];
  deliveries: MailDelivery[];
  setDeliveries: (updater: (current: MailDelivery[]) => MailDelivery[]) => void;
  onSent: () => void;
}) {
  const [customers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const [templateId, setTemplateId] = useState<string>(templates[0]?.id ?? "");
  const [tagFilter, setTagFilter] = useState("");
  const [gender, setGender] = useState<CustomerGender | "">("");
  const [onlyWithEmail, setOnlyWithEmail] = useState(true);
  const [excludeDays, setExcludeDays] = useState("0");
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  const activeTemplates = useMemo(() => templates.filter((t) => t.isActive), [templates]);

  // 配信制限: excludeDays 日以内の（取消でない）配信に含まれた顧客IDを除外。
  const recentlyContacted = useMemo(() => {
    const days = Number(excludeDays) || 0;
    if (days <= 0) return new Set<string>();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const ids = new Set<string>();
    for (const delivery of deliveries) {
      if (delivery.status === "canceled") continue;
      if (new Date(delivery.sentAt).getTime() >= cutoff) {
        delivery.recipientIds.forEach((id) => ids.add(id));
      }
    }
    return ids;
  }, [deliveries, excludeDays]);

  const targets = useMemo(() => {
    const tag = tagFilter.trim().toLowerCase();
    return customers.filter((customer) => {
      if (!customer.isActive) return false;
      if (onlyWithEmail && isBlank(customer.email)) return false;
      if (gender && customer.gender !== gender) return false;
      if (tag && !customer.tags.some((t) => t.toLowerCase().includes(tag))) return false;
      if (recentlyContacted.has(customer.id)) return false;
      return true;
    });
  }, [customers, tagFilter, gender, onlyWithEmail, recentlyContacted]);

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;

  function handleSend() {
    if (!selectedTemplate) {
      setMessage({ type: "error", text: "定型文を選択してください。" });
      return;
    }
    if (targets.length === 0) {
      setMessage({ type: "error", text: "配信対象が0件です。条件を見直してください。" });
      return;
    }
    const delivery: MailDelivery = {
      id: makeLocalId("mail-delivery"),
      sentAt: new Date().toISOString(),
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      subject: selectedTemplate.subject,
      kind: selectedTemplate.kind,
      targetCount: targets.length,
      recipientIds: targets.map((c) => c.id),
      status: "sent",
      note: "モック配信（実送信なし）"
    };
    setDeliveries((current) => [delivery, ...current]);
    setMessage({ type: "success", text: `モック配信を記録しました（対象 ${targets.length}名）。実送信は行っていません。` });
    onSent();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-luxas-ink">配信設定</h2>
        <div className="space-y-4">
          <SelectField label="定型文" value={templateId} onChange={setTemplateId}>
            <option value="">選択してください</option>
            {activeTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}（{mailTemplateKindLabels[t.kind]}）
              </option>
            ))}
          </SelectField>
          <TextField label="タグで絞り込み" value={tagFilter} onChange={setTagFilter} placeholder="例: VIP" />
          <SelectField label="性別" value={gender} onChange={(v) => setGender(v as CustomerGender | "")}>
            <option value="">すべて</option>
            {(Object.entries(customerGenderLabels) as [CustomerGender, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <ToggleField label="メールアドレスがある顧客のみ" checked={onlyWithEmail} onChange={setOnlyWithEmail} />
          <TextField label="配信制限（◯日以内に配信済みを除外）" value={excludeDays} onChange={setExcludeDays} type="number" min="0" hint="0で制限なし" />
          <StatusMessage message={message} />
          <button type="button" onClick={handleSend} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
            <Send size={16} aria-hidden="true" />
            モック配信を記録（{targets.length}名）
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-luxas-line bg-white">
        <div className="flex items-center justify-between border-b border-luxas-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-luxas-ink">配信対象プレビュー</h2>
            <p className="mt-1 text-sm text-stone-500">{targets.length}名</p>
          </div>
          {selectedTemplate ? <span className="text-xs text-stone-500">件名: {selectedTemplate.subject}</span> : null}
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
              <tr>
                <th className="px-5 py-3">顧客名</th>
                <th className="px-5 py-3">メール</th>
                <th className="px-5 py-3">性別</th>
                <th className="px-5 py-3">タグ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {targets.map((customer) => (
                <tr key={customer.id}>
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-luxas-ink">{customer.name}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-stone-700">{customer.email || "—"}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-stone-700">{customerGenderLabels[customer.gender]}</td>
                  <td className="px-5 py-3 text-stone-600">{customer.tags.join("、") || "—"}</td>
                </tr>
              ))}
              {targets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-stone-500">条件に合う配信対象がいません。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// --- 配信履歴（取消） ---
function HistoryTab({
  deliveries,
  setDeliveries
}: {
  deliveries: MailDelivery[];
  setDeliveries: (updater: (current: MailDelivery[]) => MailDelivery[]) => void;
}) {
  const sorted = useMemo(
    () => [...deliveries].sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1)),
    [deliveries]
  );

  function cancelDelivery(id: string) {
    setDeliveries((current) => current.map((item) => (item.id === id ? { ...item, status: "canceled" } : item)));
  }

  return (
    <section className="rounded-lg border border-luxas-line bg-white">
      <div className="border-b border-luxas-line px-5 py-4">
        <h2 className="text-base font-semibold text-luxas-ink">配信履歴</h2>
        <p className="mt-1 text-sm text-stone-500">{deliveries.length}件（実送信なし・記録のみ）</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
            <tr>
              <th className="px-5 py-3">配信日時</th>
              <th className="px-5 py-3">定型文</th>
              <th className="px-5 py-3">種別</th>
              <th className="px-5 py-3 text-right">対象数</th>
              <th className="px-5 py-3">状態</th>
              <th className="px-5 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxas-line">
            {sorted.map((delivery) => (
              <tr key={delivery.id}>
                <td className="whitespace-nowrap px-5 py-4 text-stone-700">{formatDateTime(delivery.sentAt)}</td>
                <td className="px-5 py-4 font-medium text-luxas-ink">{delivery.templateName}</td>
                <td className="whitespace-nowrap px-5 py-4 text-stone-700">{mailTemplateKindLabels[delivery.kind]}</td>
                <td className="whitespace-nowrap px-5 py-4 text-right text-stone-700">{delivery.targetCount}名</td>
                <td className="whitespace-nowrap px-5 py-4">
                  {delivery.status === "sent" ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">配信済み</span>
                  ) : (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-500">取消</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-luxas-line disabled:text-stone-300"
                    onClick={() => cancelDelivery(delivery.id)}
                    disabled={delivery.status === "canceled"}
                  >
                    <Undo2 size={14} aria-hidden="true" />
                    配信取消
                  </button>
                </td>
              </tr>
            ))}
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-stone-500">
                  <Mail size={20} className="mx-auto mb-2 text-stone-300" aria-hidden="true" />
                  配信履歴がありません。「一斉配信」から記録できます。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// --- eDM / シンプルeDM設定 ---
type AutoForm = { name: string; trigger: MailAutoTrigger; templateId: string; targetNote: string; isSimple: boolean; isActive: boolean };
const emptyAutoForm: AutoForm = { name: "", trigger: "after_visit", templateId: "", targetNote: "", isSimple: true, isActive: false };

function AutoTab({
  autoRules,
  setAutoRules,
  templates,
  mode = "all"
}: {
  autoRules: MailAutoRule[];
  setAutoRules: (updater: (current: MailAutoRule[]) => MailAutoRule[]) => void;
  templates: MailTemplate[];
  mode?: "all" | "edm" | "simple";
}) {
  const initialForm: AutoForm = mode === "edm" ? { ...emptyAutoForm, isSimple: false } : { ...emptyAutoForm, isSimple: true };
  const [form, setForm] = useState<AutoForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const templateNameById = useMemo(() => new Map(templates.map((t) => [t.id, t.name])), [templates]);
  // mode に応じて一覧を絞り込む（eDM=詳細 / simple=簡易 / all=両方）。
  const shownRules = mode === "edm" ? autoRules.filter((r) => !r.isSimple) : mode === "simple" ? autoRules.filter((r) => r.isSimple) : autoRules;

  function reset() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBlank(form.name)) {
      setMessage({ type: "error", text: "ルール名を入力してください。" });
      return;
    }
    const payload = {
      name: normalizeText(form.name),
      trigger: form.trigger,
      templateId: form.templateId,
      targetNote: normalizeText(form.targetNote),
      isSimple: form.isSimple,
      isActive: form.isActive
    };
    if (editingId) {
      setAutoRules((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "自動配信ルールを更新しました（実行はモック）。" });
    } else {
      setAutoRules((current) => [{ id: makeLocalId("mail-rule"), ...payload }, ...current]);
      setMessage({ type: "success", text: "自動配信ルールを追加しました（実行はモック）。" });
    }
    reset();
  }

  function handleEdit(item: MailAutoRule) {
    setEditingId(item.id);
    setForm({ name: item.name, trigger: item.trigger, templateId: item.templateId, targetNote: item.targetNote, isSimple: item.isSimple, isActive: item.isActive });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setAutoRules((current) => current.filter((item) => item.id !== id));
    if (editingId === id) reset();
    setMessage({ type: "success", text: "ルールを削除しました。" });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="rounded-lg border border-luxas-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "ルールを編集" : "自動配信ルールを追加"}</h2>
          {editingId ? (
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={reset}>
              <RotateCcw size={14} aria-hidden="true" />
              解除
            </button>
          ) : null}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField label="ルール名" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: 誕生日クーポン" required />
          <SelectField label="種別" value={form.isSimple ? "simple" : "edm"} onChange={(v) => setForm((c) => ({ ...c, isSimple: v === "simple" }))}>
            <option value="simple">シンプルeDM（簡易設定）</option>
            <option value="edm">eDM（詳細設定）</option>
          </SelectField>
          <SelectField label="トリガー" value={form.trigger} onChange={(v) => setForm((c) => ({ ...c, trigger: v as MailAutoTrigger }))}>
            {AUTO_TRIGGERS.map((trigger) => (
              <option key={trigger} value={trigger}>
                {mailAutoTriggerLabels[trigger]}
              </option>
            ))}
          </SelectField>
          <SelectField label="定型文" value={form.templateId} onChange={(v) => setForm((c) => ({ ...c, templateId: v }))}>
            <option value="">未選択</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </SelectField>
          <TextField label="対象メモ" value={form.targetNote} onChange={(v) => setForm((c) => ({ ...c, targetNote: v }))} placeholder="例: 来店から30日経過した顧客" />
          <ToggleField label="有効にする（実行はモック）" checked={form.isActive} onChange={(v) => setForm((c) => ({ ...c, isActive: v }))} />
          <StatusMessage message={message} />
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
            <Plus size={17} aria-hidden="true" />
            {editingId ? "更新する" : "追加する"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-luxas-line bg-white">
        <div className="border-b border-luxas-line px-5 py-4">
          <h2 className="text-base font-semibold text-luxas-ink">自動配信ルール一覧</h2>
          <p className="mt-1 text-sm text-stone-500">{shownRules.length}件（実行はモック・自動送信なし）</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
              <tr>
                <th className="px-5 py-3">ルール名</th>
                <th className="px-5 py-3">種別</th>
                <th className="px-5 py-3">トリガー</th>
                <th className="px-5 py-3">定型文</th>
                <th className="px-5 py-3">状態</th>
                <th className="px-5 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {shownRules.map((rule) => (
                <tr key={rule.id}>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{rule.name}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-stone-700">{rule.isSimple ? "シンプルeDM" : "eDM"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-stone-700">{mailAutoTriggerLabels[rule.trigger]}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-stone-700">{templateNameById.get(rule.templateId) ?? "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <ActiveBadge isActive={rule.isActive} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <div className="inline-flex gap-2">
                      <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={() => handleEdit(rule)}>
                        <Pencil size={14} aria-hidden="true" />
                        編集
                      </button>
                      <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" onClick={() => handleDelete(rule.id)}>
                        <Trash2 size={14} aria-hidden="true" />
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {shownRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-stone-500">ルールがありません。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
