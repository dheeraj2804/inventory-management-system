export const TOKEN_KEY = "inventory_token";
export const USER_KEY = "inventory_user";

export type AuthUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

export const saveToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("auth-changed"));
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("auth-changed"));
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const saveUser = (user: AuthUser) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const getUserInitials = (user: AuthUser | null) => {
  if (!user) return "U";

  if (user.name && user.name.trim().length > 0) {
    const parts = user.name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  if (user.email && user.email.length > 0) {
    return user.email[0].toUpperCase();
  }

  return "U";
};
