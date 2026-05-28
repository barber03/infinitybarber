import { clearAuthSession, getAuthSession } from "./storage";
import { getClientSession, clearClientSession } from "./clientStorage";

const getDefaultApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return "https://infinitybarber-phi.vercel.app";
  }

  // En desarrollo usamos el mismo origen (Vite) y el proxy redirige al backend.
  if ((import.meta as any).env?.DEV) {
    return window.location.origin;
  }

  return "https://infinitybarber-phi.vercel.app";
};

export const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || getDefaultApiBaseUrl()).replace(/\/$/, "");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isConnectionError = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes("No se pudo conectar") ||
    error.message.includes("error de red") ||
    error.name === "TypeError");

export async function waitForBackend(maxAttempts = 8, delayMs = 600) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(resolveApiUrl("/api/health"), { method: "GET" });
      if (response.ok) return true;
    } catch {
      // Backend aún no listo
    }
    await sleep(delayMs);
  }
  return false;
}

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export const resolveApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const resolveAssetUrl = (url?: string) => {
  if (!url) return "";
  const localPaths = ["/gallery/", "/barbers/", "/clients/", "/barber-portfolio/", "/payments/"];
  if (localPaths.some((p) => url.startsWith(p))) {
    return url;
  }
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
};

export async function apiFetch<T>(path: string, init: RequestInit = {}, retries = 2): Promise<T> {
  const session = getAuthSession();
  const clientSession = getClientSession();
  const headers = new Headers(init.headers || {});

  let token = null;
  if (path.startsWith("/api/client")) {
    token = clientSession?.token;
  } else if (path.startsWith("/api/admin")) {
    token = session?.token;
  } else {
    token = session?.token || clientSession?.token;
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(resolveApiUrl(path), {
        ...init,
        headers,
      });
    } catch (error) {
      lastError = new Error(
        error instanceof Error && error.name === "TypeError"
          ? "No se pudo conectar con el servidor. Verifica que el backend esté encendido (puerto 3000)."
          : "Ocurrió un error de red al procesar la solicitud."
      );
      if (attempt < retries) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw lastError;
    }

    if (response.status === 401 && !path.includes("/auth/")) {
      clearAuthSession();
      clearClientSession();
    }

    const text = await response.text();
    let data: JsonValue = null;

    if (text) {
      try {
        data = JSON.parse(text) as JsonValue;
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      let message = "Request failed";

      if (typeof data === "object" && data !== null && "error" in data && typeof data.error === "string") {
        message = data.error;
      } else if (typeof data === "string" && data.trim()) {
        const routeMatch = data.match(/Cannot (GET|POST|PUT|PATCH|DELETE) ([^\s<]+)/i);
        message = routeMatch
          ? `Ruta no disponible en el servidor (${routeMatch[2]}). Reinicia el backend.`
          : data.length > 180
            ? `Error del servidor (${response.status}). Reinicia el backend.`
            : data;
      }

      throw new Error(message);
    }

    return data as T;
  }

  throw lastError || new Error("No se pudo completar la solicitud.");
}
