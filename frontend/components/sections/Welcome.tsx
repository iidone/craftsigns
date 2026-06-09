import Link from "next/link";

const benefits = [
  "Вывески, баннеры и оформление под задачу бизнеса",
  "Производство, монтаж и сопровождение в одном месте",
  "Посмотрите портфолио и предоставляемые услуги",
  "Оставьте заявку на обратную связь",
];

export const Welcome = () => (
  <section id="welcome" className="app-shell pt-6">
    <div className="section-panel relative overflow-hidden p-5 sm:p-8 lg:p-10">
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
        <div className="flex min-h-[520px] flex-col justify-between gap-10">
          <div>
            <div className="section-eyebrow">Рекламное производство</div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-none text-white sm:text-6xl lg:text-7xl">
              CraftSigns
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              Изготавливаем рекламные конструкции: баннеры, объемные буквы,
              неоновые вывески и декоративные элементы для компаний, которым
              важно выглядеть аккуратно и заметно.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit: string) => (
              <div
                key={benefit}
                className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-300"
              >
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col justify-between rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top,#171717_0%,#0b0b0c_58%,#070707_100%)] p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              Быстрый старт
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Посмотрите работы и выберите формат услуги
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Сайт сохраняет структуру дипломного проекта: портфолио, услуги,
              контакты, доставка, реквизиты и личный вход.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            <Link
              href="#services"
              className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Смотреть услуги
            </Link>
            <Link
              href="#contacts"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-white/10"
            >
              Оставить заявку
            </Link>
          </div>
        </aside>
      </div>
    </div>
  </section>
);
