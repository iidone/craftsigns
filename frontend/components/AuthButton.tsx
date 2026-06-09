"use client";

import { useEffect, useState } from "react";
import { LogIn, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getFriendlyError } from "@/utils/forms";
import {
  isValidRegistration,
  validateRegistration,
  validateRegistrationField,
  type RegistrationFormValues,
} from "@/utils/registrationValidation";



type ModalMode = "login" | "register" | "forgot";

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
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [registerErrors, setRegisterErrors] = useState<Partial<Record<keyof RegistrationFormValues, string>>>({});
  const [registerTouched, setRegisterTouched] = useState<Partial<Record<keyof RegistrationFormValues, boolean>>>({});

  const setRegisterFieldError = (key: keyof RegistrationFormValues, err?: string) => {
    setRegisterErrors((prev) => ({ ...prev, [key]: err || undefined }));
  };

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
        throw new Error(getFriendlyError(errorData, "Не удалось войти. Проверьте email и пароль."));
      }

      const data = await response.json();
      login(data.access_token, data.user_info);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти. Проверьте email и пароль.");
    } finally {
      setLoading(false);
    }
  };

  const registerValues: RegistrationFormValues = {
    email: regEmail,
    password: regPassword,
    first_name: regFirstName,
    last_name: regLastName,
    patronymic: regPatronymic,
  };

  const computedRegisterErrors = validateRegistration(registerValues);
  const isRegisterFormValid = isValidRegistration(registerValues);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    const nextTouched: Partial<Record<keyof RegistrationFormValues, boolean>> = {
      email: true,
      password: true,
      first_name: true,
      last_name: true,
      patronymic: true,
    };
    setRegisterTouched(nextTouched);

    const nextErrors = computedRegisterErrors;
    setRegisterErrors(nextErrors);

    if (!isRegisterFormValid) {
      setLoading(false);
      return;
    }


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
        throw new Error(getFriendlyError(errorData, "Не удалось зарегистрироваться. Проверьте данные формы."));
      }

      setSuccessMessage("Аккаунт создан. Пожалуйста, подтвердите email по ссылке из письма.");
      setModalMode("login");
      setEmail(regEmail);
      setPassword(regPassword);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Не удалось зарегистрироваться. Проверьте данные формы.";
      setError(getFriendlyError(msg, "Не удалось зарегистрироваться. Проверьте данные формы."));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch("/api/v1/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch {
      setForgotSent(true);
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
    setForgotEmail("");
    setForgotSent(false);
  };

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
      resetForm();
    }, 220);
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
        onClick={() => {
          setIsClosing(false);
          setIsModalOpen(true);
        }}
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
              isModalOpen && !isClosing ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            style={{
              opacity: isClosing ? 0 : 1,
              transform: isClosing ? "scale(0.98) translateY(10px)" : "scale(1) translateY(0)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              {modalMode === "forgot" ? (
                <span className="px-1 text-sm font-medium text-zinc-400">Сброс пароля</span>
              ) : (
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.03] p-1">
                  <button
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      modalMode === "login" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/[0.04]"
                    }`}
                    onClick={() => { setModalMode("login"); setError(""); setSuccessMessage(""); }}
                    type="button"
                  >
                    Вход
                  </button>
                  <button
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      modalMode === "register" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/[0.04]"
                    }`}
                    onClick={() => { setModalMode("register"); setError(""); setSuccessMessage(""); }}
                    type="button"
                  >
                    Регистрация
                  </button>
                </div>
              )}
              <button className="text-zinc-500 transition hover:text-white" onClick={handleClose} type="button">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="transition-opacity duration-200">
                {modalMode === "login" && (
                  <form className="grid gap-3" onSubmit={handleLogin}>
                    <ModalTitle title="Вход в аккаунт" text="Введите email и пароль." />
                    <AuthField label="Email" type="email" value={email} onChange={setEmail} />
                    <AuthField label="Пароль" type="password" value={password} onChange={setPassword} />
                    <Feedback error={error} success={successMessage} />
                    <button
                      className="h-11 rounded-2xl bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? "Вход..." : "Войти"}
                    </button>
                    <button
                      type="button"
                      className="text-center text-xs text-zinc-500 transition hover:text-zinc-300"
                      onClick={() => { setModalMode("forgot"); setError(""); setSuccessMessage(""); }}
                    >
                      Забыли пароль?
                    </button>
                  </form>
                )}

                {modalMode === "register" && (
                  <form className="grid gap-3" onSubmit={handleRegister}>
                    <ModalTitle
                      title="Регистрация"
                      text="Создайте аккаунт для получения доступа к чат-боту и оформления заказов."
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <AuthField
                        label="Имя"
                        value={regFirstName}
                        onChange={(v) => {
                          setRegFirstName(v);
                          const err = validateRegistrationField("first_name", v);
                          setRegisterFieldError("first_name", err);
                          setRegisterTouched((p) => ({ ...p, first_name: true }));
                        }}
                        error={registerTouched.first_name ? registerErrors.first_name : undefined}
                        inputMode="text"
                      />
                      <AuthField
                        label="Фамилия"
                        value={regLastName}
                        onChange={(v) => {
                          setRegLastName(v);
                          const err = validateRegistrationField("last_name", v);
                          setRegisterFieldError("last_name", err);
                          setRegisterTouched((p) => ({ ...p, last_name: true }));
                        }}
                        error={registerTouched.last_name ? registerErrors.last_name : undefined}
                        inputMode="text"
                      />
                    </div>
                    <AuthField
                      label="Отчество"
                      value={regPatronymic}
                      onChange={(v) => {
                        setRegPatronymic(v);
                        const err = validateRegistrationField("patronymic", v);
                        setRegisterFieldError("patronymic", err);
                        setRegisterTouched((p) => ({ ...p, patronymic: true }));
                      }}
                      required={false}
                      error={registerTouched.patronymic ? registerErrors.patronymic : undefined}
                      inputMode="text"
                    />
                    <AuthField
                      label="Email"
                      type="email"
                      value={regEmail}
                      onChange={(v) => {
                        setRegEmail(v);
                        const err = validateRegistrationField("email", v);
                        setRegisterFieldError("email", err);
                        setRegisterTouched((p) => ({ ...p, email: true }));
                      }}
                      error={registerTouched.email ? registerErrors.email : undefined}
                      autoComplete="email"
                      inputMode="email"
                    />
                    <AuthField
                      label="Пароль"
                      type="password"
                      value={regPassword}
                      onChange={(v) => {
                        setRegPassword(v);
                        const err = validateRegistrationField("password", v);
                        setRegisterFieldError("password", err);
                        setRegisterTouched((p) => ({ ...p, password: true }));
                      }}
                      error={registerTouched.password ? registerErrors.password : undefined}
                      autoComplete="new-password"
                    />
                    <Feedback error={error} success={successMessage} />
                    <button
                      className="h-11 rounded-2xl bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      disabled={loading || !isRegisterFormValid}
                      aria-disabled={loading || !isRegisterFormValid}
                      type="submit"
                    >
                      {loading ? "Создание..." : "Зарегистрироваться"}
                    </button>
                  </form>
                )}

                {modalMode === "forgot" && (
                  forgotSent ? (
                    <div className="grid gap-4">
                      <ModalTitle
                        title="Письмо отправлено"
                        text="Если этот email зарегистрирован, вам придёт письмо со ссылкой. Ссылка действительна 60 минут."
                      />
                      <button
                        type="button"
                        className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-zinc-300 transition hover:bg-white/[0.08]"
                        onClick={() => { setModalMode("login"); setForgotSent(false); setForgotEmail(""); }}
                      >
                        Вернуться ко входу
                      </button>
                    </div>
                  ) : (
                    <form className="grid gap-3" onSubmit={handleForgot}>
                      <ModalTitle
                        title="Забыли пароль?"
                        text="Введите email — вышлем ссылку для создания нового пароля."
                      />
                      <AuthField
                        label="Email"
                        type="email"
                        value={forgotEmail}
                        onChange={setForgotEmail}
                        autoComplete="email"
                        inputMode="email"
                      />
                      <Feedback error={error} success="" />
                      <button
                        className="h-11 rounded-2xl bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                        disabled={loading}
                        type="submit"
                      >
                        {loading ? "Отправка..." : "Отправить письмо"}
                      </button>
                      <button
                        type="button"
                        className="text-center text-xs text-zinc-500 transition hover:text-zinc-300"
                        onClick={() => { setModalMode("login"); setError(""); }}
                      >
                        Вернуться ко входу
                      </button>
                    </form>
                  )
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
  error,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) => {
  const hasError = Boolean(error);

  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <input
        className={
          "h-11 rounded-2xl border px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 " +
          (hasError
            ? "border-red-500/70 bg-red-500/5 focus:border-red-500"
            : "border-white/10 bg-white/[0.04] focus:border-white/30 focus:bg-white/[0.07]")
        }
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
      />
      {hasError ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  );
};


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
