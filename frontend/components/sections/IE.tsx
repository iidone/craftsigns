export const IE = () => (
  <section id="ie" className="app-shell py-4 pb-10">
    <div className="section-panel p-6 sm:p-8 lg:p-10">
      <div className="section-eyebrow">Юридическая информация</div>
      <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            ИП Вистяков Д. Г.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Индивидуальный предприниматель. Информация размещена для клиентов и
            оформления заказов в рамках дипломного проекта.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-600">Статус</p>
            <p className="mt-2 text-sm font-medium text-white">Действующий исполнитель</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-600">Проект</p>
            <p className="mt-2 text-sm font-medium text-white">CraftSigns</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);
