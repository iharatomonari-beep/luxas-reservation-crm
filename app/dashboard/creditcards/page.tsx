import { FeeMasterManager } from "@/features/master-data/fee-master-manager";
import { creditCardsStorageKey, initialCreditCards } from "@/features/master-data/mock-data";

export default function CreditCardsPage() {
  return (
    <FeeMasterManager
      title="クレジットカード会社マスタ"
      description="会計の支払種類（クレジット）の選択肢に使う会社と手数料率を管理します。"
      storageKey={creditCardsStorageKey}
      initial={initialCreditCards}
      idPrefix="cc"
      nameLabel="会社名"
    />
  );
}
