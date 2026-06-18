"use client";

import Link from "next/link";
import { Building2, MapPinned, MessageSquareText, Truck } from "lucide-react";

const items = [
  { href: "#contacts", icon: MessageSquareText, title: "Контакты", text: "Телефон, почта и форма заявки." },
  { href: "#delivery", icon: Truck, title: "Доставка", text: "Отправка готовых изделий по Москве и Московской области." },
  { href: "#welcome", icon: MapPinned, title: "Подход", text: "Производство, монтаж и сопровождение." },
  { href: "#ie", icon: Building2, title: "Реквизиты", text: "Информация об индивидуальном предпринимателе." },
];

export const Info = () => (
  <section className="app-shell py-4">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map(({ href, icon: Icon, title, text }) => (
        <Link key={title} href={href} className="icon-tile block p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
            <Icon size={21} />
          </div>
          <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
        </Link>
      ))}
    </div>
  </section>
);
