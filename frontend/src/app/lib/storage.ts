const AUTH_SESSION_KEY = "authSession";

export type UserRole = "admin" | "barber";

export interface SessionUser {
  id: number;
  full_name: string;
  username: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: SessionUser;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getAuthSession(): AuthSession | null {
  const session = parseJson<AuthSession | null>(window.localStorage.getItem(AUTH_SESSION_KEY), null);

  if (!session?.token || !session.user) return null;
  if (typeof session.user.id !== "number") return null;
  if (typeof session.user.full_name !== "string") return null;
  if (typeof session.user.username !== "string") return null;
  if (!["admin", "barber"].includes(session.user.role)) return null;

  return session;
}

export function setAuthSession(session: AuthSession | null) {
  if (session) {
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

export function clearAuthSession() {
  setAuthSession(null);
}

export function isAdminAuthenticated() {
  return getAuthSession()?.user.role === "admin";
}

export function setAdminAuthenticated(_value: boolean) {
  if (!_value) {
    clearAuthSession();
  }
}

export interface BarberSession {
  id: number;
  full_name: string;
  username: string;
  role: "barber";
}

export function getBarberSession(): BarberSession | null {
  const session = getAuthSession();
  if (!session || session.user.role !== "barber") return null;
  return session.user as BarberSession;
}

export function isBarberAuthenticated() {
  return Boolean(getBarberSession());
}

export function setBarberSession(session: BarberSession | null) {
  if (!session) {
    clearAuthSession();
  }
}
