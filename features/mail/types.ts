// メール管理（T038）。LUXAS v0.1 は実送信せず、記録のみのモック。

export type MailTemplateKind = "broadcast" | "edm" | "reminder" | "thanks" | "other";

export const mailTemplateKindLabels: Record<MailTemplateKind, string> = {
  broadcast: "一斉配信",
  edm: "eDM",
  reminder: "リマインド",
  thanks: "サンクス",
  other: "その他"
};

export type MailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  kind: MailTemplateKind;
  isActive: boolean;
};

export type MailDeliveryStatus = "sent" | "canceled";

export type MailDelivery = {
  id: string;
  /** 配信日時（ISO文字列） */
  sentAt: string;
  templateId: string;
  templateName: string;
  subject: string;
  kind: MailTemplateKind;
  /** 配信対象数 */
  targetCount: number;
  /** 配信対象の顧客ID（配信制限の判定に使う） */
  recipientIds: string[];
  status: MailDeliveryStatus;
  note: string;
};

export type MailAutoTrigger = "after_visit" | "birthday" | "no_visit_days" | "reservation_reminder";

export const mailAutoTriggerLabels: Record<MailAutoTrigger, string> = {
  after_visit: "来店後フォロー",
  birthday: "誕生日",
  no_visit_days: "一定期間未来店",
  reservation_reminder: "予約前リマインド"
};

export type MailAutoRule = {
  id: string;
  name: string;
  trigger: MailAutoTrigger;
  templateId: string;
  targetNote: string;
  /** シンプルeDM=true（簡易設定）/ eDM=false（詳細設定）の区別に使う */
  isSimple: boolean;
  isActive: boolean;
};
