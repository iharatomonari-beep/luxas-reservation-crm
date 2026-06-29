// データ保管先（localStorage / Supabase）のテーブル単位スイッチ。
// 既定は local。Supabase へ移したテーブルだけ backend を "supabase" にする。
// 問題時はその1行を "local" に戻すだけで即・無損失で切り戻せる（localStorageは保持される）。

import { attendanceMapper } from "./mappers/attendance-mapper";
import { checkoutItemMapper } from "./mappers/checkout-item-mapper";
import { courseSetMapper } from "./mappers/course-set-mapper";
import { customerMapper } from "./mappers/customer-mapper";
import { dailyReportMapper } from "./mappers/daily-report-mapper";
import { dataErrorMapper } from "./mappers/data-error-mapper";
import { onlineBlockMapper } from "./mappers/online-block-mapper";
import { turnawayMapper } from "./mappers/turnaway-mapper";
import { userDirectoryMapper } from "./mappers/user-directory-mapper";
import { dailyTargetMapper } from "./mappers/daily-target-mapper";
import { expenseAccountMapper } from "./mappers/expense-account-mapper";
import { expenseEntryMapper } from "./mappers/expense-entry-mapper";
import { mailAutoRuleMapper } from "./mappers/mail-auto-rule-mapper";
import { mailDeliveryMapper } from "./mappers/mail-delivery-mapper";
import { mailTemplateMapper } from "./mappers/mail-template-mapper";
import { makeFeeMasterMapper } from "./mappers/fee-master-mapper";
import { masterTagMapper } from "./mappers/master-tag-mapper";
import { menuCategoryMapper } from "./mappers/menu-category-mapper";
import { registerRecordMapper } from "./mappers/register-record-mapper";
import { reservationMapper } from "./mappers/reservation-mapper";
import { serviceOptionMapper } from "./mappers/service-option-mapper";
import { shiftPatternMapper } from "./mappers/shift-pattern-mapper";
import { shiftTemplateMapper } from "./mappers/shift-template-mapper";
import { retailCategoryMapper } from "./mappers/retail-category-mapper";
import { retailItemMapper } from "./mappers/retail-item-mapper";
import { retailSaleMapper } from "./mappers/retail-sale-mapper";
import { roomMapper } from "./mappers/room-mapper";
import { serviceMapper } from "./mappers/service-mapper";
import { shiftMapper } from "./mappers/shift-mapper";
import { staffMapper } from "./mappers/staff-mapper";
import type { TableMapper } from "./mappers/types";

export type DataBackend = "local" | "supabase";

export type TableConfig = {
  backend: DataBackend;
  mapper: TableMapper<unknown>;
};

const REGISTRY: Record<string, TableConfig> = {
  // パイロット: staff を Supabase へ（DDL + 最小シード適用済み前提）。
  // 切り戻すときは backend を "local" に変更するだけ。
  "luxas-master-staff": {
    backend: "supabase",
    mapper: staffMapper as unknown as TableMapper<unknown>
  },
  // パイロット: services を Supabase へ（services DDL 適用済み前提）。
  "luxas-master-services": {
    backend: "supabase",
    mapper: serviceMapper as unknown as TableMapper<unknown>
  },
  // パイロット: rooms を Supabase へ（rooms DDL 適用済み前提）。
  "luxas-master-rooms-v2": {
    backend: "supabase",
    mapper: roomMapper as unknown as TableMapper<unknown>
  },
  // パイロット: shifts を Supabase へ（shifts DDL 適用済み前提）。staff_id は legacy→uuid 解決。
  "luxas-master-shifts-v2": {
    backend: "supabase",
    mapper: shiftMapper as unknown as TableMapper<unknown>
  },
  // フェーズ2: reservations を Supabase へ。staff/service/room を legacy→uuid 解決。customer_id は当面null。
  "luxas-reservations-v2": {
    backend: "supabase",
    mapper: reservationMapper as unknown as TableMapper<unknown>
  },
  // フェーズ3 第1スライス: 決済マスタ（テナント共通・FKなし・同型）。
  "luxas-master-creditcards": {
    backend: "supabase",
    mapper: makeFeeMasterMapper("credit_card_companies") as unknown as TableMapper<unknown>
  },
  "luxas-master-emoney": {
    backend: "supabase",
    mapper: makeFeeMasterMapper("emoney_brands") as unknown as TableMapper<unknown>
  },
  // フェーズ3 第2スライス: 会計アイテムマスタ＋レジ記録（FKなし）。
  "luxas-checkout-items": {
    backend: "supabase",
    mapper: checkoutItemMapper as unknown as TableMapper<unknown>
  },
  "luxas-register-records": {
    backend: "supabase",
    mapper: registerRecordMapper as unknown as TableMapper<unknown>
  },
  // フェーズ3 第3スライス: 物販（カテゴリ/商品=テナント共通、販売=店舗別・商品legacy→uuid解決）。
  "luxas-retail-categories": {
    backend: "supabase",
    mapper: retailCategoryMapper as unknown as TableMapper<unknown>
  },
  "luxas-retail-items": {
    backend: "supabase",
    mapper: retailItemMapper as unknown as TableMapper<unknown>
  },
  "luxas-retail-sales": {
    backend: "supabase",
    mapper: retailSaleMapper as unknown as TableMapper<unknown>
  },
  // フェーズ3 第4スライス: 日次運用（経費科目=テナント共通、明細/出退勤/日報/目標=店舗別）。
  "luxas-expense-accounts": {
    backend: "supabase",
    mapper: expenseAccountMapper as unknown as TableMapper<unknown>
  },
  "luxas-expense-entries": {
    backend: "supabase",
    mapper: expenseEntryMapper as unknown as TableMapper<unknown>
  },
  "luxas-attendance": {
    backend: "supabase",
    mapper: attendanceMapper as unknown as TableMapper<unknown>
  },
  "luxas-daily-reports": {
    backend: "supabase",
    mapper: dailyReportMapper as unknown as TableMapper<unknown>
  },
  "luxas-daily-targets": {
    backend: "supabase",
    mapper: dailyTargetMapper as unknown as TableMapper<unknown>
  },
  // フェーズ3 第5スライス: 商品まわり拡張（メニューカテゴリ/オプション/セット商品＝テナント共通・FKなし）。
  "luxas-master-categories": {
    backend: "supabase",
    mapper: menuCategoryMapper as unknown as TableMapper<unknown>
  },
  "luxas-master-options": {
    backend: "supabase",
    mapper: serviceOptionMapper as unknown as TableMapper<unknown>
  },
  "luxas-master-course-sets": {
    backend: "supabase",
    mapper: courseSetMapper as unknown as TableMapper<unknown>
  },
  // フェーズ3 第6スライス: タグ3種（1テーブル+kind・テナント共通）。
  "luxas-master-tags": {
    backend: "supabase",
    mapper: masterTagMapper as unknown as TableMapper<unknown>
  },
  // フェーズ3 第7スライス: メール3種（定型文/配信履歴/自動ルール＝テナント共通・モック）。
  "luxas-mail-templates": {
    backend: "supabase",
    mapper: mailTemplateMapper as unknown as TableMapper<unknown>
  },
  "luxas-mail-deliveries": {
    backend: "supabase",
    mapper: mailDeliveryMapper as unknown as TableMapper<unknown>
  },
  "luxas-mail-auto-rules": {
    backend: "supabase",
    mapper: mailAutoRuleMapper as unknown as TableMapper<unknown>
  },
  // フェーズ3 第8スライス: シフトパターン/ひな型（テナント共通・参照なし）。
  "luxas-shift-patterns": {
    backend: "supabase",
    mapper: shiftPatternMapper as unknown as TableMapper<unknown>
  },
  "luxas-shift-templates": {
    backend: "supabase",
    mapper: shiftTemplateMapper as unknown as TableMapper<unknown>
  },
  // フェーズ3 第9スライス: 小マスタ（オンライン停止/返客=店舗別、データ不備/ユーザ表示=テナント共通）。
  "luxas-online-blocks": {
    backend: "supabase",
    mapper: onlineBlockMapper as unknown as TableMapper<unknown>
  },
  "luxas-turnaways": {
    backend: "supabase",
    mapper: turnawayMapper as unknown as TableMapper<unknown>
  },
  "luxas-data-errors": {
    backend: "supabase",
    mapper: dataErrorMapper as unknown as TableMapper<unknown>
  },
  "luxas-users": {
    backend: "supabase",
    mapper: userDirectoryMapper as unknown as TableMapper<unknown>
  },
  // フェーズ4（顧客）S1: customers を Supabase へ（profile jsonb 退避方式・参照=テナント全員）。
  // ★ダミーのみ。実名簿(PM)は §5 を全て満たすまで投入しない。
  "luxas-customers-sample": {
    backend: "supabase",
    mapper: customerMapper as unknown as TableMapper<unknown>
  }
};

export function tableConfig(storageKey: string): TableConfig | undefined {
  return REGISTRY[storageKey];
}

export function backendFor(storageKey: string): DataBackend {
  return REGISTRY[storageKey]?.backend ?? "local";
}

// singleton 設定（useLocalCollection でない・1行 jsonb）の保管先レジストリ。
// 1行を "local" に戻すだけで即・無損失で切り戻せる。
const SETTINGS_REGISTRY: Record<string, DataBackend> = {
  // フェーズA 設定系（その1）: EPARK設定を Supabase へ（epark_settings 1テナント1行）。
  "luxas-epark-settings": "supabase",
  // フェーズA 設定系（その2）: 店舗設定を Supabase へ（store_settings 店舗1行・公開RPC併用）。
  "luxas-store-settings": "supabase"
};

export function settingsBackendFor(settingsKey: string): DataBackend {
  return SETTINGS_REGISTRY[settingsKey] ?? "local";
}
