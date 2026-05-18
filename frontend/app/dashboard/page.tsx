"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, MessageSquarePlus, Phone, Plus, Trash2, UserRound, X } from "lucide-react";

interface Order {
  id: number;
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
  name: string;
  phone: string | null;
  email: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

interface ContactMethod {
  id: number;
  type: string;
  value: string;
  comment: string | null;
  created_at: string;
  is_locked?: boolean;
  is_virtual?: boolean;
}

const orderStatusLabels: Record<string, string> = {
  draft: "Черновик",
  active: "В работе",
  installation: "Монтаж",
  closed: "Закрыт",
};

const ticketStatusLabels: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  closed: "Закрыта",
};

const availableContactTypes = [
  { value: "phone", label: "Телефон" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
];

const typeLabels: Record<string, string> = {
  phone: "Телефон",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  Email: "Email",
};

export default function DashboardPage() {
  const { token, user } = useAuth();
  const router = useRouter();

  const staffRoles = new Set(["admin", "moderator"]);
  const isStaff = Boolean(user && staffRoles.has(user.role));

  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [contacts, setContacts] = useState<ContactMethod[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    contactId: number | null;
    contactType: string;
    contactValue: string;
  }>({
    isOpen: false,
    contactId: null,
    contactType: "",
    contactValue: "",
  });

  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""} ${user?.patronymic ?? ""}`.trim();
  const [ticketForm, setTicketForm] = useState({ name: fullName, phone: "", email: "", description: "" });
  const [contactForm, setContactForm] = useState({ type: "phone", value: "", comment: "" });

  useEffect(() => {
    setTicketForm((s) => ({ ...s, name: fullName }));
  }, [fullName]);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage(text);
    setMessageType(type);
    window.setTimeout(() => setMessage(""), 3000);
  };

  const loadData = useCallback(async () => {
    if (!token) return;
    const [ordersResponse, ticketsResponse, contactsResponse] = await Promise.all([
      fetch("/api/v1/dashboard/orders", { headers }),
      fetch("/api/v1/dashboard/tickets", { headers }),
      fetch("/api/v1/dashboard/contact-methods", { headers }),
    ]);
    if (ordersResponse.ok) setOrders(await ordersResponse.json());
    if (ticketsResponse.ok) setTickets(await ticketsResponse.json());
    if (contactsResponse.ok) setContacts(await contactsResponse.json());
  }, [headers, token]);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    if (isStaff) {
      router.push("/admin");
      return;
    }

    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [isStaff, loadData, router, user]);

  const createTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/v1/dashboard/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(ticketForm),
    });
    if (response.ok) {
      setTicketForm({ name: fullName, phone: "", email: "", description: "" });
      showMessage("✅ Заявка отправлена");
      await loadData();
    } else {
      showMessage("❌ Не удалось отправить заявку", "error");
    }
  };

  const createContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/v1/dashboard/contact-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(contactForm),
    });

    if (response.ok) {
      setContactForm({ type: "phone", value: "", comment: "" });
      showMessage("✅ Способ связи добавлен");
      await loadData();
      return;
    }

    try {
      const data = await response.json();
      showMessage(`❌ ${data?.detail ?? "Не удалось добавить способ связи"}`, "error");
    } catch {
      showMessage("❌ Не удалось добавить способ связи", "error");
    }
  };

  const openDeleteModal = (contact: ContactMethod) => {
    setDeleteModal({
      isOpen: true,
      contactId: contact.id,
      contactType: contact.type,
      contactValue: contact.value,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      contactId: null,
      contactType: "",
      contactValue: "",
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.contactId) return;
    
    const response = await fetch(`/api/v1/dashboard/contact-methods/${deleteModal.contactId}`, { 
      method: "DELETE", 
      headers 
    });
    
    if (response.ok) {
      showMessage("✅ Способ связи удалён");
      await loadData();
    } else {
      try {
        const data = await response.json();
        showMessage(`❌ ${data?.detail ?? "Не удалось удалить"}`, "error");
      } catch {
        showMessage("❌ Не удалось удалить способ связи", "error");
      }
    }
    closeDeleteModal();
  };

  const existingTypes = contacts
    .filter(c => c.type !== "Email")
    .map(c => c.type);
  
  const availableTypes = availableContactTypes.filter(
    type => !existingTypes.includes(type.value)
  );

  if (!user) return null;
  if (isStaff) return null;

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1240px] gap-4">
        <section className="section-panel p-5 sm:p-8">
          <div className="section-eyebrow">Личный кабинет</div>
          <h1 className="mt-5 flex items-center gap-3 text-3xl font-semibold sm:text-4xl">
            <UserRound size={32} />
            {user.first_name}, ваши заказы и заявки
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Здесь отображаются сформированные менеджером заказы, стадии выполнения, ваши заявки и способы связи.
          </p>
        </section>

        {message && (
          <div className={`rounded-[22px] border px-4 py-3 text-sm ${
            messageType === "success" 
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" 
              : "border-red-500/30 bg-red-500/10 text-red-100"
          }`}>
            {message}
          </div>
        )}

        <section className="section-panel p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Заказы</h2>
          <div className="mt-5 grid gap-3">
            {orders.length === 0 && <Empty text="Сформированных заказов пока нет." />}
            {orders.map((order) => (
              <article key={order.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-semibold">{order.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{order.description || "Без описания"}</p>
                    <p className="mt-3 text-sm text-zinc-400">Стадия: {order.stage}</p>
                    <p className="mt-1 text-sm text-zinc-400">Выполнение: {formatDate(order.due_date)} | Монтаж: {formatDate(order.installation_date)}</p>
                  </div>
                  <Badge text={orderStatusLabels[order.status] || order.status} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Новая заявка" icon={<MessageSquarePlus size={20} />}>
            <form className="grid gap-3" onSubmit={createTicket}>
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>ФИО</span>
                <input
                  className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none text-zinc-400 cursor-not-allowed"
                  value={fullName}
                  disabled
                  readOnly
                />
              </label>
              <Field label="Телефон" value={ticketForm.phone} onChange={(value) => setTicketForm((state) => ({ ...state, phone: value }))} />
              <Field label="Email" type="email" value={ticketForm.email} onChange={(value) => setTicketForm((state) => ({ ...state, email: value }))} />
              <Textarea label="Описание" value={ticketForm.description} onChange={(value) => setTicketForm((state) => ({ ...state, description: value }))} />
              <PrimaryButton text="Отправить заявку" />
            </form>
          </Panel>

          <Panel title="Мои заявки" icon={<CheckCircle2 size={20} />}>
            <div className="grid gap-3">
              {tickets.length === 0 && <Empty text="Заявок пока нет." />}
              {tickets.map((ticket) => (
                <article key={ticket.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{ticket.name}</h3>
                      <p className="mt-1 text-sm text-zinc-500">{ticket.description || "Без описания"}</p>
                    </div>
                    <Badge text={ticketStatusLabels[ticket.status] || ticket.status} />
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">{formatDateTime(ticket.created_at)}</p>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
          <Panel title="Добавить способ связи" icon={<Phone size={20} />}>
            <form className="grid gap-3" onSubmit={createContact}>
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>Тип</span>
                <select 
                  className="h-11 rounded-2xl border border-white/10 bg-[#050505] px-4 text-sm outline-none" 
                  value={contactForm.type} 
                  onChange={(event) => setContactForm((state) => ({ ...state, type: event.target.value }))}
                >
                  {availableTypes.length > 0 ? (
                    availableTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))
                  ) : (
                    <option disabled value="">Все типы уже добавлены</option>
                  )}
                </select>
              </label>
              <Field label="Значение" required value={contactForm.value} onChange={(value) => setContactForm((state) => ({ ...state, value }))} />
              <Field label="Комментарий" value={contactForm.comment} onChange={(value) => setContactForm((state) => ({ ...state, comment: value }))} />
              <PrimaryButton text="Добавить" disabled={availableTypes.length === 0} />
            </form>
          </Panel>

          <Panel title="Способы связи" icon={<Phone size={20} />}>
            <div className="grid gap-3 sm:grid-cols-2">
              {contacts.length === 0 && <Empty text="Способы связи пока не добавлены." />}
              {contacts.map((contact) => (
                <article key={contact.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">
                        {typeLabels[contact.type] || contact.type}
                      </p>
                      <h3 className="mt-1 font-semibold">{contact.value}</h3>
                      {contact.comment && <p className="mt-2 text-sm text-zinc-500">{contact.comment}</p>}
                      {contact.is_locked && (
                        <p className="mt-1 text-xs text-zinc-600">Закреплено</p>
                      )}
                    </div>
                    {contact.type !== "Email" && !contact.is_locked && (
                      <button
                        className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-100 transition hover:bg-red-500/20"
                        onClick={() => openDeleteModal(contact)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </section>
      </div>

      {deleteModal.isOpen && (
        <ModalMount onRequestClose={closeDeleteModal}>
          <div className="w-full max-w-md rounded-[26px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Подтверждение удаления</h3>
              <button
                onClick={closeDeleteModal}
                className="text-zinc-500 transition hover:text-white"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-zinc-300 mb-6">
              Вы уверены, что хотите удалить способ связи<br />
              <span className="font-semibold text-white">{typeLabels[deleteModal.contactType] || deleteModal.contactType}: {deleteModal.contactValue}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-2xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                type="button"
              >
                Удалить
              </button>
              <button
                onClick={closeDeleteModal}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08]"
                type="button"
              >
                Отмена
              </button>
            </div>
          </div>
        </ModalMount>
      )}
    </main>
  );
}

function Panel({ children, icon, title }: { children: React.ReactNode; icon: React.ReactNode; title: string }) {
  return (
    <section className="section-panel p-5 sm:p-6">
      <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold">{icon}{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, onChange, required, type = "text", value }: { label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <input 
        className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none focus:border-white/30 transition" 
        onChange={(event) => onChange(event.target.value)} 
        required={required} 
        type={type} 
        value={value} 
      />
    </label>
  );
}

function Textarea({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <textarea 
        className="min-h-28 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-white/30 transition" 
        onChange={(event) => onChange(event.target.value)} 
        value={value} 
      />
    </label>
  );
}

function PrimaryButton({ text, disabled = false }: { text: string; disabled?: boolean }) {
  return (
    <button 
      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed" 
      type="submit" 
      disabled={disabled}
    >
      <Plus size={17} />
      {text}
    </button>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">{text}</span>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-zinc-500">{text}</div>;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  // SSR/CSR-safe formatting (avoid locale/timezone differences)
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

function ModalMount({
  children,
  onRequestClose,
}: {
  children: React.ReactNode;
  onRequestClose: () => void;
}) {
  const [isClosing, setIsClosing] = useState(false);

  const close = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      onRequestClose();
      setIsClosing(false);
    }, 220);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-220"
      style={{ opacity: isClosing ? 0 : 1 }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="transition-all duration-220"
        style={{
          opacity: isClosing ? 0 : 1,
          transform: isClosing ? "translateY(10px) scale(0.98)" : "translateY(0) scale(1)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
