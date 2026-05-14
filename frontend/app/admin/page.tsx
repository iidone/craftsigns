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

type TabType = "users" | "bot";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [newBlockCategory, setNewBlockCategory] = useState<BotBlock["category"]>("rules");
  const [newBlockType, setNewBlockType] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    void fetchUsers();
    void loadBotConfig();
  }, [user, router, fetchUsers, loadBotConfig]);

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
                <button
                  onClick={() => setActiveTab("users")}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "users" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                  type="button"
                >
                  <Users size={18} />
                  Пользователи
                </button>
                <button
                  onClick={() => setActiveTab("bot")}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "bot" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                  type="button"
                >
                  <MessageSquare size={18} />
                  Чат-бот
                </button>
              </div>
            </div>
          </section>

          {error && <StatusMessage tone="danger" text={error} />}
          {saveSuccess && <StatusMessage tone="success" text="Конфигурация успешно сохранена." />}

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
    </>
  );
}

const TableHead = ({ children }: { children: React.ReactNode }) => (
  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
    {children}
  </th>
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
