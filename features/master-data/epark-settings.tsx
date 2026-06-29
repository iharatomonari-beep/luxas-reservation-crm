"use client";

import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { SelectField } from "@/features/master-data/form-controls";
import { initialServices, servicesStorageKey } from "@/features/master-data/mock-data";
import { MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import type { ServiceMenu } from "@/features/master-data/types";
import { compareBySortOrder } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { settingsBackendFor } from "@/features/master-data/migration-config";
import { loadTenantSettings, saveTenantSettings } from "@/features/master-data/remote-collection";

const eparkStorageKey = "luxas-epark-settings";
const eparkTable = "epark_settings";

type EparkSettings = { recommendedCourse1Id: string; recommendedCourse2Id: string };
const emptySettings: EparkSettings = { recommendedCourse1Id: "", recommendedCourse2Id: "" };

export function EparkSettings() {
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [settings, setSettings] = useState<EparkSettings>(emptySettings);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const backend = settingsBackendFor(eparkStorageKey);

  // 単一オブジェクトを読み込み（hydration後）。supabase時はDBの jsonb、local時は localStorage。
  useEffect(() => {
    let cancelled = false;
    if (backend === "supabase") {
      loadTenantSettings(eparkTable)
        .then((json) => {
          if (!cancelled && json) {
            setSettings({ ...emptySettings, ...(json as Partial<EparkSettings>) });
          }
        })
        .catch((error) => console.error("[supabase] load epark_settings failed", error));
      return () => {
        cancelled = true;
      };
    }
    try {
      const stored = window.localStorage.getItem(eparkStorageKey);
      if (stored) {
        setSettings({ ...emptySettings, ...(JSON.parse(stored) as Partial<EparkSettings>) });
      }
    } catch {
      // 破損時は既定のまま。
    }
    return () => {
      cancelled = true;
    };
  }, [backend]);

  const courseOptions = [...services].filter((s) => s.isActive).sort(compareBySortOrder);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (backend === "supabase") {
        await saveTenantSettings(eparkTable, { ...settings });
      } else {
        window.localStorage.setItem(eparkStorageKey, JSON.stringify(settings));
      }
      setMessage({ type: "success", text: "EPARK掲載設定を保存しました。" });
    } catch {
      setMessage({ type: "error", text: "保存に失敗しました。" });
    }
  }

  return (
    <MasterPage title="EPARK掲載設定" description="EPARKに掲載するおすすめコースを設定します（PM準拠・T053。掲載連携は将来対応）。">
      <section className="max-w-xl rounded-lg border border-luxas-line bg-white p-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <SelectField
            label="おすすめコース1"
            value={settings.recommendedCourse1Id}
            onChange={(value) => setSettings((current) => ({ ...current, recommendedCourse1Id: value }))}
          >
            <option value="">未設定</option>
            {courseOptions.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="おすすめコース2"
            value={settings.recommendedCourse2Id}
            onChange={(value) => setSettings((current) => ({ ...current, recommendedCourse2Id: value }))}
          >
            <option value="">未設定</option>
            {courseOptions.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </SelectField>
          <StatusMessage message={message} />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]"
          >
            <Save size={17} aria-hidden="true" />
            保存する
          </button>
        </form>
      </section>
    </MasterPage>
  );
}
