"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button, PillInput } from "@/components/forms/Forms";

/** Local botanical / food-ingredient collage (no remote images). */
function BotanicalPanel() {
  return (
    <div
      aria-hidden
      className="relative hidden h-full min-h-[420px] overflow-hidden rounded-card md:block"
      style={{ background: "linear-gradient(160deg, #E8EDE4 0%, #D4DDD0 50%, #C5D0BF 100%)" }}
    >
      <svg viewBox="0 0 400 520" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        {/* rice grains */}
        <ellipse cx="120" cy="360" rx="14" ry="6" fill="#F5F0E6" transform="rotate(-20 120 360)" />
        <ellipse cx="145" cy="375" rx="14" ry="6" fill="#F0EAD8" transform="rotate(15 145 375)" />
        <ellipse cx="100" cy="385" rx="13" ry="5" fill="#F5F0E6" transform="rotate(-5 100 385)" />
        <ellipse cx="160" cy="400" rx="14" ry="6" fill="#EDE6D0" transform="rotate(30 160 400)" />
        {/* lentils */}
        <circle cx="250" cy="340" r="7" fill="#E9A23B" opacity="0.85" />
        <circle cx="270" cy="355" r="6" fill="#D4922F" opacity="0.85" />
        <circle cx="240" cy="365" r="7" fill="#E9A23B" opacity="0.75" />
        <circle cx="285" cy="335" r="5" fill="#C9842A" opacity="0.8" />
        {/* green chili */}
        <path d="M300 200 Q330 220 310 280 Q305 250 295 230 Z" fill="#2F8F67" />
        <path d="M305 200 Q300 190 310 185" stroke="#1F6B4A" strokeWidth="3" fill="none" />
        {/* gourd shape */}
        <ellipse cx="150" cy="200" rx="50" ry="70" fill="#B8D4B0" />
        <ellipse cx="150" cy="200" rx="35" ry="55" fill="#C8E0C0" opacity="0.6" />
        {/* hilsa fish silhouette */}
        <path d="M80 450 Q140 420 200 450 Q140 480 80 450 Z" fill="#9BB8C9" />
        <path d="M80 450 L55 430 L55 470 Z" fill="#8AA8BA" />
        <circle cx="175" cy="447" r="3" fill="#2A3A44" />
        {/* leaves */}
        <path d="M320 100 Q360 140 320 180 Q280 140 320 100 Z" fill="#7CB08A" />
        <path d="M60 120 Q100 80 140 120 Q100 160 60 120 Z" fill="#8FBC9A" />
        <line x1="320" y1="100" x2="320" y2="180" stroke="#5A9068" strokeWidth="2" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/20 to-transparent p-6">
        <p className="text-sm font-semibold text-white/90">
          চাল · ডাল · ইলিশ · শসা · কাঁচামরিচ
        </p>
      </div>
    </div>
  );
}

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="min-h-dvh bg-[#D6D5D0] p-4 md:p-8 flex items-center justify-center">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[40px] bg-white p-0 shadow-card md:grid-cols-2 md:p-3">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="min-h-11 rounded-full border border-[#E5E4E0] px-4 text-sm font-bold"
            >
              {lang === "en" ? "বাংলা" : "EN"}
            </button>
          </div>
          <div className="mx-auto max-w-sm text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet text-sm font-extrabold text-white">
              DH
            </span>
            <h1 className="mt-4 text-2xl font-extrabold">{title}</h1>
            <p className="mt-1.5 text-sm text-ink/50">{subtitle}</p>
            <div className="mt-6 text-left">{children}</div>
            <p className="mt-6 text-xs text-ink/45">{t("safety.notMedical")}</p>
          </div>
        </div>
        <div className="hidden p-3 md:block">
          <BotanicalPanel />
        </div>
      </div>
    </div>
  );
}

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setLoading(true);
    // Demo: no real auth yet — go to onboarding/home
    setTimeout(() => {
      setLoading(false);
      router.push("/home");
    }, 400);
  }

  return (
    <AuthCard title={t("login.title")} subtitle={t("login.subtitle")}>
      <form onSubmit={submit} className="space-y-4">
        <PillInput
          id="email"
          label={t("login.email")}
          type="email"
          placeholder={t("login.emailPh")}
          value={email}
          onChange={setEmail}
          error={error && !email.includes("@") ? error : undefined}
        />
        <PillInput
          id="password"
          label={t("login.password")}
          type="password"
          placeholder={t("login.passwordPh")}
          value={password}
          onChange={setPassword}
          error={error && password.length < 4 ? error : undefined}
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex min-h-11 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded accent-violet"
            />
            <span className="font-medium text-ink/60">{t("login.remember")}</span>
          </label>
          <button type="button" className="min-h-11 font-semibold underline">
            {t("login.forgot")}
          </button>
        </div>
        <Button type="submit" full loading={loading}>
          {t("login.login")}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink/40">
        <span className="h-px flex-1 bg-[#E5E4E0]" />
        {t("login.or")}
        <span className="h-px flex-1 bg-[#E5E4E0]" />
      </div>

      <Button variant="secondary" full>
        <span aria-hidden>G</span> {t("login.google")}
      </Button>

      <p className="mt-6 text-center text-sm text-ink/55">
        {t("login.newHere")}{" "}
        <Link href="/signup" className="font-bold text-ink underline">
          {t("login.create")}
        </Link>
      </p>
    </AuthCard>
  );
}
