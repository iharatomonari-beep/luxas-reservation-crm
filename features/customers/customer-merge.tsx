"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Users, AlertTriangle, RotateCcw } from "lucide-react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { backendFor } from "@/features/master-data/migration-config";
import {
  isOwner,
  isRpcMissingError,
  mergeCustomersViaRpc,
  unmergeCustomersViaRpc
} from "@/features/master-data/remote-collection";
import { customersStorageKey, initialCustomers } from "@/features/customers/mock-data";
import type { Customer } from "@/features/customers/types";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";

type MatchKind = "phone" | "email" | "name";

const matchKindLabel: Record<MatchKind, string> = {
  phone: "電話番号が一致",
  email: "メールが一致",
  name: "氏名・カナが一致"
};

function normalizePhone(value: string | undefined): string {
  return (value ?? "").replace(/[^0-9]/g, "");
}
function normalizeEmail(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}
function normalizeName(customer: Customer): string {
  const name = (customer.name ?? "").replace(/\s/g, "");
  const kana = (customer.nameKana ?? "").replace(/\s/g, "");
  return name || kana ? `${name}|${kana}` : "";
}

type DuplicateGroup = {
  id: string;
  kind: MatchKind;
  keyLabel: string;
  members: Customer[];
};

// 重複検出: 統合済み(mergedInto あり)は除外。電話/メール/氏名カナ ごとにグルーピングし、2件以上を重複候補に。
// 同一メンバー集合のグループは重複表示しない（電話→メール→氏名の優先で最初の1つだけ残す）。
function buildDuplicateGroups(customers: Customer[]): DuplicateGroup[] {
  const pool = customers.filter((c) => !c.mergedInto);
  const groups: DuplicateGroup[] = [];
  const seenSignatures = new Set<string>();

  const detectors: { kind: MatchKind; keyOf: (c: Customer) => string }[] = [
    { kind: "phone", keyOf: (c) => normalizePhone(c.phone) },
    { kind: "email", keyOf: (c) => normalizeEmail(c.email) },
    { kind: "name", keyOf: normalizeName }
  ];

  for (const detector of detectors) {
    const byKey = new Map<string, Customer[]>();
    for (const customer of pool) {
      const key = detector.keyOf(customer);
      if (!key) continue;
      const list = byKey.get(key) ?? [];
      list.push(customer);
      byKey.set(key, list);
    }
    for (const [key, members] of byKey) {
      if (members.length < 2) continue;
      const signature = members
        .map((m) => m.id)
        .sort()
        .join(",");
      if (seenSignatures.has(signature)) continue;
      seenSignatures.add(signature);
      groups.push({
        id: `${detector.kind}:${key}`,
        kind: detector.kind,
        keyLabel: key,
        members
      });
    }
  }
  return groups;
}

function customerLine(customer: Customer): string {
  const parts = [customer.name || "(無名)"];
  if (customer.phone) parts.push(customer.phone);
  if (customer.email) parts.push(customer.email);
  if (customer.membershipNumber) parts.push(`会員${customer.membershipNumber}`);
  return parts.join(" / ");
}

export function CustomerMerge() {
  const [customers, setCustomers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const mode = backendFor(customersStorageKey);

  // owner 判定（supabase時のみ意味を持つ。local/未ログインは操作可＝架空データ運用）。
  const [owner, setOwner] = useState<boolean | null>(mode === "supabase" ? null : true);
  useEffect(() => {
    if (mode !== "supabase") return;
    let cancelled = false;
    isOwner()
      .then((value) => {
        if (!cancelled) setOwner(value);
      })
      .catch(() => {
        if (!cancelled) setOwner(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const [busyGroupId, setBusyGroupId] = useState<string | null>(null);
  // グループごとの主(primary)選択。未選択は各グループの先頭。
  const [primaryByGroup, setPrimaryByGroup] = useState<Record<string, string>>({});
  // グループごとの「統合する重複」の選択（既定: 主以外すべて）。
  const [pickedByGroup, setPickedByGroup] = useState<Record<string, string[]>>({});

  const groups = useMemo(() => buildDuplicateGroups(customers), [customers]);
  const mergedCustomers = useMemo(
    () => customers.filter((c) => Boolean(c.mergedInto)),
    [customers]
  );

  function primaryOf(group: DuplicateGroup): string {
    return primaryByGroup[group.id] ?? group.members[0].id;
  }
  function pickedOf(group: DuplicateGroup): string[] {
    const primary = primaryOf(group);
    const fallback = group.members.map((m) => m.id).filter((id) => id !== primary);
    return pickedByGroup[group.id] ?? fallback;
  }

  const ownerBlocked = mode === "supabase" && owner === false;

  async function runMerge(group: DuplicateGroup) {
    const primary = primaryOf(group);
    const duplicates = pickedOf(group).filter((id) => id !== primary);
    if (duplicates.length === 0) {
      setMessage({ type: "error", text: "統合する重複を1件以上選んでください。" });
      return;
    }
    if (ownerBlocked) {
      setMessage({ type: "error", text: "顧客のマージは owner のみ実行できます。" });
      return;
    }

    setBusyGroupId(group.id);
    setMessage(null);
    try {
      if (mode === "supabase") {
        const count = await mergeCustomersViaRpc(primary, duplicates, reason.trim());
        // 楽観反映（サーバーは確定済み。merged_into_legacy はサーバー所有で toRow が書かないため安全）。
        setCustomers((prev) =>
          prev.map((c) => (duplicates.includes(c.id) ? { ...c, mergedInto: primary, isActive: false } : c))
        );
        setMessage({ type: "success", text: `${count}件を統合しました（復元可能）。` });
      } else {
        setCustomers((prev) =>
          prev.map((c) => (duplicates.includes(c.id) ? { ...c, mergedInto: primary, isActive: false } : c))
        );
        setMessage({ type: "success", text: `${duplicates.length}件を統合しました（架空データ・復元可能）。` });
      }
    } catch (error) {
      if (isRpcMissingError(error)) {
        setMessage({
          type: "error",
          text: "マージ用のサーバー関数が未適用です。supabase/phase4-customer-merge.sql を Supabase で実行してください。"
        });
      } else {
        const detail = (error as { message?: string })?.message ?? "";
        setMessage({ type: "error", text: `統合に失敗しました。${detail}` });
      }
    } finally {
      setBusyGroupId(null);
    }
  }

  async function runUnmerge(customer: Customer) {
    if (ownerBlocked) {
      setMessage({ type: "error", text: "復元は owner のみ実行できます。" });
      return;
    }
    setBusyGroupId(`unmerge:${customer.id}`);
    setMessage(null);
    try {
      if (mode === "supabase") {
        const count = await unmergeCustomersViaRpc([customer.id]);
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, mergedInto: undefined, isActive: true } : c))
        );
        setMessage({ type: "success", text: `${count}件を復元しました。` });
      } else {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, mergedInto: undefined, isActive: true } : c))
        );
        setMessage({ type: "success", text: "復元しました（架空データ）。" });
      }
    } catch (error) {
      if (isRpcMissingError(error)) {
        setMessage({
          type: "error",
          text: "復元用のサーバー関数が未適用です。supabase/phase4-customer-merge.sql を Supabase で実行してください。"
        });
      } else {
        const detail = (error as { message?: string })?.message ?? "";
        setMessage({ type: "error", text: `復元に失敗しました。${detail}` });
      }
    } finally {
      setBusyGroupId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-2 border-b border-luxas-line pb-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-luxas-green">Customers / Merge</p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-luxas-ink">
            <Users size={20} aria-hidden="true" />
            顧客マージ（重複統合）
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-stone-600">
            電話番号・メール・氏名（カナ）の一致で重複候補を検出し、主の顧客へ統合します。統合は削除ではなく
            「統合済み」の印を付けるだけで、いつでも復元できます。
          </p>
        </div>
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-luxas-line bg-white px-3.5 py-2 text-sm font-semibold text-luxas-ink transition hover:bg-luxas-paper"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          顧客管理へ戻る
        </Link>
      </section>

      {/* 運用ゲートの注意（実顧客の実マージは #6/#8 完了後）。 */}
      <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          実顧客の実マージは、バックアップ有効化（#6）と個人情報の専門家確認（#8）が完了してから行ってください。
          それまでは架空データでの動作確認に留めます。
          {mode === "supabase" && owner === false && "（現在のアカウントは owner ではないため実行できません）"}
        </span>
      </div>

      <StatusMessage message={message} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-stone-700">統合理由（任意・監査に記録）:</label>
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="例: 同一人物の二重登録"
            className="min-w-64 flex-1 rounded-md border border-luxas-line bg-white px-3 py-1.5 text-sm text-luxas-ink outline-none transition focus:border-luxas-green"
          />
        </div>

        <h2 className="text-sm font-semibold text-luxas-ink">重複候補 {groups.length} 件</h2>
        {groups.length === 0 ? (
          <p className="rounded-md border border-luxas-line bg-luxas-paper px-3 py-4 text-sm text-stone-500">
            重複候補は見つかりませんでした。
          </p>
        ) : (
          groups.map((group) => {
            const primary = primaryOf(group);
            const picked = pickedOf(group);
            const busy = busyGroupId === group.id;
            return (
              <div key={group.id} className="rounded-lg border border-luxas-line bg-white p-3">
                <p className="mb-2 text-xs font-medium text-stone-500">
                  {matchKindLabel[group.kind]}: <span className="text-stone-700">{group.keyLabel}</span>
                </p>
                <div className="space-y-1.5">
                  {group.members.map((member) => {
                    const isPrimary = member.id === primary;
                    const isPicked = picked.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        className="flex flex-wrap items-center gap-3 rounded-md border border-luxas-line/70 px-2.5 py-1.5 text-sm"
                      >
                        <label className="flex items-center gap-1.5 text-stone-700">
                          <input
                            type="radio"
                            name={`primary-${group.id}`}
                            checked={isPrimary}
                            onChange={() => {
                              setPrimaryByGroup((prev) => ({ ...prev, [group.id]: member.id }));
                              // 主に選んだ人は統合対象から外す。
                              setPickedByGroup((prev) => ({
                                ...prev,
                                [group.id]: group.members.map((m) => m.id).filter((id) => id !== member.id)
                              }));
                            }}
                          />
                          主にする
                        </label>
                        <label
                          className={[
                            "flex items-center gap-1.5",
                            isPrimary ? "text-stone-300" : "text-stone-700"
                          ].join(" ")}
                        >
                          <input
                            type="checkbox"
                            disabled={isPrimary}
                            checked={!isPrimary && isPicked}
                            onChange={(event) => {
                              setPickedByGroup((prev) => {
                                const current = prev[group.id] ?? picked;
                                const next = event.target.checked
                                  ? [...new Set([...current, member.id])]
                                  : current.filter((id) => id !== member.id);
                                return { ...prev, [group.id]: next };
                              });
                            }}
                          />
                          統合する
                        </label>
                        <span className="flex-1 text-stone-600">{customerLine(member)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={busy || ownerBlocked}
                    onClick={() => runMerge(group)}
                    className="rounded-md bg-luxas-green px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#285f51] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "統合中…" : "この重複を統合"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {mergedCustomers.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-luxas-ink">統合済み {mergedCustomers.length} 件（復元可）</h2>
          <div className="space-y-1.5">
            {mergedCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-luxas-line bg-luxas-paper px-2.5 py-1.5 text-sm"
              >
                <span className="flex-1 text-stone-600">
                  {customerLine(customer)} → 主: {customer.mergedInto}
                </span>
                <button
                  type="button"
                  disabled={busyGroupId === `unmerge:${customer.id}` || ownerBlocked}
                  onClick={() => runUnmerge(customer)}
                  className="inline-flex items-center gap-1 rounded-md border border-luxas-line bg-white px-2.5 py-1 text-xs font-medium text-stone-700 transition hover:bg-luxas-mist disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  復元
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
