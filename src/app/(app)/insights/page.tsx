"use client";

import { useI18n } from "@/lib/i18n";
import { EmptyState } from "@/components/data/Primitives";
import { NoticeCard } from "@/components/shell/Banners";

export default function InsightsPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">{t("nav.insights")}</h1>
      <EmptyState
        title={t("states.empty")}
        body="Weekly trends, micro gaps and adaptive TDEE land here in Wave 6."
      />
      <NoticeCard tone="info" title="Coming in Wave 6" body="Personalisation insights are stubbed for now." />
    </div>
  );
}
