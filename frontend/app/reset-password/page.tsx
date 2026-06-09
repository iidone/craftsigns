"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as { detail?: string }).detail ?? "Ошибка сброса пароля");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сброса пароля");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-20 items-center justify-center bg-[#050505] px-4 py-10 text-white">
      <div className="w-full max-w-[420px] rounded-[26px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <KeyRound size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Новый пароль</h1>
            <p className="text-sm text-zinc-500">CraftSigns</p>
          </div>
        </div>

        {!token ? (
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-zinc-400">
              Неверная или устаревшая ссылка. Запросите сброс пароля повторно.
            </p>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-zinc-300 transition hover:bg-white/[0.08]"
            >
              На главную
            </Link>
          </div>
        ) : success ? (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Пароль успешно изменён. Теперь вы можете войти с новым паролем.
            </div>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-white text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Войти в аккаунт
            </Link>
          </div>
        ) : (
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <p className="mb-1 text-sm leading-6 text-zinc-500">
              Придумайте новый пароль — не менее 6 символов.
            </p>
            <label className="grid gap-2 text-sm text-zinc-300">
              <span>Новый пароль</span>
              <input
                className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/[0.07]"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              <span>Повторите пароль</span>
              <input
                className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/[0.07]"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            {error && (
              <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </p>
            )}
            <button
              className="h-11 rounded-2xl bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
              disabled={loading}
              type="submit"
            >
              {loading ? "Сохранение..." : "Сохранить пароль"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
