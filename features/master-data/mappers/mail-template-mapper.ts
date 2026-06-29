import type { MailTemplate, MailTemplateKind } from "@/features/mail/types";
import type { DbContext, TableMapper } from "./types";

// メール定型文（テナント共通・FKなし）。fee-master 同型。
export const mailTemplateMapper: TableMapper<MailTemplate> = {
  table: "mail_templates",

  idOf: (item) => item.id,

  fromRow(row) {
    return {
      id: (row.legacy_id as string | null) ?? (row.id as string),
      name: (row.name as string) ?? "",
      subject: (row.subject as string | null) ?? "",
      body: (row.body as string | null) ?? "",
      kind: (row.kind as MailTemplateKind) ?? "other",
      isActive: (row.is_active as boolean) ?? true
    };
  },

  toRow(item, ctx: DbContext) {
    return {
      legacy_id: item.id,
      tenant_id: ctx.tenantId,
      store_id: null,
      name: item.name,
      subject: item.subject ?? null,
      body: item.body ?? null,
      kind: item.kind,
      is_active: item.isActive ?? true
    };
  }
};
