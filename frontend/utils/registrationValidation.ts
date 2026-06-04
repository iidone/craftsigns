export type RegistrationFormValues = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  patronymic?: string;
};

export type FieldKey = keyof RegistrationFormValues;

export type FieldErrors = Partial<Record<FieldKey, string>> & {
  patronymic?: string;
};

const RUSSIAN_NAME_RE = /^[А-ЯЁа-яё]+(?:[-\s][А-ЯЁа-яё]+)*$/u;
const ONLY_RUSSIAN_LETTERS_RE = /^[А-ЯЁа-яё]+$/u;

const hasForbiddenChars = (value: string) => /[^\p{L} \-\s]/u.test(value);

export const validateRegistrationField = (key: FieldKey, value: string): string | undefined => {
  const v = value.trim();

  if (key === "email") {
    if (!v) return "Введите email.";
    // Simple but practical email validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRe.test(v)) return "Введите корректный email.";
    return undefined;
  }

  if (key === "password") {
    if (!v) return "Введите пароль.";
    if (v.length < 6) return "Пароль должен содержать не менее 6-ти символов.";
    return undefined;
  }

  if (key === "first_name") {
    if (!v) return "Введите имя.";
    if (!RUSSIAN_NAME_RE.test(v)) {
      if (/\d/.test(v) || /[^А-ЯЁа-яё\-\s]/u.test(v)) return "Имя должно содержать только русские буквы.";
      return "Имя должно содержать только русские буквы.";
    }
    if (hasForbiddenChars(v)) return "Имя не должно содержать специальные символы.";
    if (!ONLY_RUSSIAN_LETTERS_RE.test(v.replace(/\s/g, "").replace(/-/g, ""))) {
      // Fallback message
      return "Имя должно содержать только русские буквы.";
    }
    return undefined;
  }

  if (key === "last_name") {
    if (!v) return "Введите фамилию.";
    if (!RUSSIAN_NAME_RE.test(v)) return "Фамилия должна содержать только русские буквы.";
    return undefined;
  }

  // patronymic may be empty
  if (key === "patronymic") {
    if (!v) return undefined;
    // Allow empty, but if filled -> validate Russian letters (with optional dash/space)
    if (!RUSSIAN_NAME_RE.test(v)) return "Отчество должно содержать только русские буквы.";
    if (hasForbiddenChars(v)) return "Отчество не должно содержать специальные символы.";
    return undefined;
  }

  return undefined;
};

export const validateRegistration = (values: RegistrationFormValues): FieldErrors => {
  const errors: FieldErrors = {};

  const e1 = validateRegistrationField("first_name", values.first_name);
  if (e1) errors.first_name = e1;

  const e2 = validateRegistrationField("last_name", values.last_name);
  if (e2) errors.last_name = e2;

  const patronymicValue = values.patronymic ?? "";
  const e3 = validateRegistrationField("patronymic", patronymicValue);
  if (e3) errors.patronymic = e3;

  const e4 = validateRegistrationField("email", values.email);
  if (e4) errors.email = e4;

  const e5 = validateRegistrationField("password", values.password);
  if (e5) errors.password = e5;

  return errors;
};

export const isValidRegistration = (values: RegistrationFormValues): boolean => {
  const errors = validateRegistration(values);
  return Object.keys(errors).length === 0;
};

