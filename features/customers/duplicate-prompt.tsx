"use client";

import { AlertTriangle } from "lucide-react";
import type { Customer } from "@/features/customers/types";
import { duplicateMatchKindLabel, type DuplicateMatch } from "@/features/customers/duplicate-detection";

// ⑤ 「同一人物では？」確認ポップ（PM流）。重複候補があるときに必ず表示し、
// 「既存の顧客に紐付ける（新規を作らない）」か「別人として新規」かを選んでもらう。
type DuplicateCustomerPromptProps = {
  candidates: DuplicateMatch[];
  // 入力された氏名（見出しの確認用）。
  enteredName?: string;
  // 新規作成の代わりに既存顧客を使う。
  onUseExisting: (customer: Customer) => void;
  // 別人として新規作成を続行。
  onCreateNew: () => void;
  // 取りやめ（保存しない）。
  onCancel: () => void;
  // 既存顧客を使うときのボタン文言（受付＝「紐付ける」/登録＝「この顧客を開く」など）。
  useExistingLabel?: string;
};

function line(customer: Customer): string {
  const parts: string[] = [customer.name || "(無名)"];
  if (customer.nameKana) parts.push(customer.nameKana);
  if (customer.phone) parts.push(customer.phone);
  if (customer.email) parts.push(customer.email);
  if (customer.membershipNumber) parts.push(`会員${customer.membershipNumber}`);
  return parts.join(" / ");
}

export function DuplicateCustomerPrompt({
  candidates,
  enteredName,
  onUseExisting,
  onCreateNew,
  onCancel,
  useExistingLabel = "この顧客に紐付ける"
}: DuplicateCustomerPromptProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-lg border border-luxas-line bg-white p-5 shadow-xl">
        <div className="flex items-start gap-2">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-luxas-ink">同一人物ではありませんか？</h2>
            <p className="mt-1 text-sm text-stone-600">
              {enteredName ? `「${enteredName}」さんは、` : ""}
              電話番号・氏名・メールが一致する既存の顧客が見つかりました。同じ方なら、新規に作らず既存の顧客をお使いください。
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {candidates.map(({ customer, kinds }) => (
            <div
              key={customer.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-luxas-line bg-luxas-paper px-3 py-2 text-sm"
            >
              <span className="flex-1 text-stone-700">{line(customer)}</span>
              <span className="text-[11px] text-stone-500">
                一致: {kinds.map((k) => duplicateMatchKindLabel[k]).join("・")}
              </span>
              <button
                type="button"
                onClick={() => onUseExisting(customer)}
                className="rounded-md bg-luxas-green px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#285f51]"
              >
                {useExistingLabel}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-luxas-line pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-luxas-line bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-luxas-paper"
          >
            やめる
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            別人として新規登録
          </button>
        </div>
      </div>
    </div>
  );
}
