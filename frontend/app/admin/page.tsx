"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit3,
  FileText,
  Info,
  MessageSquare,
  Package,
  ImagePlus,
  Plus,
  Save,
  Settings,
  Trash2,
  Users,
} from "lucide-react";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface BotConfigBlock {
  type: string;
  content: string;
}

interface BotBlock extends BotConfigBlock {
  id: string;
  category: "rules" | "prices" | "services" | "info";
  isExpanded?: boolean;
}

interface PortfolioItem {
  id: number;
  name: string;
  description: string | null;
  photo_url: string | null;
}

interface ServiceItem extends PortfolioItem {
  price: string | null;
}

type TabType = "users" | "bot" | "portfolio" | "services";

const categoryOptions: Array<{ value: BotBlock["category"]; label: string }> = [
  { value: "rules", label: "Правила" },
  { value: "prices", label: "Цены" },
  { value: "services", label: "Услуги" },
  { value: "info", label: "Информация" },
];

const serializeBotBlock = (block: BotBlock): BotConfigBlock => ({
  type: block.type,
  content: block.content,
});

export default function AdminPanel() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blocks, setBlocks] = useState<BotBlock[]>([]);
  const [botLoading, setBotLoading] = useState(false);
  const [botError, setBotError] = useState("");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState("");
  const [contentSuccess, setContentSuccess] = useState("");
  const [portfolioForm, setPortfolioForm] = useState({
    name: "",
    description: "",
    photoFile: null as File | null,
  });
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    photoFile: null as File | null,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [newBlockCategory, setNewBlockCategory] = useState<BotBlock["category"]>("rules");
  const [newBlockType, setNewBlockType] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const [contentToDelete, setContentToDelete] = useState<{
    id: number;
    name: string;
    type: "portfolio" | "service";
  } | null>(null);

  const getCategoryFromType = (type: string): BotBlock["category"] => {
    const typeMap: Record<string, BotBlock["category"]> = {
      rules: "rules",
      prices: "prices",
      services: "services",
      info: "info",
    };
    return typeMap[type] || "rules";
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Ошибка загрузки пользователей");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadBotConfig = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/v1/admin/bot-config", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data: { blocks: BotConfigBlock[] } = await response.json();
        setBlocks(
          data.blocks.map((block, index) => ({
            id: index.toString(),
            type: block.type,
            content: block.content,
            category: getCategoryFromType(block.type),
            isExpanded: false,
          }))
        );
      }
    } catch {
      setBotError("Не удалось загрузить конфигурацию");
    }
  }, [token]);

  const loadContent = useCallback(async () => {
    try {
      const [portfolioResponse, servicesResponse] = await Promise.all([
        fetch("/api/v1/portfolio_and_services/portfolio"),
        fetch("/api/v1/portfolio_and_services/services"),
      ]);

      if (!portfolioResponse.ok) throw new Error("Не удалось загрузить портфолио");
      if (!servicesResponse.ok) throw new Error("Не удалось загрузить услуги");

      setPortfolioItems(await portfolioResponse.json());
      setServices(await servicesResponse.json());
    } catch (err) {
      setContentError(err instanceof Error ? err.message : "Ошибка загрузки контента");
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    void fetchUsers();
    void loadBotConfig();
    void loadContent();
  }, [user, router, fetchUsers, loadBotConfig, loadContent]);

  const handlePromote = async (userId: number) => {
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}/promote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Ошибка повышения");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Удалить пользователя?")) return;
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Ошибка удаления");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const saveBotConfig = async () => {
    if (!token) return;
    setBotLoading(true);
    setSaveSuccess(false);
    try {
      const response = await fetch("/api/v1/admin/bot-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blocks: blocks.map(serializeBotBlock),
        }),
      });
      if (!response.ok) throw new Error("Ошибка сохранения");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setBotError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBotLoading(false);
    }
  };

  const createPortfolioItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContentError("");
    setContentSuccess("");
    setContentLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", portfolioForm.name);
      if (portfolioForm.description) formData.append("description", portfolioForm.description);
      if (portfolioForm.photoFile) formData.append("photo_file", portfolioForm.photoFile);

      const response = await fetch("/api/v1/portfolio_and_services/create_portfolio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Не удалось добавить работу");
      }

      setPortfolioForm({ name: "", description: "", photoFile: null });
      setContentSuccess("Работа добавлена в портфолио.");
      await loadContent();
    } catch (err) {
      setContentError(err instanceof Error ? err.message : "Ошибка добавления работы");
    } finally {
      setContentLoading(false);
    }
  };

  const createServiceItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContentError("");
    setContentSuccess("");
    setContentLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", serviceForm.name);
      if (serviceForm.description) formData.append("description", serviceForm.description);
      if (serviceForm.price) formData.append("price", serviceForm.price);
      if (serviceForm.photoFile) formData.append("photo_file", serviceForm.photoFile);

      const response = await fetch("/api/v1/portfolio_and_services/create_service", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Не удалось добавить услугу");
      }

      setServiceForm({ name: "", description: "", price: "", photoFile: null });
      setContentSuccess("Услуга добавлена.");
      await loadContent();
    } catch (err) {
      setContentError(err instanceof Error ? err.message : "Ошибка добавления услуги");
    } finally {
      setContentLoading(false);
    }
  };

  const deletePortfolioItem = async (id: number) => {
    setContentError("");
    setContentSuccess("");
    setContentLoading(true);

    try {
      const response = await fetch(`/api/v1/portfolio_and_services/portfolio/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Не удалось удалить работу");
      }

      setContentSuccess("Работа удалена из портфолио.");
      await loadContent();
    } catch (err) {
      setContentError(err instanceof Error ? err.message : "Ошибка удаления работы");
    } finally {
      setContentLoading(false);
    }
  };

  const deleteServiceItem = async (id: number) => {
    setContentError("");
    setContentSuccess("");
    setContentLoading(true);

    try {
      const response = await fetch(`/api/v1/portfolio_and_services/services/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Не удалось удалить услугу");
      }

      setContentSuccess("Услуга удалена.");
      await loadContent();
    } catch (err) {
      setContentError(err instanceof Error ? err.message : "Ошибка удаления услуги");
    } finally {
      setContentLoading(false);
    }
  };

  const confirmContentDelete = async () => {
    if (!contentToDelete) return;

    const target = contentToDelete;
    setContentToDelete(null);

    if (target.type === "portfolio") {
      await deletePortfolioItem(target.id);
      return;
    }

    await deleteServiceItem(target.id);
  };

  const addBlock = () => {
    if (!newBlockType.trim()) {
      setBotError("Введите название правила/услуги");
      return;
    }

    const id = Date.now().toString();
    setBlocks([
      ...blocks,
      {
        id,
        type: newBlockType,
        content: "",
        category: newBlockCategory,
        isExpanded: true,
      },
    ]);
    setNewBlockType("");
    setShowAddForm(false);
    setEditingId(id);
    setEditContent("");
  };

  const confirmDelete = () => {
    if (blockToDelete) {
      setBlocks(blocks.filter((block) => block.id !== blockToDelete));
    }
    setDeleteModalOpen(false);
    setBlockToDelete(null);
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const saveEdit = (id: string) => {
    setBlocks(blocks.map((block) => (block.id === id ? { ...block, content: editContent, isExpanded: false } : block)));
    setEditingId(null);
  };

  const toggleExpand = (id: string) => {
    setBlocks(blocks.map((block) => (block.id === id ? { ...block, isExpanded: !block.isExpanded } : block)));
  };

  const getCategoryIcon = (category: BotBlock["category"]) => {
    switch (category) {
      case "rules":
        return <AlertCircle size={18} />;
      case "prices":
        return <DollarSign size={18} />;
      case "services":
        return <Package size={18} />;
      case "info":
        return <Info size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  const getCategoryTitle = (category: BotBlock["category"]) => {
    switch (category) {
      case "rules":
        return "Правила поведения";
      case "prices":
        return "Цены и прайсы";
      case "services":
        return "Услуги и товары";
      case "info":
        return "Информация о компании";
      default:
        return "Другое";
    }
  };

  const groupedBlocks = blocks.reduce(
    (acc, block) => {
      if (!acc[block.category]) acc[block.category] = [];
      acc[block.category].push(block);
      return acc;
    },
    {} as Record<BotBlock["category"], BotBlock[]>
  );

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setBlockToDelete(null);
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <>
      <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-4">
          <section className="section-panel overflow-hidden p-5 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="section-eyebrow">Администрирование</div>
                <h1 className="mt-5 flex items-center gap-3 text-3xl font-semibold text-white sm:text-4xl">
                  <Settings size={32} />
                  Панель администратора
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                  Управление пользователями и настройка базы знаний ассистента CraftSigns.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                <TabButton active={activeTab === "users"} icon={<Users size={18} />} label="Пользователи" onClick={() => setActiveTab("users")} />
                <TabButton active={activeTab === "bot"} icon={<MessageSquare size={18} />} label="Чат-бот" onClick={() => setActiveTab("bot")} />
                <TabButton active={activeTab === "portfolio"} icon={<ImagePlus size={18} />} label="Портфолио" onClick={() => setActiveTab("portfolio")} />
                <TabButton active={activeTab === "services"} icon={<Package size={18} />} label="Услуги" onClick={() => setActiveTab("services")} />
                
              </div>
            </div>
          </section>

          {error && <StatusMessage tone="danger" text={error} />}
          {saveSuccess && <StatusMessage tone="success" text="Конфигурация успешно сохранена." />}
          {contentError && <StatusMessage tone="danger" text={contentError} />}
          {contentSuccess && <StatusMessage tone="success" text={contentSuccess} />}

          {activeTab === "users" && (
            <section className="section-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Пользователи</h2>
                  <p className="mt-1 text-sm text-zinc-500">Список аккаунтов и права администратора.</p>
                </div>
                <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-400">
                  {loading ? "Загрузка" : `${users.length} записей`}
                </span>
              </div>

              {loading ? (
                <div className="p-10 text-center text-sm text-zinc-500">Загрузка...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/[0.03]">
                      <tr>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Действия</TableHead>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users.map((currentUser) => (
                        <tr key={currentUser.id} className="transition hover:bg-white/[0.03]">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="font-medium text-white">
                              {currentUser.first_name} {currentUser.last_name}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">{currentUser.email}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300">
                              {currentUser.role === "admin" ? "Администратор" : "Пользователь"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <div className="flex flex-wrap gap-2">
                              {currentUser.role !== "admin" && (
                                <button
                                  onClick={() => handlePromote(currentUser.id)}
                                  className="rounded-2xl bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-zinc-200"
                                  type="button"
                                >
                                  Сделать админом
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(currentUser.id)}
                                className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-500/20"
                                type="button"
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === "bot" && (
            <section className="section-panel p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">База знаний чат-бота</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                    Добавляйте правила, цены, услуги и справочную информацию для ассистента.
                  </p>
                </div>
                <button
                  onClick={saveBotConfig}
                  disabled={botLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                  type="button"
                >
                  <Save size={17} />
                  {botLoading ? "Сохранение..." : "Сохранить изменения"}
                </button>
              </div>

              {botError && <div className="mt-5"><StatusMessage tone="danger" text={botError} /></div>}

              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-medium text-white transition hover:bg-white/10"
                  type="button"
                >
                  <Plus size={20} />
                  Добавить новое правило, услугу или цену
                </button>
              ) : (
                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto_auto]">
                    <select
                      value={newBlockCategory}
                      onChange={(event) => setNewBlockCategory(event.target.value as BotBlock["category"])}
                      className="h-11 rounded-2xl border border-white/10 bg-[#050505] px-4 text-sm text-white outline-none"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newBlockType}
                      onChange={(event) => setNewBlockType(event.target.value)}
                      placeholder="Название, например: Цены на баннеры"
                      className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
                    />
                    <button
                      onClick={addBlock}
                      className="rounded-2xl bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                      type="button"
                    >
                      Добавить
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      type="button"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4">
                {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => (
                  <div key={category} className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
                    <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-5 py-4 text-zinc-300">
                      {getCategoryIcon(category as BotBlock["category"])}
                      <h3 className="font-semibold text-white">{getCategoryTitle(category as BotBlock["category"])}</h3>
                      <span className="ml-auto rounded-full border border-white/10 px-2 py-1 text-xs text-zinc-500">
                        {categoryBlocks.length}
                      </span>
                    </div>

                    <div className="divide-y divide-white/10">
                      {categoryBlocks.map((block) => (
                        <div key={block.id} className="p-4 transition hover:bg-white/[0.03]">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <button
                                onClick={() => toggleExpand(block.id)}
                                className="flex items-center gap-2 text-left text-zinc-300 transition hover:text-white"
                                type="button"
                              >
                                {block.isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                <span className="font-medium">{block.type}</span>
                              </button>

                              {block.isExpanded && (
                                <div className="mt-4 pl-7">
                                  {editingId === block.id ? (
                                    <div className="grid gap-3">
                                      <textarea
                                        value={editContent}
                                        onChange={(event) => setEditContent(event.target.value)}
                                        className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-[#050505] p-4 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
                                        placeholder="Введите содержание..."
                                        autoFocus
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => saveEdit(block.id)}
                                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                                          type="button"
                                        >
                                          <Save size={14} />
                                          Сохранить
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingId(null);
                                            setEditContent("");
                                          }}
                                          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                                          type="button"
                                        >
                                          Отмена
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-2xl border border-white/10 bg-[#050505] p-4">
                                      <div className="min-h-[50px] whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                                        {block.content || <span className="text-zinc-600">Нет содержания. Нажмите редактировать для добавления.</span>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-1">
                              {!editingId && (
                                <button
                                  onClick={() => startEdit(block.id, block.content)}
                                  className="rounded-2xl p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                                  title="Редактировать"
                                  type="button"
                                >
                                  <Edit3 size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setDeleteModalOpen(true);
                                  setBlockToDelete(block.id);
                                }}
                                className="rounded-2xl p-2 text-red-200 transition hover:bg-red-500/10 hover:text-red-100"
                                title="Удалить"
                                type="button"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {blocks.length === 0 && (
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-zinc-500">
                    Нет настроенных блоков. Нажмите Добавить, чтобы начать.
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "portfolio" && (
            <ContentManager
              count={portfolioItems.length}
              description="Добавляйте новые выполненные работы: фото, название и короткое описание."
              form={
                <form className="grid gap-3" onSubmit={createPortfolioItem}>
                  <AdminField
                    label="Название работы"
                    placeholder="Например: вывеска OldBoy"
                    required
                    value={portfolioForm.name}
                    onChange={(value) => setPortfolioForm((current) => ({ ...current, name: value }))}
                  />
                  <AdminTextarea
                    label="Описание"
                    placeholder="Короткое описание работы"
                    value={portfolioForm.description}
                    onChange={(value) => setPortfolioForm((current) => ({ ...current, description: value }))}
                  />
                  <AdminFileField
                    label="Фото работы"
                    fileName={portfolioForm.photoFile?.name}
                    onChange={(file) => setPortfolioForm((current) => ({ ...current, photoFile: file }))}
                  />
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                    disabled={contentLoading}
                    type="submit"
                  >
                    <Plus size={17} />
                    {contentLoading ? "Добавление..." : "Добавить работу"}
                  </button>
                </form>
              }
              items={portfolioItems}
              onDelete={(item) => setContentToDelete({ id: item.id, name: item.name, type: "portfolio" })}
              title="Портфолио"
            />
          )}

          {activeTab === "services" && (
            <ContentManager
              count={services.length}
              description="Добавляйте услуги, которые будут отображаться в слайдере на главной странице."
              form={
                <form className="grid gap-3" onSubmit={createServiceItem}>
                  <AdminField
                    label="Название услуги"
                    placeholder="Например: монтаж баннера"
                    required
                    value={serviceForm.name}
                    onChange={(value) => setServiceForm((current) => ({ ...current, name: value }))}
                  />
                  <AdminTextarea
                    label="Описание"
                    placeholder="Короткое описание услуги"
                    value={serviceForm.description}
                    onChange={(value) => setServiceForm((current) => ({ ...current, description: value }))}
                  />
                  <AdminField
                    label="Цена"
                    placeholder="Например: от 5000"
                    value={serviceForm.price}
                    onChange={(value) => setServiceForm((current) => ({ ...current, price: value }))}
                  />
                  <AdminFileField
                    label="Фото услуги"
                    fileName={serviceForm.photoFile?.name}
                    onChange={(file) => setServiceForm((current) => ({ ...current, photoFile: file }))}
                  />
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                    disabled={contentLoading}
                    type="submit"
                  >
                    <Plus size={17} />
                    {contentLoading ? "Добавление..." : "Добавить услугу"}
                  </button>
                </form>
              }
              items={services}
              onDelete={(item) => setContentToDelete({ id: item.id, name: item.name, type: "service" })}
              title="Услуги"
            />
          )}
        </div>
      </main>

      {deleteModalOpen && blockToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={cancelDelete}>
          <div className="w-full max-w-md rounded-[26px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-100">
                <Trash2 size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-semibold text-white">Удалить блок?</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Блок {blocks.find((block) => block.id === blockToDelete)?.type} будет удален.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-2xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
                type="button"
              >
                Удалить
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 rounded-2xl bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                type="button"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {contentToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setContentToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-[26px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] animate-scale-in"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-100">
                <Trash2 size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-semibold text-white">
                  {contentToDelete.type === "portfolio" ? "Удалить работу?" : "Удалить услугу?"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Запись «{contentToDelete.name}» исчезнет из админки и с главной страницы.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => void confirmContentDelete()}
                className="flex-1 rounded-2xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-medium text-red-100 transition hover:bg-red-500/20 disabled:opacity-50"
                disabled={contentLoading}
                type="button"
              >
                {contentLoading ? "Удаление..." : "Удалить"}
              </button>
              <button
                onClick={() => setContentToDelete(null)}
                className="flex-1 rounded-2xl bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                type="button"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const TableHead = ({ children }: { children: React.ReactNode }) => (
  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
    {children}
  </th>
);

const TabButton = ({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
      active ? "bg-white text-black" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
    }`}
    type="button"
  >
    {icon}
    {label}
  </button>
);

const ContentManager = ({
  count,
  description,
  form,
  items,
  onDelete,
  title,
}: {
  count: number;
  description: string;
  form: React.ReactNode;
  items: Array<PortfolioItem | ServiceItem>;
  onDelete: (item: PortfolioItem | ServiceItem) => void;
  title: string;
}) => (
  <section className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
    <div className="section-panel p-5 sm:p-6">
      <div className="section-eyebrow">Добавление</div>
      <h2 className="mt-5 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
      <div className="mt-6">{form}</div>
    </div>

    <div className="section-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Текущие записи</h2>
          <p className="mt-1 text-sm text-zinc-500">После добавления запись сразу появится на сайте.</p>
        </div>
        <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-400">
          {count} записей
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-10 text-center text-sm text-zinc-500">Записей пока нет.</div>
      ) : (
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
              <div className="aspect-[4/3] bg-[#050505]">
                {item.photo_url ? (
                  <img src={`/api${item.photo_url}`} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-600">Без фото</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                  <button
                    className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-100 transition hover:bg-red-500/20"
                    onClick={() => onDelete(item)}
                    title="Удалить"
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {item.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{item.description}</p>}
                {"price" in item && item.price && <p className="mt-3 text-sm font-semibold text-white">{item.price}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  </section>
);

const AdminField = ({
  label,
  onChange,
  placeholder,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) => (
  <label className="grid gap-2 text-sm text-zinc-300">
    <span>{label}</span>
    <input
      className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      value={value}
    />
  </label>
);

const AdminTextarea = ({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) => (
  <label className="grid gap-2 text-sm text-zinc-300">
    <span>{label}</span>
    <textarea
      className="min-h-28 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  </label>
);

const AdminFileField = ({
  fileName,
  label,
  onChange,
}: {
  fileName?: string;
  label: string;
  onChange: (file: File | null) => void;
}) => (
  <label className="grid gap-2 text-sm text-zinc-300">
    <span>{label}</span>
    <span className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-zinc-500 transition hover:border-white/30 hover:bg-white/[0.05]">
      <span className="truncate">{fileName || "Выберите jpg, png или webp"}</span>
      <span className="rounded-xl bg-white px-3 py-1 text-xs font-medium text-black">Файл</span>
    </span>
    <input
      accept="image/jpeg,image/png,image/webp"
      className="sr-only"
      onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      type="file"
    />
  </label>
);

const StatusMessage = ({ text, tone }: { text: string; tone: "danger" | "success" }) => (
  <div
    className={`rounded-[22px] border px-4 py-3 text-sm ${
      tone === "danger"
        ? "border-red-500/30 bg-red-500/10 text-red-100"
        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
    }`}
  >
    {text}
  </div>
);
