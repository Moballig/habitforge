"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { AlertTriangle, CloudOff, Wifi, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function getOfflineSnapshot() {
  return !navigator.onLine;
}

function getServerOfflineSnapshot() {
  return false;
}

export function OfflineBanner() {
  const { t } = useI18n();
  const offline = useSyncExternalStore(subscribeOnline, getOfflineSnapshot, getServerOfflineSnapshot);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-2 rounded-tile bg-sky px-4 py-3 text-sm font-medium text-sky-ink"
    >
      <CloudOff size={16} aria-hidden />
      {t("states.offline")}
    </div>
  );
}

export function SyncStatusPill({ queued = 0, showSynced = false }: { queued?: number; showSynced?: boolean }) {
  const { t } = useI18n();
  const offline = useSyncExternalStore(subscribeOnline, getOfflineSnapshot, getServerOfflineSnapshot);

  if (offline) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
        <CloudOff size={12} aria-hidden /> {t("states.offline")}
      </span>
    );
  }

  if (queued > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
        {queued} {t("states.queued")}
      </span>
    );
  }

  if (showSynced) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
        <Wifi size={12} aria-hidden /> Synced
      </span>
    );
  }

  return null;
}

export function SafetyBanner({
  mode,
  children,
}: {
  mode: "normal" | "restricted" | "doctor-first";
  children?: ReactNode;
}) {
  const { t } = useI18n();
  if (mode === "normal" && !children) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-tile border border-border bg-surface-soft px-4 py-3 text-sm">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-turmeric" aria-hidden />
      <div>
        <p className="font-semibold">{t("safety.banner")}</p>
        {mode === "restricted" && <p className="text-ink/70">{t("plan.restricted")}</p>}
        {mode === "doctor-first" && (
          <p className="text-ink/70">{t("safety.referral")}</p>
        )}
        {children}
      </div>
    </div>
  );
}

export function NoticeCard({
  tone = "info",
  title,
  body,
  action,
  onDismiss,
}: {
  tone?: "info" | "gentle" | "error";
  title: string;
  body?: string;
  action?: ReactNode;
  onDismiss?: () => void;
}) {
  const bg =
    tone === "gentle"
      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50"
      : tone === "error"
        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/50"
        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50";
  return (
    <div className={`relative flex items-start gap-3 rounded-card p-4 ${bg}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{title}</p>
        {body && <p className="mt-1 text-sm opacity-90">{body}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
