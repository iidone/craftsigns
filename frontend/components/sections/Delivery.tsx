const deliveryItems = [
  { title: "По Москве", desc: "Доставляем по Москве. Согласуем сроки и удобный способ получения заказа." },
  { title: "По Московской области", desc: "Работаем по всей Московской области. Уточняйте условия доставки у менеджера." },
  { title: "До объекта", desc: "Выезд на объект для монтажа и сдачи готового изделия заказчику." },
];

export const Delivery = () => (
  <section id="delivery" className="app-shell py-4">
    <div className="section-panel grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
      <div>
        <div className="section-eyebrow">Логистика</div>
        <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
          Доставка готовых изделий
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Работаем только в Москве и Московской области.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {deliveryItems.map((item) => (
          <div key={item.title} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-white">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
