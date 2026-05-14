"use client";

import { useState } from "react";
import { Map, Placemark, YMaps } from "@pbe/react-yandex-maps";
import { Mail, MapPin, Phone, Send } from "lucide-react";

const contacts = [
  { icon: Phone, title: "Телефон", value: "+7 (900) 123-45-67", href: "tel:+79001234567" },
  { icon: Mail, title: "Email", value: "info@craftsigns.ru", href: "mailto:info@craftsigns.ru" },
  { icon: MapPin, title: "Адрес", value: "г. Москва, ул. Пушкина, д. 1" },
];

export const Contacts = () => {
  const [showMap, setShowMap] = useState(false);
  const defaultCoords: [number, number] = [55.7558, 37.6173];

  return (
    <section id="contacts" className="app-shell py-4">
      <div className="section-panel overflow-hidden p-5 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="section-eyebrow">Контакты</div>
            <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
              Обсудим вашу вывеску
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
              Оставьте заявку или свяжитесь напрямую. Отправку формы я пока не
              менял, чтобы не смешивать дизайн с будущей backend-задачей.
            </p>

            <div className="mt-8 grid gap-3">
              {contacts.map(({ icon: Icon, title, value, href }) => {
                const content = (
                  <div className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-600">{title}</p>
                      <p className="mt-1 text-sm font-medium text-white">{value}</p>
                    </div>
                  </div>
                );

                return href ? (
                  <a key={title} href={href}>{content}</a>
                ) : (
                  <div key={title}>{content}</div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-[#070707] p-4">
            <h3 className="text-xl font-semibold text-white">Оставить заявку</h3>
            <form className="mt-5 grid gap-3">
              <input
                type="text"
                placeholder="Ваше имя"
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
              />
              <input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
              />
              <textarea
                placeholder="Расскажите о проекте"
                rows={5}
                className="resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                <Send size={17} />
                Отправить заявку
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Расположение</h3>
              <p className="mt-1 text-sm text-zinc-500">Карта загружается только после нажатия.</p>
            </div>
            {!showMap && (
              <button
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                onClick={() => setShowMap(true)}
                type="button"
              >
                Показать карту
              </button>
            )}
          </div>

          <div className="h-[320px] overflow-hidden rounded-[22px] border border-white/10 bg-[#050505]">
            {showMap ? (
              <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY || "demo" }}>
                <Map state={{ center: defaultCoords, zoom: 12 }} className="h-full w-full">
                  <Placemark
                    geometry={defaultCoords}
                    properties={{
                      iconCaption: "CraftSigns",
                      hintContent: "Офис CraftSigns",
                      balloonContent: "CraftSigns<br/>г. Москва, Остаповский пр-д, д. 13<br/>Звоните: +7 (900) 123-45-67",
                    }}
                    options={{
                      preset: "islands#icon",
                      iconColor: "#ffffff",
                    }}
                  />
                </Map>
              </YMaps>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm leading-6 text-zinc-500">
                Нажмите «Показать карту», чтобы загрузить Яндекс.Карты.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
