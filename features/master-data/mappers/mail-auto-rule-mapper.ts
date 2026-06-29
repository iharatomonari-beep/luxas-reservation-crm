import type { MailAutoRule, MailAutoTrigger } from "@/features/mail/types";
import type { TableMapper } from "./types";

// メール自動ルール（テナント共通）。ルール→定型文は legacy→uuid 解決＋round-trip。
export const mailAutoRuleMapper: TableMapper<MailAutoRule> = {
  table: "mail_auto_rules",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      trigger: (row.trigger as MailAutoTrigger) ?? "after_visit",
      templateId: (row.template_legacy_id as string | null) ?? "",
      targetNote: (row.target_note as string | null) ?? "",
      isSimple: (row.is_simple as boolean) ?? false,
      isActive: (row.is_active as boolean) ?? true
    };
  },

  toRow(item, ctx) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: null,
      name: item.name,
      trigger: item.trigger,
      template_id: ctx.mailTemplateIdByLegacy[item.templateId] ?? null,
      template_legacy_id: item.templateId ?? null,
      target_note: item.targetNote ?? null,
      is_simple: item.isSimple ?? false,
      is_active: item.isActive ?? true
    };
  }
};
