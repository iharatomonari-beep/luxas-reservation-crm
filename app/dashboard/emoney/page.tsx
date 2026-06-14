import { FeeMasterManager } from "@/features/master-data/fee-master-manager";
import { emoneyStorageKey, initialEmoney } from "@/features/master-data/mock-data";

export default function EmoneyPage() {
  return (
    <FeeMasterManager
      title="電子マネーマスタ"
      description="会計の支払種類（電子マネー）の選択肢に使うブランドと手数料率を管理します。"
      storageKey={emoneyStorageKey}
      initial={initialEmoney}
      idPrefix="em"
      nameLabel="ブランド名"
    />
  );
}
