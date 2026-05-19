"use client";

import { useEffect, useState } from "react";
import { LogIn, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type ModalMode = "login" | "register";

export const AuthButton = () => {
  const { user, login, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPatronymic, setRegPatronymic] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch("/api/v1/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Ошибка авторизации");
      }

      const data = await response.json();
      login(data.access_token, data.user_info);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/v1/users/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          first_name: regFirstName,
          last_name: regLastName,
          patronymic: regPatronymic || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const detail = errorData?.detail;

        if (typeof detail === "string") {
          throw new Error(detail);
        }
        if (Array.isArray(detail) && detail.length > 0) {
          const msg = detail[0]?.msg;
          throw new Error(msg || "Ошибка регистрации");
        }

        throw new Error(errorData?.message || errorData?.detail || "Ошибка регистрации");
      }

      setSuccessMessage("Аккаунт создан. Пожалуйста, подтвердите email по ссылке из письма.");
      setModalMode("login");
      setEmail(regEmail);
      setPassword(regPassword);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка регистрации";
      setError(typeof msg === "string" && msg.toLowerCase().includes("object") ? "Проверьте данные формы" : msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRegEmail("");
    setRegPassword("");
    setRegFirstName("");
    setRegLastName("");
    setRegPatronymic("");
    setError("");
    setSuccessMessage("");
  };

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    // Снимаем overlay сразу, чтобы он не перекрывал клики во время анимации
    setIsModalOpen(false);
    setIsClosing(false);
    resetForm();
  };

  // Prevent hydration mismatch.
  // SSR and first client render must match.
  if (!mounted) {
    return (
      <button
        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
        type="button"
        aria-label="Auth"
        disabled
      >
        <LogIn size={16} />
        Войти
      </button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-zinc-400 sm:inline">
          {user.first_name} {user.last_name}
        </span>
        <button
          onClick={() => logout()}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          type="button"
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
        type="button"
      >
        <LogIn size={16} />
        Войти
      </button>

      {(isModalOpen || isClosing) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-opacity duration-300"
          style={{ opacity: isClosing ? 0 : 1 }}
          onClick={handleClose}
        >
          <div
            className={`w-full max-w-[420px] my-auto rounded-[26px] border border-white/10 bg-[#0b0b0c] shadow-[0_20px_70px_rgba(0,0,0,0.35)] transition-all duration-300 will-change-transform ${
              isModalOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            style={{
              opacity: isClosing ? 0 : 1,
              transform: isClosing ? "scale(0.98) translateY(10px)" : "scale(1) translateY(0)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.03] p-1">
                <button
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    modalMode === "login" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/[0.04]"
                  }`}
                  onClick={() => setModalMode("login")}
                  type="button"
                >
                  Вход
                </button>
                <button
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    modalMode === "register" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/[0.04]"
                  }`}
                  onClick={() => setModalMode("register")}
                  type="button"
                >
                  Регистрация
                </button>
              </div>
              <button className="text-zinc-500 transition hover:text-white" onClick={handleClose} type="button">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="transition-opacity duration-200">
                {modalMode === "login" ? (
                  <form className="grid gap-3" onSubmit={handleLogin}>
                    <ModalTitle
                      title="Вход в аккаунт"
                      text="Введите email и пароль."
                    />
                    <AuthField label="Email" type="email" value={email} onChange={setEmail} />
                    <AuthField label="Пароль" type="password" value={password} onChange={setPassword} />
                    <Feedback error={error} success={successMessage} />
                    <button
                      className="h-11 rounded-2xl bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? "Вход..." : "Войти"}
                    </button>
                  </form>
                ) : (
                  <form className="grid gap-3" onSubmit={handleRegister}>
                    <ModalTitle
                      title="Регистрация"
                      text="Создайте аккаунт для получения доступа к чат-боту и оформления заказов."
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <AuthField label="Имя" value={regFirstName} onChange={setRegFirstName} />
                      <AuthField label="Фамилия" value={regLastName} onChange={setRegLastName} />
                    </div>
                    <AuthField
                      label="Отчество"
                      value={regPatronymic}
                      onChange={setRegPatronymic}
                      required={false}
                    />
                    <AuthField label="Email" type="email" value={regEmail} onChange={setRegEmail} />
                    <AuthField label="Пароль" type="password" value={regPassword} onChange={setRegPassword} />
                    <Feedback error={error} success={successMessage} />
                    <button
                      className="h-11 rounded-2xl bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? "Создание..." : "Зарегистрироваться"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ModalTitle = ({ title, text }: { title: string; text: string }) => (
  <div className="mb-2">
    <h2 className="text-xl font-semibold text-white">{title}</h2>
    <p className="mt-1 text-sm leading-6 text-zinc-500">{text}</p>
  </div>
);

const AuthField = ({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) => (
  <label className="grid gap-2 text-sm text-zinc-300">
    <span>{label}</span>
    <input
      className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
      onChange={(event) => onChange(event.target.value)}
      required={required}
      type={type}
      value={value}
    />
  </label>
);

const Feedback = ({ error, success }: { error: string; success: string }) => {
  if (!error && !success) return null;

  return (
    <p
      className={`rounded-2xl border px-4 py-3 text-sm ${
        error
          ? "border-red-500/30 bg-red-500/10 text-red-100"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      }`}
    >
      {error || success}
    </p>
  );
};