"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  BriefcaseBusiness,
  Check,
  FileText,
  ImagePlus,
  MessageSquare,
  Package,
  Plus,
  Save,
  Settings,
  Trash2,
  Users,
  Volume2,
} from "lucide-react";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  patronymic?: string | null;
  role: string;
}

interface ContactMethod {
  id: number;
  user_id: number;
  type: string;
  value: string;
  comment: string | null;
  created_at: string;
}

interface Order {
  id: number;
  user_id: number;

  service_id: number | null;
  title: string;
  description: string | null;
  status: string;
  stage: string;
  due_date: string | null;
  installation_date: string | null;
  created: string | null;
  closed_at: string | null;
}

interface Ticket {
  id: number;
  user_id: number | null;
  name: string;
  phone: string | null;
  email: string | null;
  description: string | null;
  status: string;
  created_at: string;
  closed_at: string | null;
}

interface BotBlock {
  type: string;
  content: string;
}

interface ContentItem {
  id: number;
  name: string;
  description: string | null;
  photo_url: string | null;
  price?: string | null;
}

type Tab = "orders" | "tickets" | "services" | "portfolio" | "bot" | "users";

const staffRoles = new Set(["admin", "moderator"]);

const orderStatuses = [
  { value: "draft", label: "Черновик" },
  { value: "active", label: "В работе" },
  { value: "installation", label: "Монтаж" },
  { value: "closed", label: "Закрыт" },
];

const ticketStatuses = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "closed", label: "Закрыта" },
];

export default function AdminPanel() {
  const { user, token } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const isStaff = Boolean(user && staffRoles.has(user.role));
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  // контактные данные будут подгружаться по user_id

  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userContactsByUserId, setUserContactsByUserId] = useState<Record<number, ContactMethod[]>>({});
  const [services, setServices] = useState<ContentItem[]>([]);

  const [portfolio, setPortfolio] = useState<ContentItem[]>([]);
  const [blocks, setBlocks] = useState<BotBlock[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const previousOpenTickets = useRef<number | null>(null);

  const [orderForm, setOrderForm] = useState({
    user_id: "",
    service_id: "",
    title: "",
    description: "",
    status: "draft",
    stage: "Черновик",
    due_date: "",
    installation_date: "",
  });

  const [contentForm, setContentForm] = useState({
    name: "",
    description: "",
    price: "",
    photoFile: null as File | null,
  });

  const [botForm, setBotForm] = useState({ type: "", content: "" });

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const notify = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  }, []);

  const playTicketSound = useCallback(() => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.35);
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const requests = [
        fetch("/api/v1/admin/orders", { headers: authHeaders }),
        fetch("/api/v1/admin/tickets", { headers: authHeaders }),
        fetch("/api/v1/portfolio_and_services/services"),
        fetch("/api/v1/portfolio_and_services/portfolio"),
        fetch("/api/v1/admin/bot-config", { headers: authHeaders }),
      ];

      if (isAdmin) requests.push(fetch("/api/v1/admin/users", { headers: authHeaders }));

      const [ordersResponse, ticketsResponse, servicesResponse, portfolioResponse, botResponse, usersResponse] = await Promise.all(requests);

      if (!ordersResponse.ok || !ticketsResponse.ok || !servicesResponse.ok || !portfolioResponse.ok || !botResponse.ok) {
        throw new Error("Не удалось загрузить данные панели");
      }

      const nextOrders: Order[] = await ordersResponse.json();
      const nextTickets: Ticket[] = await ticketsResponse.json();

      // список user_id, по которым нужны контакты
      const userIds = Array.from(new Set(nextOrders.map((o) => o.user_id)));
      const contactsByUserId: Record<number, ContactMethod[]> = {};

      await Promise.all(
        userIds.map(async (userId) => {
          const res = await fetch(`/api/v1/admin/users/${userId}/contact-methods`, { headers: authHeaders });
          if (!res.ok) return;
          contactsByUserId[userId] = (await res.json()) as ContactMethod[];
        })
      );

      const openCount = nextTickets.filter((ticket) => ticket.status !== "closed").length;
      if (previousOpenTickets.current !== null && openCount > previousOpenTickets.current) {
        playTicketSound();
      }
      previousOpenTickets.current = openCount;

      setOrders(nextOrders);
      setTickets(nextTickets);
      setUserContactsByUserId(contactsByUserId);

      setServices(await servicesResponse.json());
      setPortfolio(await portfolioResponse.json());
      const botData = await botResponse.json();
      setBlocks(botData.blocks || []);

      if (isAdmin && usersResponse?.ok) {
        setUsers(await usersResponse.json());
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, isAdmin, notify, playTicketSound, token]);

  useEffect(() => {
    if (!user) return;
    if (!isStaff) {
      router.push("/");
      return;
    }
    void loadData();
  }, [isStaff, loadData, router, user]);

  useEffect(() => {
    if (!token || !isStaff) return;
    const interval = window.setInterval(() => void loadData(), 30000);
    return () => window.clearInterval(interval);
  }, [isStaff, loadData, token]);

  const createOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/v1/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        ...orderForm,
        user_id: Number(orderForm.user_id),
        service_id: orderForm.service_id ? Number(orderForm.service_id) : null,
        due_date: orderForm.due_date || null,
        installation_date: orderForm.installation_date || null,
      }),
    });
    if (!response.ok) {
      notify("Не удалось создать заказ");
      return;
    }
    setOrderForm({ user_id: "", service_id: "", title: "", description: "", status: "draft", stage: "Черновик", due_date: "", installation_date: "" });
    notify("Заказ создан");
    await loadData();
  };

  const updateOrderStatus = async (order: Order, status: string) => {
    const response = await fetch(`/api/v1/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ status, stage: orderStatuses.find((item) => item.value === status)?.label || order.stage }),
    });
    if (response.ok) await loadData();
  };

  const closeTicket = async (ticketId: number) => {
    const response = await fetch(`/api/v1/admin/tickets/${ticketId}/close`, { method: "POST", headers: authHeaders });
    if (response.ok) {
      notify("Заявка закрыта");
      await loadData();
    }
  };

  const updateRole = async (userId: number, role: string) => {
    const response = await fetch(`/api/v1/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ role }),
    });
    if (response.ok) await loadData();
  };

  const saveBotConfig = async () => {
    const nextBlocks = botForm.type.trim() ? [...blocks, { type: botForm.type, content: botForm.content }] : blocks;
    const response = await fetch("/api/v1/admin/bot-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ blocks: nextBlocks }),
    });
    if (response.ok) {
      setBotForm({ type: "", content: "" });
      notify("Настройки бота сохранены");
      await loadData();
    }
  };

  const createContent = async (type: "services" | "portfolio", event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData();
    data.append("name", contentForm.name);
    if (contentForm.description) data.append("description", contentForm.description);
    if (type === "services" && contentForm.price) data.append("price", contentForm.price);
    if (contentForm.photoFile) data.append("photo_file", contentForm.photoFile);

    const path = type === "services" ? "create_service" : "create_portfolio";
    const response = await fetch(`/api/v1/portfolio_and_services/${path}`, {
      method: "POST",
      headers: authHeaders,
      body: data,
    });
    if (response.ok) {
      setContentForm({ name: "", description: "", price: "", photoFile: null });
      notify(type === "services" ? "Услуга добавлена" : "Работа добавлена");
      await loadData();
    }
  };

  const deleteContent = async (type: "services" | "portfolio", id: number) => {
    const response = await fetch(`/api/v1/portfolio_and_services/${type}/${id}`, { method: "DELETE", headers: authHeaders });
    if (response.ok) await loadData();
  };

  if (!isStaff) return null;

  const tabs = ([
    { id: "orders", label: "Заказы", icon: <BriefcaseBusiness size={18} /> },
    { id: "tickets", label: "Заявки", icon: <Bell size={18} /> },
    { id: "services", label: "Услуги", icon: <Package size={18} /> },
    { id: "portfolio", label: "Работы", icon: <ImagePlus size={18} /> },
    { id: "bot", label: "Бот", icon: <MessageSquare size={18} /> },
    { id: "users", label: "Пользователи", icon: <Users size={18} />, adminOnly: true },
  ] satisfies Array<{ id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }>).filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-4">
        <section className="section-panel p-5 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="section-eyebrow">{isAdmin ? "Администратор" : "Модератор"}</div>
              <h1 className="mt-5 flex items-center gap-3 text-3xl font-semibold sm:text-4xl">
                <Settings size={32} />
                Панель управления
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                Заказы, заявки, услуги, работы и настройки бота. Реестр пользователей доступен только администратору.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-[20px] border border-white/10 bg-white/[0.03] p-1 md:grid-cols-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab.id ? "bg-white text-black" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {message && <Status text={message} />}
        {loading && <div className="section-panel p-8 text-center text-sm text-zinc-500">Загрузка...</div>}

        {!loading && activeTab === "orders" && (
          <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <Panel title="Создать заказ" note="Заказ можно оставить черновиком и закрыть после выполнения.">
              <form className="grid gap-3" onSubmit={createOrder}>
                {isAdmin ? (
                  <Select label="Клиент" required value={orderForm.user_id} onChange={(value) => setOrderForm((state) => ({ ...state, user_id: value }))}>
                    <option value="">Выберите клиента</option>
                    {users.map((client) => (
                      <option key={client.id} value={client.id}>{client.last_name} {client.first_name} - {client.email}</option>
                    ))}
                  </Select>
                ) : (
                  <Field label="ID клиента" required type="number" value={orderForm.user_id} onChange={(value) => setOrderForm((state) => ({ ...state, user_id: value }))} />
                )}
                <Select label="Услуга" value={orderForm.service_id} onChange={(value) => setOrderForm((state) => ({ ...state, service_id: value }))}>
                  <option value="">Без услуги</option>
                  {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                </Select>
                <Field label="Название" required value={orderForm.title} onChange={(value) => setOrderForm((state) => ({ ...state, title: value }))} />
                <Textarea label="Описание" value={orderForm.description} onChange={(value) => setOrderForm((state) => ({ ...state, description: value }))} />
                <Select label="Статус" value={orderForm.status} onChange={(value) => setOrderForm((state) => ({ ...state, status: value, stage: orderStatuses.find((item) => item.value === value)?.label || state.stage }))}>
                  {orderStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </Select>
                <Field label="Стадия" value={orderForm.stage} onChange={(value) => setOrderForm((state) => ({ ...state, stage: value }))} />
                <Field label="Дата выполнения" type="date" value={orderForm.due_date} onChange={(value) => setOrderForm((state) => ({ ...state, due_date: value }))} />
                <Field label="Дата монтажа" type="date" value={orderForm.installation_date} onChange={(value) => setOrderForm((state) => ({ ...state, installation_date: value }))} />
                <PrimaryButton icon={<Plus size={17} />} text="Создать заказ" />
              </form>
            </Panel>
            <Panel title="Список заказов" note={`${orders.length} записей`}>
              <div className="grid gap-3">
                {orders.map((order) => {
                  const client = users.find((u) => u.id === order.user_id);
                  const contacts = userContactsByUserId[order.user_id] || [];
                  return (
                    <article key={order.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold">{order.title}</h3>
                          <p className="mt-1 text-sm text-zinc-500">{order.description || "Без описания"}</p>

                          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-600">
                            Клиент #{order.user_id}
                            {client ? ` | ${client.last_name} ${client.first_name}` : ""} | {order.stage} | создан {formatDate(order.created)}
                          </p>

                          <p className="mt-2 text-sm text-zinc-400">
                            Выполнение: {formatDate(order.due_date)} | Монтаж: {formatDate(order.installation_date)}
                          </p>

                          {contacts.length > 0 ? (
                            <div className="mt-3 grid gap-1 text-sm text-zinc-400">
                              {contacts.map((c) => (
                                <div key={`${c.id}-${c.type}`}>
                                  {c.type}: {c.value}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-zinc-600">Способы связи будут загружены…</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <select
                            className="h-10 rounded-2xl border border-white/10 bg-[#050505] px-3 text-sm"
                            value={order.status}
                            onChange={(event) => void updateOrderStatus(order, event.target.value)}
                          >
                            {orderStatuses.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Panel>
          </section>
        )}

        {!loading && activeTab === "tickets" && (
          <Panel title="Заявки на обратную связь">
            <div className="grid gap-3 lg:grid-cols-2">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{ticket.name}</h3>
                      <p className="mt-1 text-sm text-zinc-500">{ticket.description || "Без описания"}</p>
                    </div>
                    <Badge text={ticketStatuses.find((status) => status.value === ticket.status)?.label || ticket.status} />
                  </div>
                  <div className="mt-4 grid select-text gap-1 text-sm text-zinc-400">
                    <span>Телефон: {ticket.phone || "-"}</span>
                    <span>Email: {ticket.email || "-"}</span>
                    <span>Дата: {formatDateTime(ticket.created_at)}</span>
                  </div>
                  {ticket.status !== "closed" && (
                    <button className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black" onClick={() => void closeTicket(ticket.id)} type="button">
                      <Check size={16} />
                      Закрыть заявку
                    </button>
                  )}
                </article>
              ))}
            </div>
          </Panel>
        )}

        {!loading && activeTab === "users" && isAdmin && (
          <Panel title="Реестр пользователей" note={`${users.length} аккаунтов`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr>
                    <Th>Пользователь</Th>
                    <Th>Email</Th>
                    <Th>Роль</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm">{item.last_name} {item.first_name}</td>
                      <td className="px-4 py-3 text-sm text-zinc-400">{item.email}</td>
                      <td className="px-4 py-3">
                        <select className="h-10 rounded-2xl border border-white/10 bg-[#050505] px-3 text-sm" value={item.role} onChange={(event) => void updateRole(item.id, event.target.value)}>
                          <option value="common">Клиент</option>
                          <option value="moderator">Модератор</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {!loading && (activeTab === "services" || activeTab === "portfolio") && (
          <ContentEditor
            items={activeTab === "services" ? services : portfolio}
            form={contentForm}
            setForm={setContentForm}
            withPrice={activeTab === "services"}
            title={activeTab === "services" ? "Услуги" : "Работы"}
            onCreate={(event) => void createContent(activeTab, event)}
            onDelete={(id) => void deleteContent(activeTab, id)}
          />
        )}

        {!loading && activeTab === "bot" && (
          <Panel title="Настройки бота" note="Блоки используются как база знаний для ассистента.">
            <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="grid gap-3">
                <Field label="Тип блока" value={botForm.type} onChange={(value) => setBotForm((state) => ({ ...state, type: value }))} />
                <Textarea label="Содержимое" value={botForm.content} onChange={(value) => setBotForm((state) => ({ ...state, content: value }))} />
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-black" onClick={() => void saveBotConfig()} type="button">
                  <Save size={17} />
                  Сохранить блоки
                </button>
              </div>
              <div className="grid gap-3">
                {blocks.map((block, index) => (
                  <article key={`${block.type}-${index}`} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold"><FileText size={16} />{block.type}</div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-500">{block.content}</p>
                  </article>
                ))}
              </div>
            </div>
          </Panel>
        )}
      </div>
    </main>
  );
}

function ContentEditor({
  form,
  items,
  onCreate,
  onDelete,
  setForm,
  title,
  withPrice,
}: {
  form: { name: string; description: string; price: string; photoFile: File | null };
  items: ContentItem[];
  onCreate: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: (id: number) => void;
  setForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; price: string; photoFile: File | null }>>;
  title: string;
  withPrice: boolean;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
      <Panel title={`Добавить: ${title}`} note="Запись сразу появится на сайте.">
        <form className="grid gap-3" onSubmit={onCreate}>
          <Field label="Название" required value={form.name} onChange={(value) => setForm((state) => ({ ...state, name: value }))} />
          <Textarea label="Описание" value={form.description} onChange={(value) => setForm((state) => ({ ...state, description: value }))} />
          {withPrice && <Field label="Цена" value={form.price} onChange={(value) => setForm((state) => ({ ...state, price: value }))} />}
          <label className="grid gap-2 text-sm text-zinc-300">
            <span>Фото</span>
            <input className="text-sm text-zinc-400" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setForm((state) => ({ ...state, photoFile: event.target.files?.[0] ?? null }))} />
          </label>
          <PrimaryButton icon={<Plus size={17} />} text="Добавить" />
        </form>
      </Panel>
      <Panel title={`Текущие: ${title}`} note={`${items.length} записей`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03]">
              <div className="aspect-[4/3] bg-[#050505]">
                {item.photo_url ? <img src={`/api${item.photo_url}`} alt={item.name} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold">{item.name}</h3>
                  <button className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-100" onClick={() => onDelete(item.id)} type="button">
                    <Trash2 size={15} />
                  </button>
                </div>
                {item.description && <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{item.description}</p>}
                {item.price && <p className="mt-3 text-sm font-semibold">{item.price}</p>}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Panel({ children, note, title }: { children: React.ReactNode; note?: string; title: string }) {
  return (
    <section className="section-panel overflow-hidden p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {note && <p className="mt-1 text-sm text-zinc-500">{note}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}


function Field({ label, onChange, required, type = "text", value }: { label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <input className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none" onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} />
    </label>
  );
}

function Textarea({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <textarea className="min-h-28 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function Select({ children, label, onChange, required, value }: { children: React.ReactNode; label: string; onChange: (value: string) => void; required?: boolean; value: string }) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <select className="h-11 rounded-2xl border border-white/10 bg-[#050505] px-4 text-sm outline-none" onChange={(event) => onChange(event.target.value)} required={required} value={value}>
        {children}
      </select>
    </label>
  );
}

function PrimaryButton({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-black" type="submit">{icon}{text}</button>;
}

function Status({ text }: { text: string }) {
  return <div className="rounded-[22px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{text}</div>;
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">{text}</span>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">{children}</th>;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  // SSR/CSR-safe formatting (no locale/timezone differences)
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy}`;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}