"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthButton } from "@/components/AuthButton";

const navItems = [
  { href: "/#welcome", label: "Главная" },
  { href: "/#portfolio", label: "Работы" },
  { href: "/#services", label: "Услуги" },
  { href: "/#contacts", label: "Контакты" },
  { href: "/#delivery", label: "Доставка" },
  { href: "/#ie", label: "ИП" },
];

export default function Header() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur">
      <div className="app-shell flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white text-sm font-semibold text-black">
            CS
          </span>
          <span className="text-base font-semibold tracking-wide text-white">CraftSigns</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}

          {mounted && user && !(user.role === "admin" || user.role === "moderator") && (
            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Личный кабинет
            </Link>
          )}


          {mounted && (user?.role === "admin" || user?.role === "moderator") && (
            <Link
              href="/admin"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Админ панель
            </Link>
          )}
        </nav>

        <AuthButton />
      </div>
    </header>
  );
}

