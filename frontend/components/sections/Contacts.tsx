"use client";

import { useEffect, useMemo, useState } from "react";
import { Map, Placemark, YMaps } from "@pbe/react-yandex-maps";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatPhone, getFriendlyError, isAbortError } from "@/utils/forms";

interface ContactMethod {
  id: number;
  type: string;
  value: string;
  comment: string | null;
  created_at: string;
  is_locked?: boolean;
  is_virtual?: boolean;
}

const contacts = [
  { icon: Phone, title: "Телефон", value: "+7 (900) 123-45-67", href: "tel:+79001234567" },
  { icon: Mail, title: "Email", value: "craftsigns@yandex.ru", href: "mailto:craftsigns@yandex.ru" },
  { icon: MapPin, title: "Адрес", value: "г. Москва, ул. Остаповский пр-д, д. 13" },
];

export const Contacts = () => {
  const { token, user } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", email: "", description: "" });
  const [lockedContacts, setLockedContacts] = useState({ phone: false, email: false });
  const [status, setStatus] = useState("");
  const defaultCoords: [number, number] = [55.7558, 37.6173];
  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""} ${user?.patronymic ?? ""}`.trim();

  const isAuthorized = Boolean(token && user);
  const isNameLocked = Boolean(fullName);
  const isPhoneLocked = useMemo(() => Boolean(lockedContacts.phone && form.phone), [form.phone, lockedContacts.phone]);
  const isEmailLocked = useMemo(() => Boolean(lockedContacts.email && form.email), [form.email, lockedContacts.email]);

  useEffect(() => {
    if (!isAuthorized) return;

    let isMounted = true;

    const loadContactDefaults = async () => {
      try {
        const response = await fetch("/api/v1/dashboard/contact-methods", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok || !isMounted) return;

        const contacts = (await response.json()) as ContactMethod[];
        const phone = contacts.find((contact) => contact.type === "phone")?.value ?? "";
        const email = contacts.find((contact) => contact.type === "Email")?.value ?? user?.email ?? "";

        if (!isMounted) return;

        setLockedContacts({ phone: Boolean(phone), email: Boolean(email) });
        setForm((state) => ({
          ...state,
          name: fullName || state.name,
          phone: phone || state.phone,
          email: email || state.email,
        }));
      } catch (error) {
        if (isMounted && !isAbortError(error)) {
          setStatus("Не удалось загрузить ваши контактные данные. Форму можно заполнить вручную.");
        }
      }
    };

    void loadContactDefaults();

    return () => {
      isMounted = false;
    };
  }, [fullName, isAuthorized, token, user?.email]);

  useEffect(() => {
    if (!fullName) return;
    const timer = window.setTimeout(() => {
      setForm((state) => ({ ...state, name: fullName }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fullName]);

  const submitTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");

    try {
      const response = await fetch(isAuthorized ? "/api/v1/dashboard/tickets" : "/api/v1/dashboard/public-tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setForm((state) => ({
          name: isNameLocked ? fullName : "",
          phone: isPhoneLocked ? state.phone : "",
          email: isEmailLocked ? state.email : "",
          description: "",
        }));
        setStatus("Заявка отправлена. Мы скоро свяжемся с вами.");
        return;
      }

      const data = await response.json().catch(() => null);
      setStatus(getFriendlyError(data, "Не удалось отправить заявку. Попробуйте позже."));
    } catch (error) {
      if (isAbortError(error)) return;
      setStatus("Не удалось отправить заявку. Попробуйте позже.");
    }
  };

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
              Оставьте заявку или свяжитесь напрямую. Менеджер увидит обращение в панели и ответит удобным способом.
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
            <form className="mt-5 grid gap-3" onSubmit={submitTicket}>
              <input
                type="text"
                placeholder="Ваше имя"
                required
                value={form.name}
                onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
                disabled={isNameLocked}
                readOnly={isNameLocked}
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07] disabled:cursor-not-allowed disabled:text-zinc-400"
              />
              <input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={form.phone}
                onChange={(event) => setForm((state) => ({ ...state, phone: formatPhone(event.target.value) }))}
                disabled={isPhoneLocked}
                readOnly={isPhoneLocked}
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07] disabled:cursor-not-allowed disabled:text-zinc-400"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
                disabled={isEmailLocked}
                readOnly={isEmailLocked}
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07] disabled:cursor-not-allowed disabled:text-zinc-400"
              />
              <textarea
                placeholder="Расскажите о проекте"
                rows={5}
                value={form.description}
                onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
                className="resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                <Send size={17} />
                Отправить заявку
              </button>
              {status && <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">{status}</p>}
            </form>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Расположение</h3>
              <p className="mt-1 text-sm text-zinc-500">Карта открыта сразу, чтобы показать подключение Яндекс.Карт.</p>
            </div>
          </div>

          <div className="h-[320px] overflow-hidden rounded-[22px] border border-white/10 bg-[#050505]">
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
          </div>
        </div>
      </div>
    </section>
  );
};
