"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button, PillInput } from "@/components/forms/Forms";

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter your name");
    if (!email.includes("@")) return setError("Enter a valid email");
    if (password.length < 4) return setError("Password too short");
    if (!consent) return setError("Please accept the privacy terms");
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/onboarding");
    }, 400);
  }

  return (
    <div className="min-h-dvh bg-[#D6D5D0] p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-[40px] bg-white p-8 shadow-card">
        <div className="mx-auto max-w-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet text-sm font-extrabold text-white">
            DH
          </span>
          <h1 className="mt-4 text-center text-2xl font-extrabold">{t("signup.title")}</h1>
          <p className="mt-1.5 text-center text-sm text-ink/50">{t("signup.subtitle")}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <PillInput id="name" label={t("signup.name")} placeholder={t("signup.namePh")} value={name} onChange={setName} />
            <PillInput id="email" label={t("login.email")} type="email" placeholder={t("login.emailPh")} value={email} onChange={setEmail} />
            <PillInput id="password" label={t("login.password")} type="password" placeholder={t("login.passwordPh")} value={password} onChange={setPassword} />
            <label className="flex min-h-11 cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded accent-violet"
              />
              <span className="text-ink/60">{t("signup.consent")}</span>
            </label>
            {error && <p className="text-sm font-medium text-rose">{error}</p>}
            <Button type="submit" full loading={loading}>
              {t("signup.create")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/55">
            {t("signup.haveAccount")}{" "}
            <Link href="/login" className="font-bold text-ink underline">
              {t("signup.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
