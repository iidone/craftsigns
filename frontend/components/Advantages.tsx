"use client";

import { BadgeCheck, Blocks, Lightbulb, PanelTop } from "lucide-react";

const items = [
  { icon: PanelTop, title: "Световые баннеры", text: "Аккуратные рекламные поверхности для фасадов и интерьеров." },
  { icon: Blocks, title: "Объемные буквы", text: "Заметные вывески с чистой геометрией и надежным монтажом." },
  { icon: Lightbulb, title: "Неоновые вывески", text: "Световые решения для витрин, фотозон и бренд-зон." },
  { icon: BadgeCheck, title: "Декор", text: "Элементы оформления под конкретную точку и задачу." },
];

export const Advantages = () => (
  <section className="app-shell py-4">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <article key={title} className="icon-tile p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
            <Icon size={21} />
          </div>
          <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
        </article>
      ))}
    </div>
  </section>
);
