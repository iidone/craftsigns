"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getFriendlyFetchError } from "@/utils/forms";
import {
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  FileText,
  ImagePlus,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  Users,
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
  price: string | null;
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

interface TelegramRecipient {
  id: number;
  telegram_user_id: number;
  created_at: string;
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
  const { user, token, isReady } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const isStaff = Boolean(user && staffRoles.has(user.role));
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  // контактные данные будут подгружаться по user_id

  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [telegramRecipients, setTelegramRecipients] = useState<TelegramRecipient[]>([]);
  const [userContactsByUserId, setUserContactsByUserId] = useState<Record<number, ContactMethod[]>>({});
  const [services, setServices] = useState<ContentItem[]>([]);

  const [portfolio, setPortfolio] = useState<ContentItem[]>([]);
  const [blocks, setBlocks] = useState<BotBlock[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(true);
  const previousOpenTickets = useRef<number | null>(null);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const ADMIN_PAGE_SIZE = 5;
  const [ordersShown, setOrdersShown] = useState(ADMIN_PAGE_SIZE);
  const [ticketsShown, setTicketsShown] = useState(ADMIN_PAGE_SIZE);

  const [orderForm, setOrderForm] = useState({
    user_id: "",
    service_id: "",
    title: "",
    description: "",
    status: "draft",
    stage: "Черновик",
    price: "",
    due_date: "",
    installation_date: "",
  });

  const [orderUserQuery, setOrderUserQuery] = useState("");
  const [orderUserOpen, setOrderUserOpen] = useState(false);
  const [usersQuery, setUsersQuery] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState<"all" | "common" | "moderator" | "admin">("all");

  const [contentForm, setContentForm] = useState({
    name: "",
    description: "",
    price: "",
    photoFile: null as File | null,
  });

  const [botForm, setBotForm] = useState({ type: "", content: "" });
  const [botEditingIndex, setBotEditingIndex] = useState<number | null>(null);
  const [telegramForm, setTelegramForm] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    text: string;
    confirmText: string;
    onConfirm: (() => Promise<void>) | null;
  }>({ isOpen: false, title: "", text: "", confirmText: "Удалить", onConfirm: null });

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const filteredOrderUsers = useMemo(() => {
    if (!orderUserQuery.trim()) return users;
    const q = orderUserQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.patronymic?.toLowerCase() ?? "").includes(q),
    );
  }, [users, orderUserQuery]);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (usersRoleFilter !== "all") result = result.filter((u) => u.role === usersRoleFilter);
    if (!usersQuery.trim()) return result;
    const q = usersQuery.toLowerCase();
    return result.filter(
      (u) =>
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.patronymic?.toLowerCase() ?? "").includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, usersQuery, usersRoleFilter]);

  const notify = useCallback((text: string, type: "success" | "error" = "success") => {
    setMessage(text);
    setMessageType(type);
    window.setTimeout(() => setMessage(""), 4000);
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
      if (isAdmin) requests.push(fetch("/api/v1/admin/telegram-recipients", { headers: authHeaders }));

      const [ordersResponse, ticketsResponse, servicesResponse, portfolioResponse, botResponse, usersResponse, telegramResponse] = await Promise.all(requests);

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

      if (isAdmin && telegramResponse?.ok) {
        setTelegramRecipients(await telegramResponse.json());
      }
    } catch (error) {
      notify(getFriendlyFetchError(error, "Сервер не отвечает. Попробуйте позже."));
    } finally {
      setLoading(false);
    }
  }, [authHeaders, isAdmin, notify, playTicketSound, token]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) return;
    if (!isStaff) {
      router.push("/");
      return;
    }
    void loadData();
  }, [isReady, isStaff, loadData, router, user]);

  useEffect(() => {
    if (!isReady || !token || !isStaff) return;
    const interval = window.setInterval(() => void loadData(), 30000);
    return () => window.clearInterval(interval);
  }, [isReady, isStaff, loadData, token]);

  const createOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/v1/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        ...orderForm,
        user_id: Number(orderForm.user_id),
        service_id: orderForm.service_id ? Number(orderForm.service_id) : null,
        price: orderForm.price ? Number(orderForm.price) : null,
        due_date: orderForm.due_date || null,
        installation_date: orderForm.installation_date || null,
      }),
    });
    if (!response.ok) {
      notify("Не удалось создать заказ. Проверьте данные и попробуйте ещё раз.", "error");
      return;
    }
    setOrderForm({ user_id: "", service_id: "", title: "", description: "", status: "draft", stage: "Черновик", price: "", due_date: "", installation_date: "" });
    setOrderUserQuery("");
    notify("Заказ создан");
    await loadData();
  };

  const updateOrderPrice = async (order: Order, priceStr: string) => {
    const price = priceStr.trim() === "" ? null : Number(priceStr);
    if (priceStr.trim() !== "" && (Number.isNaN(price) || (price !== null && price < 0))) {
      notify("Стоимость должна быть положительным числом.");
      return;
    }
    const response = await fetch(`/api/v1/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ price }),
    });
    if (response.ok) {
      notify("Стоимость обновлена");
      await loadData();
      return;
    }
    notify("Не удалось обновить стоимость. Попробуйте позже.", "error");
  };

  const updateOrderStatus = async (order: Order, status: string) => {
    const response = await fetch(`/api/v1/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ status, stage: orderStatuses.find((item) => item.value === status)?.label || order.stage }),
    });
    if (response.ok) {
      notify("Статус заказа обновлён");
      await loadData();
      return;
    }
    notify("Не удалось обновить статус заказа. Попробуйте позже.", "error");
  };

  const closeTicket = async (ticketId: number) => {
    const response = await fetch(`/api/v1/admin/tickets/${ticketId}/close`, { method: "POST", headers: authHeaders });
    if (response.ok) {
      notify("Заявка закрыта");
      await loadData();
      return;
    }
    notify("Не удалось закрыть заявку. Попробуйте позже.", "error");
  };

  const addTelegramRecipient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const telegramId = Number(telegramForm.trim());
    if (!telegramForm.trim() || !Number.isFinite(telegramId)) {
      notify("Введите числовой Telegram ID");
      return;
    }

    const response = await fetch("/api/v1/admin/telegram-recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ telegram_user_id: telegramId }),
    });

    if (!response.ok) {
      notify("Не удалось добавить получателя", "error");
      return;
    }

    setTelegramForm("");
    notify("Получатель Telegram добавлен");
    await loadData();
  };

  const deleteTelegramRecipient = async (id: number) => {
    const response = await fetch(`/api/v1/admin/telegram-recipients/${id}`, { method: "DELETE", headers: authHeaders });
    if (response.ok) {
      notify("Получатель Telegram удалён");
      await loadData();
      return;
    }
    notify("Не удалось удалить получателя Telegram. Попробуйте позже.", "error");
  };

  const updateRole = async (userId: number, role: string) => {
    const response = await fetch(`/api/v1/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ role }),
    });
    if (response.ok) {
      notify("Роль пользователя обновлена");
      await loadData();
      return;
    }
    notify("Не удалось изменить роль пользователя. Попробуйте позже.", "error");
  };

  const persistBotBlocks = async (nextBlocks: BotBlock[], successText = "Настройки бота сохранены") => {
    const response = await fetch("/api/v1/admin/bot-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ blocks: nextBlocks }),
    });
    if (response.ok) {
      setBlocks(nextBlocks);
      notify(successText);
      await loadData();
      return true;
    }
    notify("Не удалось сохранить настройки бота", "error");
    return false;
  };

  const saveBotConfig = async () => {
    const type = botForm.type.trim();
    const content = botForm.content.trim();
    if (!type || !content) {
      notify("Заполните тип и содержимое блока");
      return;
    }

    const nextBlock = { type, content };
    const nextBlocks =
      botEditingIndex === null
        ? [...blocks, nextBlock]
        : blocks.map((block, index) => (index === botEditingIndex ? nextBlock : block));

    const saved = await persistBotBlocks(nextBlocks, botEditingIndex === null ? "Блок добавлен" : "Блок обновлён");
    if (!saved) return;
    setBotForm({ type: "", content: "" });
    setBotEditingIndex(null);
  };

  const editBotBlock = (block: BotBlock, index: number) => {
    setBotForm({ type: block.type, content: block.content });
    setBotEditingIndex(index);
  };

  const cancelBotEdit = () => {
    setBotForm({ type: "", content: "" });
    setBotEditingIndex(null);
  };

  const deleteBotBlock = async (indexToDelete: number) => {
    const nextBlocks = blocks.filter((_, index) => index !== indexToDelete);
    const saved = await persistBotBlocks(nextBlocks, "Блок удалён");
    if (!saved) return;
    if (botEditingIndex === indexToDelete) {
      cancelBotEdit();
    } else if (botEditingIndex !== null && botEditingIndex > indexToDelete) {
      setBotEditingIndex(botEditingIndex - 1);
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
      return;
    }
    notify(type === "services" ? "Не удалось добавить услугу. Проверьте поля формы." : "Не удалось добавить работу. Проверьте поля формы.");
  };

  const deleteContent = async (type: "services" | "portfolio", id: number) => {
    const response = await fetch(`/api/v1/portfolio_and_services/${type}/${id}`, { method: "DELETE", headers: authHeaders });
    if (response.ok) {
      notify(type === "services" ? "Услуга удалена" : "Работа удалена");
      await loadData();
      return;
    }
    notify(type === "services" ? "Не удалось удалить услугу. Попробуйте позже." : "Не удалось удалить работу. Попробуйте позже.");
  };

  const requestConfirm = (dialog: Omit<typeof confirmAction, "isOpen">) => {
    setConfirmAction({ ...dialog, isOpen: true });
  };

  const closeConfirm = () => {
    setConfirmAction({ isOpen: false, title: "", text: "", confirmText: "Удалить", onConfirm: null });
  };

  if (!isReady) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-4">
          <section className="section-panel p-8 text-center text-sm text-zinc-500">
            Проверка доступа...
          </section>
        </div>
      </main>
    );
  }

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
                Конфигурация разделов и взаимодействия с клиентами.
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

        {message && activeTab !== "orders" && <Status text={message} type={messageType} />}
        {loading && <div className="section-panel p-8 text-center text-sm text-zinc-500">Загрузка...</div>}

        {!loading && activeTab === "orders" && (
          <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <Panel title="Создать заказ" note="Заказ можно оставить черновиком и закрыть после выполнения.">
              <form className="grid gap-3" onSubmit={createOrder}>
                {isAdmin ? (
                  <UserSearchField
                    label="Клиент"
                    query={orderUserQuery}
                    open={orderUserOpen}
                    users={filteredOrderUsers}
                    onQueryChange={(q) => {
                      setOrderUserQuery(q);
                      setOrderUserOpen(true);
                      if (orderForm.user_id) setOrderForm((s) => ({ ...s, user_id: "" }));
                    }}
                    onSelect={(u) => {
                      setOrderForm((s) => ({ ...s, user_id: String(u.id) }));
                      setOrderUserQuery(`${u.last_name} ${u.first_name} — ${u.email}`);
                      setOrderUserOpen(false);
                    }}
                    onFocus={() => setOrderUserOpen(true)}
                    onBlur={() => window.setTimeout(() => setOrderUserOpen(false), 150)}
                  />
                ) : (
                  <Field label="ID клиента" required type="number" value={orderForm.user_id} onChange={(value) => setOrderForm((state) => ({ ...state, user_id: value }))} />
                )}
                <Select label="Услуга" value={orderForm.service_id} onChange={(value) => setOrderForm((state) => ({ ...state, service_id: value }))}>
                  <option value="">Без услуги</option>
                  {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                </Select>
                <Field label="Название" required value={orderForm.title} onChange={(value) => setOrderForm((state) => ({ ...state, title: value }))} />
                <Textarea label="Описание" required value={orderForm.description} onChange={(value) => setOrderForm((state) => ({ ...state, description: value }))} />
                <Select label="Статус" required value={orderForm.status} onChange={(value) => setOrderForm((state) => ({ ...state, status: value, stage: orderStatuses.find((item) => item.value === value)?.label || state.stage }))}>
                  {orderStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </Select>
                <Field label="Стадия" required value={orderForm.stage} onChange={(value) => setOrderForm((state) => ({ ...state, stage: value }))} />
                <Field label="Стоимость (₽)" type="number" value={orderForm.price} onChange={(value) => setOrderForm((state) => ({ ...state, price: value }))} />
                <Field label="Дата выполнения" required type="date" min={todayStr} value={orderForm.due_date} onChange={(value) => setOrderForm((state) => ({ ...state, due_date: value }))} />
                <Field label="Дата монтажа" type="date" min={todayStr} value={orderForm.installation_date} onChange={(value) => setOrderForm((state) => ({ ...state, installation_date: value }))} />
                <PrimaryButton icon={<Plus size={17} />} text="Создать заказ" />
                {message && activeTab === "orders" && <Status text={message} type={messageType} />}
              </form>
            </Panel>
            <Panel title="Список заказов" note={`${orders.length} записей`}>
              <div className="grid gap-3">
                {orders.slice(0, ordersShown).map((order) => {
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
                            Дата выполнения: {formatDate(order.due_date)} | Дата монтажа: {formatDate(order.installation_date)}
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

                        <div className="flex flex-col gap-2">
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
                          <PriceInput
                            value={order.price ?? ""}
                            onSave={(val) => void updateOrderPrice(order, val)}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
                {orders.length > ordersShown && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08]"
                    onClick={() => setOrdersShown((n) => n + ADMIN_PAGE_SIZE)}
                  >
                    <ChevronDown size={16} />
                    Показать ещё ({orders.length - ordersShown})
                  </button>
                )}
              </div>
            </Panel>
          </section>
        )}

        {!loading && activeTab === "tickets" && (
          <Panel title="Заявки на обратную связь">
            {isAdmin && (
              <div className="mb-5 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Telegram-уведомления</h3>
                    <p className="mt-1 text-sm text-zinc-500">Получатели новых заявок. Нужен Telegram ID пользователя.</p>
                  </div>
                  <form className="flex gap-2" onSubmit={addTelegramRecipient}>
                    <input
                      className="h-11 min-w-0 rounded-2xl border border-white/10 bg-[#050505] px-4 text-sm outline-none"
                      inputMode="numeric"
                      placeholder="Telegram ID"
                      value={telegramForm}
                      onChange={(event) => setTelegramForm(event.target.value.replace(/[^\d-]/g, ""))}
                    />
                    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-medium text-black" type="submit">
                      <Plus size={16} />
                      Добавить
                    </button>
                  </form>
                </div>
                {telegramRecipients.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {telegramRecipients.map((recipient) => (
                      <span key={recipient.id} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#050505] px-3 py-2 text-sm text-zinc-300">
                        {recipient.telegram_user_id}
                        <button
                          className="text-red-100 transition hover:text-red-300"
                          onClick={() =>
                            requestConfirm({
                              title: "Удалить получателя?",
                              text: `Telegram ID ${recipient.telegram_user_id} больше не будет получать уведомления о новых заявках.`,
                              confirmText: "Удалить",
                              onConfirm: () => deleteTelegramRecipient(recipient.id),
                            })
                          }
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="grid gap-3 lg:grid-cols-2">
              {tickets.slice(0, ticketsShown).map((ticket) => (
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
            {tickets.length > ticketsShown && (
              <button
                type="button"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08]"
                onClick={() => setTicketsShown((n) => n + ADMIN_PAGE_SIZE)}
              >
                <ChevronDown size={16} />
                Показать ещё ({tickets.length - ticketsShown})
              </button>
            )}
          </Panel>
        )}

        {!loading && activeTab === "users" && isAdmin && (
          <Panel title="Реестр пользователей" note={usersQuery.trim() ? `${filteredUsers.length} из ${users.length} аккаунтов` : `${users.length} аккаунтов`}>
            <div className="relative mb-3">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-zinc-400 outline-none transition placeholder:text-zinc-600 focus:border-white/30"
                placeholder="Поиск по имени, email..."
                value={usersQuery}
                onChange={(e) => setUsersQuery(e.target.value)}
              />
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  { value: "all", label: "Все" },
                  { value: "common", label: "Клиенты" },
                  { value: "moderator", label: "Модераторы" },
                  { value: "admin", label: "Администраторы" },
                ] as const
              ).map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`rounded-2xl border px-4 py-1.5 text-sm font-medium transition ${
                    usersRoleFilter === f.value
                      ? "border-white/20 bg-white text-black"
                      : "border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                  }`}
                  onClick={() => setUsersRoleFilter(f.value)}
                >
                  {f.label}
                  {f.value !== "all" && (
                    <span className="ml-1.5 text-xs opacity-60">
                      {users.filter((u) => u.role === f.value).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
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
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-sm text-zinc-500">Не найдено</td>
                    </tr>
                  )}
                  {filteredUsers.map((item) => (
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
            onDelete={(id) =>
              requestConfirm({
                title: "Удалить запись?",
                text: "Запись пропадёт с сайта после удаления.",
                confirmText: "Удалить",
                onConfirm: () => deleteContent(activeTab, id),
              })
            }
          />
        )}

        {!loading && activeTab === "bot" && (
          <Panel title="Настройки бота" note="Блоки используются как база знаний для ассистента.">
            <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="grid gap-3">
                {botEditingIndex !== null && (
                  <div className="rounded-[18px] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    Редактируется блок #{botEditingIndex + 1}
                  </div>
                )}
                <Field label="Тип блока" value={botForm.type} onChange={(value) => setBotForm((state) => ({ ...state, type: value }))} />
                <Textarea label="Содержимое" value={botForm.content} onChange={(value) => setBotForm((state) => ({ ...state, content: value }))} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-black" onClick={() => void saveBotConfig()} type="button">
                    <Save size={17} />
                    {botEditingIndex === null ? "Добавить блок" : "Сохранить"}
                  </button>
                  {botEditingIndex !== null && (
                    <button className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white transition hover:bg-white/[0.08]" onClick={cancelBotEdit} type="button">
                      Отмена
                    </button>
                  )}
                </div>
              </div>
              <div className="grid gap-3">
                {blocks.map((block, index) => (
                  <article key={`${block.type}-${index}`} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                        <FileText size={16} />
                        <span className="truncate">{block.type}</span>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-zinc-200 transition hover:bg-white/[0.08]" onClick={() => editBotBlock(block, index)} type="button" aria-label="Редактировать блок">
                          <Pencil size={15} />
                        </button>
                        <button
                          className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-100 transition hover:bg-red-500/20"
                          onClick={() =>
                            requestConfirm({
                              title: "Удалить блок?",
                              text: `Блок "${block.type}" будет удалён из базы знаний бота.`,
                              confirmText: "Удалить",
                              onConfirm: () => deleteBotBlock(index),
                            })
                          }
                          type="button"
                          aria-label="Удалить блок"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-500">{block.content}</p>
                  </article>
                ))}
              </div>
            </div>
          </Panel>
        )}
      </div>
      {confirmAction.isOpen && (
        <ConfirmModal
          title={confirmAction.title}
          text={confirmAction.text}
          confirmText={confirmAction.confirmText}
          onCancel={closeConfirm}
          onConfirm={async () => {
            await confirmAction.onConfirm?.();
          }}
        />
      )}
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
                {item.price && <p className="mt-3 text-sm font-semibold">{item.price} ₽</p>}
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


function Field({ label, min, onChange, required, type = "text", value }: { label: string; min?: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <input className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none" min={min} onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} />
    </label>
  );
}

function Textarea({ label, onChange, required, value }: { label: string; onChange: (value: string) => void; required?: boolean; value: string }) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <textarea className="min-h-28 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none" onChange={(event) => onChange(event.target.value)} required={required} value={value} />
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

function PriceInput({ value, onSave }: { value: string | number; onSave: (val: string) => void }) {
  const [local, setLocal] = useState(value !== null && value !== "" ? String(value) : "");

  const handleBlur = () => {
    onSave(local);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative flex h-10 items-center rounded-2xl border border-white/10 bg-[#050505] px-3">
      <input
        className="w-20 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
        type="number"
        min="0"
        placeholder="Цена, ₽"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      <span className="ml-1 shrink-0 text-xs text-zinc-600">₽</span>
    </div>
  );
}

function PrimaryButton({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-black" type="submit">{icon}{text}</button>;
}

function Status({ text, type = "success" }: { text: string; type?: "success" | "error" }) {
  return (
    <div className={`rounded-[22px] border px-4 py-3 text-sm ${
      type === "error"
        ? "border-red-500/30 bg-red-500/10 text-red-200"
        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
    }`}>
      {text}
    </div>
  );
}

function ConfirmModal({
  confirmText,
  onCancel,
  onConfirm,
  text,
  title,
}: {
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  text: string;
  title: string;
}) {
  const [isClosing, setIsClosing] = useState(false);

  const close = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      onCancel();
      setIsClosing(false);
    }, 220);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-opacity duration-300"
      style={{ opacity: isClosing ? 0 : 1 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        className="w-full max-w-md rounded-[26px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] transition-all duration-300"
        style={{
          opacity: isClosing ? 0 : 1,
          transform: isClosing ? "translateY(10px) scale(0.98)" : "translateY(0) scale(1)",
        }}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button className="text-zinc-500 transition hover:text-white" onClick={close} type="button">
            ×
          </button>
        </div>
        <p className="mb-6 text-sm leading-6 text-zinc-300">{text}</p>
        <div className="flex gap-3">
          <button
            className="flex-1 rounded-2xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
            onClick={async () => {
              await onConfirm();
              close();
            }}
            type="button"
          >
            {confirmText}
          </button>
          <button
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08]"
            onClick={close}
            type="button"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">{text}</span>;
}

function UserSearchField({
  label,
  onBlur,
  onFocus,
  onQueryChange,
  onSelect,
  open,
  query,
  users,
}: {
  label: string;
  onBlur: () => void;
  onFocus: () => void;
  onQueryChange: (q: string) => void;
  onSelect: (user: User) => void;
  open: boolean;
  query: string;
  users: User[];
}) {
  return (
    <div className="relative grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          autoComplete="off"
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-zinc-400 outline-none transition focus:border-white/30"
          placeholder="Поиск по имени или email..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
      {open && (
        <div className="absolute top-[72px] left-0 right-0 z-20 max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0b0c] shadow-lg">
          {users.length === 0 ? (
            <div className="px-4 py-3 text-sm text-zinc-500">Не найдено</div>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-white/[0.06]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(u)}
              >
                {u.last_name} {u.first_name} — {u.email}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
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
  const d = parseServerDateTime(value);
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(d);
}

function parseServerDateTime(value: string) {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}
