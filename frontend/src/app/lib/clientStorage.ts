const CLIENT_SESSION_KEY = "clientSession";

export interface ClientUser {
  id: number;
  name: string;
  phone: string;
}

export interface ClientSession {
  token: string;
  user: ClientUser;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getClientSession(): ClientSession | null {
  const session = parseJson<ClientSession | null>(
    window.localStorage.getItem(CLIENT_SESSION_KEY),
    null
  );
  if (!session?.token || !session.user) return null;
  if (typeof session.user.id !== "number") return null;
  if (typeof session.user.name !== "string") return null;
  if (typeof session.user.phone !== "string") return null;
  return session;
}

export function setClientSession(session: ClientSession | null) {
  if (session) {
    window.localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(CLIENT_SESSION_KEY);
  }
}

export function clearClientSession() {
  setClientSession(null);
}

export function isClientAuthenticated(): boolean {
  return Boolean(getClientSession());
}
