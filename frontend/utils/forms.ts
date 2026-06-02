export const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits.startsWith("7") ? digits : `7${digits}`;
  const limited = normalized.slice(0, 11);
  const body = limited.slice(1);
  const parts = [
    body.slice(0, 3),
    body.slice(3, 6),
    body.slice(6, 8),
    body.slice(8, 10),
  ];

  let result = "+7";
  if (parts[0]) result += ` (${parts[0]}`;
  if (parts[0]?.length === 3) result += ")";
  if (parts[1]) result += ` ${parts[1]}`;
  if (parts[2]) result += `-${parts[2]}`;
  if (parts[3]) result += `-${parts[3]}`;
  return result;
};

const fieldLabels: Record<string, string> = {
  email: "email",
  password: "пароль",
  first_name: "имя",
  last_name: "фамилию",
  patronymic: "отчество",
  phone: "телефон",
  name: "имя",
  value: "значение",
};

const messageMap: Array<[RegExp, string]> = [
  [/password/i, "Пароль слишком короткий или не соответствует требованиям."],
  [/пароль|too short|string should have at least/i, "Пароль слишком короткий или не соответствует требованиям."],
  [/field required|missing/i, "Заполните обязательные поля."],
  [/value is not a valid email|email/i, "Введите корректный email."],
  [/incorrect username or password|invalid credentials|not authenticate/i, "Неверный email или пароль."],
  [/already registered|already exists|duplicate/i, "Такая запись уже существует."],
  [/unauthorized|not authenticated|token|401/i, "Войдите в аккаунт заново."],
  [/forbidden|permission|403/i, "У вас нет доступа к этому действию."],
  [/not found|404/i, "Запись не найдена или уже удалена."],
  [/network|failed to fetch|server|timeout/i, "Сервер не отвечает. Попробуйте позже."],
];

const stringifyDetail = (detail: unknown): string => {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const record = item as { msg?: string; loc?: string[] };
          const field = record.loc?.at(-1);
          const label = field ? fieldLabels[field] ?? field : "";
          return label ? `${label}: ${record.msg ?? ""}` : record.msg ?? "";
        }
        return "";
      })
      .filter(Boolean)
      .join(" ");
  }
  return "";
};

export const getFriendlyError = (payload: unknown, fallback = "Что-то пошло не так. Проверьте данные и попробуйте еще раз.") => {
  const raw =
    typeof payload === "string"
      ? payload
      : stringifyDetail((payload as { detail?: unknown; message?: unknown })?.detail) ||
        stringifyDetail((payload as { detail?: unknown; message?: unknown })?.message);

  if (!raw || raw.includes("[object Object]")) return fallback;
  const mapped = messageMap.find(([pattern]) => pattern.test(raw));
  return mapped?.[1] ?? raw;
};

export const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

export const getFriendlyFetchError = (error: unknown, fallback = "Сервер не отвечает. Попробуйте позже.") => {
  if (isAbortError(error)) return "";
  if (error instanceof TypeError) return fallback;
  if (error instanceof Error) return getFriendlyError(error.message, fallback);
  return fallback;
};
