"use client";

import { useState } from "react";
import { MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { useLocalCollection } from "@/features/master-data/local-storage";

type DataError = { id: string; title: string; occurredAt: string; category: string; detail: string };
const dataErrorsStorageKey = "luxas-data-errors";
const initialDataErrors: DataError[] = [
  { id: "de-001", title: "電話番号が重複している顧客があります", occurredAt: "2026-06-14 09:12", category: "顧客データ", detail: "同一電話番号の顧客が2件存在します。名寄せをご検討ください。" },
  { id: "de-002", title: "担当未設定の予約があります", occurredAt: "2026-06-15 08:40", category: "予約データ", detail: "本日の予約のうち、担当スタッフが未設定のものがあります。" }
];

export function DataErrorsManager() {
  const [errors] = useLocalCollection<DataError>(dataErrorsStorageKey, initialDataErrors);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const columns: MasterColumn<DataError>[] = [
    { key: "id", header: "ID", render: (i) => <span className="font-mono text-xs text-stone-400">{i.id.slice(0, 8)}</span> },
    { key: "title", header: "お知らせ・エラー", render: (i) => <span className="font-medium text-luxas-ink">{i.title}</span> },
    { key: "occurredAt", header: "発生日時", render: (i) => i.occurredAt },
    { key: "category", header: "分類", render: (i) => i.category }
  ];

  function renderDetail(item: DataError | null) {
    if (!item) return <p className="text-sm text-stone-500">左の一覧から選択してください。</p>;
    return (
      <div className="space-y-3 text-sm">
        <h2 className="text-base font-semibold text-luxas-ink">{item.title}</h2>
        <p className="text-stone-500">{item.category} / {item.occurredAt}</p>
        <p className="leading-6 text-stone-700">{item.detail}</p>
        <p className="text-[11px] text-stone-400">※ データ不備のお知らせ（v0.1 は表示のみ・自動修正は行いません）。</p>
      </div>
    );
  }

  return (
    <MasterPage title="データ不備のお知らせ" description="データの不整合・確認が必要な項目を一覧します（表示のみ）。">
      <MasterSplitPanel
        items={errors}
        columns={columns}
        searchKeys={["title", "category"]}
        selectedId={selectedId}
        onSelect={(item) => setSelectedId(item.id)}
        renderDetail={renderDetail}
        searchPlaceholder="お知らせ・分類で検索"
        emptyDetail="左の一覧から選択してください。"
      />
    </MasterPage>
  );
}
