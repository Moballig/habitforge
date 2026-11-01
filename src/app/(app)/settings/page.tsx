"use client";

import { useI18n } from "@/lib/i18n";
import { SectionLabel } from "@/components/data/Primitives";
import { Toggle } from "@/components/data/Cards";
import { ConfirmDialog, SegmentedControl } from "@/components/forms/Forms";
import { NoticeCard, SyncStatusPill } from "@/components/shell/Banners";
import ThemeToggle from "@/components/ThemeToggle";
import { DEMO_PROFILE } from "@/lib/mock";
import { useState } from "react";
import {
  ChevronRight,
  Database,
  Globe,
  Info,
  Palette,
  ScrollText,
  Shield,
  Trash2,
  User,
  Wifi,
} from "lucide-react";

function Row({
  icon: Icon,
  label,
  value,
  onClick,
  right,
}: {
  icon: typeof User;
  label: string;
  value?: string;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-3 rounded-tile px-4 text-left transition hover:bg-surface-soft"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft text-violet">
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        {value && <span className="block truncate text-xs text-ink/50">{value}</span>}
      </span>
      {right ?? <ChevronRight size={16} className="text-ink/35" />}
    </button>
  );
}

export default function SettingsPage() {
  const { t, largeText, setLargeText, lowLiteracy, setLowLiteracy, lang, setLang } = useI18n();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [notif, setNotif] = useState(true);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">{t("settings.title")}</h1>

      <section>
        <SectionLabel>{t("settings.profile")}</SectionLabel>
        <div className="divide-y divide-border rounded-card border border-border">
          <Row icon={User} label={DEMO_PROFILE.name} value={`${DEMO_PROFILE.age} · ${DEMO_PROFILE.heightCm} cm · ${DEMO_PROFILE.weightKg} kg`} onClick={() => {}} />
          <Row icon={Shield} label={`Safety mode: ${DEMO_PROFILE.safetyMode}`} value="Set during onboarding" onClick={() => {}} />
          <Row icon={ScrollText} label="Goal" value={DEMO_PROFILE.goal.replace("-", " ")} onClick={() => {}} />
        </div>
      </section>

      <section>
        <SectionLabel>{t("settings.language")}</SectionLabel>
        <div className="card space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Globe size={16} className="text-violet" /> {t("settings.language")}
            </span>
            <SegmentedControl
              ariaLabel="Language"
              options={[
                { value: "en", label: "EN" },
                { value: "bn", label: "বাংলা" },
              ]}
              value={lang}
              onChange={(v) => setLang(v)}
            />
          </div>
          <Toggle label={t("settings.largeText")} checked={largeText} onChange={setLargeText} />
          <Toggle label={t("settings.lowLiteracy")} checked={lowLiteracy} onChange={setLowLiteracy} />
        </div>
      </section>

      <section>
        <SectionLabel>{t("settings.appearance")}</SectionLabel>
        <div className="card flex items-center justify-between p-4">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Palette size={16} className="text-violet" /> Theme
          </span>
          <ThemeToggle variant="inline" />
        </div>
      </section>

      <section>
        <SectionLabel>{t("settings.style")}</SectionLabel>
        <div className="divide-y divide-border rounded-card border border-border">
          <Row icon={ScrollText} label="Eating style" value={DEMO_PROFILE.eatingStyle.join(", ")} onClick={() => {}} />
          <Row icon={Database} label="Food budget" value={`৳${DEMO_PROFILE.budgetBandTaka} / day`} onClick={() => {}} />
          <Row icon={User} label={t("settings.household")} value="2 adults" onClick={() => {}} />
        </div>
      </section>

      <section>
        <SectionLabel>{t("settings.routine")}</SectionLabel>
        <div className="divide-y divide-border rounded-card border border-border">
          <Row icon={Wifi} label={t("settings.offline")} right={<SyncStatusPill queued={0} />} onClick={() => {}} />
          <Row icon={Shield} label="Notifications" right={<Toggle label="" checked={notif} onChange={setNotif} />} onClick={() => {}} />
          <Row icon={Database} label={t("settings.dataSaver")} right={<Toggle label="" checked={dataSaver} onChange={setDataSaver} />} onClick={() => {}} />
        </div>
      </section>

      <section>
        <SectionLabel>{t("settings.privacy")}</SectionLabel>
        <NoticeCard
          tone="info"
          title="Your data, your control"
          body="Logs stay in your account. Delete anytime. Never shared with advertisers."
        />
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-tile border border-rose/30 bg-rose/5 px-4 text-left text-rose"
        >
          <Trash2 size={16} />
          <span className="text-sm font-bold">{t("settings.deleteData")}</span>
        </button>
      </section>

      <section>
        <SectionLabel>{t("settings.about")}</SectionLabel>
        <div className="divide-y divide-border rounded-card border border-border">
          <Row icon={Info} label={t("settings.sources")} onClick={() => {}} />
          <Row icon={ScrollText} label={t("settings.report")} onClick={() => {}} />
        </div>
        <p className="mt-4 text-xs text-ink/45">{t("safety.notMedical")}</p>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        title={t("settings.deleteData")}
        body={t("settings.deleteConfirm")}
        confirmLabel="DELETE"
        onConfirm={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
