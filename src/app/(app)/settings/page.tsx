"use client";

import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { SectionLabel } from "@/components/data/Primitives";
import { Toggle } from "@/components/data/Cards";
import { ConfirmDialog, SegmentedControl } from "@/components/forms/Forms";
import { NoticeCard, SyncStatusPill } from "@/components/shell/Banners";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "../../../../convex/_generated/api";
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
  const router = useRouter();
  const profile = useQuery(api.profile.get, {});
  const clearData = useMutation(api.profile.clearData);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [notif, setNotif] = useState(true);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAll() {
    setDeleting(true);
    try {
      await clearData({});
      setDeleteOpen(false);
      router.push("/onboarding");
    } finally {
      setDeleting(false);
    }
  }

  const pName = profile?.name ?? "Deshi User";
  const pStats = profile
    ? `${profile.age} yrs · ${profile.heightCm} cm · ${profile.weightKg} kg (Asian BMI ${profile.asianBmi ? profile.asianBmi.toFixed(1) : "—"} · ${profile.asianBmiBand ?? "normal"})`
    : "No profile set up yet. Tap to configure.";
  const pSafety = profile ? `Safety mode: ${profile.safetyMode}` : "Safety mode: not set";
  const pGoal = profile ? profile.goal.replace("-", " ") : "Maintain";
  const pStyle = profile?.eatingStyle?.join(", ") || "General Bangladeshi";
  const pBudget = profile?.budgetBandTaka ? `৳${profile.budgetBandTaka} / day` : "Flexible";
  const pHousehold = profile?.household?.eatersFromPot
    ? `${profile.household.eatersFromPot} people from shared pot`
    : "2 adults";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">{t("settings.title")}</h1>

      <section>
        <div className="flex items-center justify-between">
          <SectionLabel>{t("settings.profile")}</SectionLabel>
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="text-xs font-bold text-violet underline hover:opacity-80"
          >
            {profile ? "Recalibrate" : "Set up"}
          </button>
        </div>
        <div className="divide-y divide-border rounded-card border border-border">
          <Row
            icon={User}
            label={pName}
            value={pStats}
            onClick={() => router.push("/onboarding")}
          />
          <Row
            icon={Shield}
            label={pSafety}
            value="Derived deterministically by engine"
            onClick={() => router.push("/onboarding")}
          />
          <Row
            icon={ScrollText}
            label="Goal"
            value={pGoal}
            onClick={() => router.push("/onboarding")}
          />
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
          <Row
            icon={ScrollText}
            label="Eating style"
            value={pStyle}
            onClick={() => router.push("/onboarding")}
          />
          <Row
            icon={Database}
            label="Food budget"
            value={pBudget}
            onClick={() => router.push("/onboarding")}
          />
          <Row
            icon={User}
            label={t("settings.household")}
            value={pHousehold}
            onClick={() => router.push("/onboarding")}
          />
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
          className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-tile border border-rose/30 bg-rose/5 px-4 text-left text-rose hover:bg-rose/10 transition"
        >
          <Trash2 size={16} />
          <span className="text-sm font-bold">{t("settings.deleteData")}</span>
        </button>
      </section>

      <section>
        <SectionLabel>{t("settings.about")}</SectionLabel>
        <div className="divide-y divide-border rounded-card border border-border">
          <Row
            icon={Info}
            label={t("settings.sources")}
            value="FAO / INFS Dhaka Univ FCTB 2013, ICMR-NIN IFCT 2017, WHO SEARO 2025"
            onClick={() => {}}
          />
          <Row
            icon={ScrollText}
            label={t("settings.report")}
            value="Report inaccurate data or nutritional discrepancies"
            onClick={() => {}}
          />
        </div>
        <p className="mt-4 text-xs text-ink/45">{t("safety.notMedical")}</p>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        title={t("settings.deleteData")}
        body={t("settings.deleteConfirm")}
        confirmLabel={deleting ? "DELETING..." : "DELETE"}
        onConfirm={() => void handleDeleteAll()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
