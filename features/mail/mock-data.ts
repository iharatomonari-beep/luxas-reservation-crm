import type { MailAutoRule, MailDelivery, MailTemplate } from "@/features/mail/types";

export const mailTemplatesStorageKey = "luxas-mail-templates";
export const mailDeliveriesStorageKey = "luxas-mail-deliveries";
export const mailAutoRulesStorageKey = "luxas-mail-auto-rules";

export const initialMailTemplates: MailTemplate[] = [
  {
    id: "mail-tpl-001",
    name: "新メニューのご案内",
    subject: "【LUXAS】新しい施術メニューのご案内",
    body: "いつもご利用ありがとうございます。\n新メニューが登場しました。ぜひご予約ください。",
    kind: "broadcast",
    isActive: true
  },
  {
    id: "mail-tpl-002",
    name: "ご来店ありがとうございました",
    subject: "【LUXAS】ご来店ありがとうございました",
    body: "本日はご来店いただきありがとうございました。\nまたのご予約をお待ちしております。",
    kind: "thanks",
    isActive: true
  }
];

// 配信履歴は初期は空（実データはモック配信で記録される）。
export const initialMailDeliveries: MailDelivery[] = [];

export const initialMailAutoRules: MailAutoRule[] = [
  {
    id: "mail-rule-001",
    name: "来店翌日サンクスメール",
    trigger: "after_visit",
    templateId: "mail-tpl-002",
    targetNote: "前日に来店（会計済）の顧客",
    isSimple: true,
    isActive: false
  }
];
