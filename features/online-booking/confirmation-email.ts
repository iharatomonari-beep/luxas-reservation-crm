// 予約の確認/キャンセルメール本文を組み立てる共通ヘルパー（モック・実送信なし）。
// 予約完了画面（online-booking-page）とマイページのキャンセル通知で同一フォーマットを使う。

export type MockReservationEmail = { subject: string; lines: string[] };

export type ReservationEmailInput = {
  storeName: string;
  receiptNo?: string;
  menuName?: string;
  dateTimeLabel: string; // 例: "2026-06-22 12:30〜13:30"
  staffName?: string;
  customerName?: string;
};

// kind="confirm"=ご予約確認 / "cancel"=キャンセル確認。
export function buildReservationEmail(kind: "confirm" | "cancel", p: ReservationEmailInput): MockReservationEmail {
  const head = kind === "confirm" ? "【ご予約確認】" : "【予約キャンセル】";
  const greeting =
    kind === "confirm"
      ? "ご予約ありがとうございます。以下の内容で承りました。"
      : "ご予約をキャンセルしました。以下の予約は取り消されました。";

  const lines: string[] = [];
  if (p.customerName) lines.push(`${p.customerName} 様`);
  lines.push(greeting);
  lines.push(`店舗: ${p.storeName}`);
  if (p.receiptNo) lines.push(`受付番号: ${p.receiptNo}`);
  if (p.menuName) lines.push(`コース: ${p.menuName}`);
  lines.push(`日時: ${p.dateTimeLabel}`);
  if (p.staffName) lines.push(`担当: ${p.staffName}`);
  lines.push("※このメールはモックです（実際の送信は行われません）。");

  return { subject: `${head}${p.storeName}`, lines };
}
