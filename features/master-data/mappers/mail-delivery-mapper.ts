import type { MailDelivery, MailDeliveryStatus, MailTemplateKind } from "@/features/mail/types";
import type { TableMapper } from "./types";

// メール配信履歴（テナント共通）。配信→定型文は legacy→uuid 解決＋round-trip。
// recipientIds は顧客legacy ID配列（顧客はフェーズ4・解決なし）を jsonb で保持。
export const mailDeliveryMapper: TableMapper<MailDelivery> = {
  table: "mail_deliveries",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      sentAt: (row.sent_at as string) ?? "",
      // 定型文参照は round-trip 列から復元（アプリの templateId）。
      templateId: (row.template_legacy_id as string | null) ?? "",
      templateName: (row.template_name as string | null) ?? "",
      subject: (row.subject as string | null) ?? "",
      kind: (row.kind as MailTemplateKind) ?? "other",
      targetCount: Number(row.target_count ?? 0),
      recipientIds: (row.recipient_ids as string[] | null) ?? [],
      status: (row.status as MailDeliveryStatus) ?? "sent",
      note: (row.note as string | null) ?? ""
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: null,
      sent_at: item.sentAt,
      template_id: ctx.mailTemplateIdByLegacy[item.templateId] ?? null,
      template_legacy_id: item.templateId ?? null,
      template_name: item.templateName ?? null,
      subject: item.subject ?? null,
      kind: item.kind,
      target_count: item.targetCount ?? 0,
      recipient_ids: item.recipientIds ?? [],
      status: item.status,
      note: item.note ?? null
    };
  }
};
