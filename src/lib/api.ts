export const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

/* ── Erreur API typée ──────────────────────────────────────────── */
export class ApiError extends Error {
  status: number;
  errors: Record<string, unknown>;

  constructor(status: number, message: string, errors: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  field(name: string): string | undefined {
    const v = this.errors[name] as unknown;
    if (Array.isArray(v)) return String(v[0]);
    if (typeof v === "string") return v;
    return undefined;
  }
}

const NETWORK_MESSAGE = "Impossible de joindre le serveur. Vérifiez votre connexion.";
const UNAVAILABLE_MESSAGE = "Le serveur est momentanément indisponible. Réessayez dans quelques instants.";
const OUTAGE_DELAY_MS = 5000;

let unavailableUntil = 0;
const networkListeners = new Set<(unavailable: boolean) => void>();

export function isServerUnavailable(): boolean {
  return Date.now() < unavailableUntil;
}

export function subscribeNetworkStatus(listener: (unavailable: boolean) => void): () => void {
  networkListeners.add(listener);
  return () => { networkListeners.delete(listener); };
}

function notifyNetwork(unavailable: boolean): void {
  networkListeners.forEach((listener) => listener(unavailable));
}

function markUnavailable(): void {
  const alreadyDown = isServerUnavailable();
  unavailableUntil = Date.now() + OUTAGE_DELAY_MS;
  if (!alreadyDown) notifyNetwork(true);
}

function markAvailable(): void {
  if (unavailableUntil === 0) return;
  unavailableUntil = 0;
  notifyNetwork(false);
}

async function guardedFetch(url: string, init: RequestInit): Promise<Response> {
  if (isServerUnavailable()) throw new ApiError(0, UNAVAILABLE_MESSAGE);
  try {
    const res = await fetch(url, init);
    markAvailable();
    return res;
  } catch (e) {
    const name = (e as { name?: string } | null)?.name;
    if (name === "AbortError") throw e;
    markUnavailable();
    throw new ApiError(0, NETWORK_MESSAGE);
  }
}

/* ── CSRF : token lu dans la réponse ou dans le cookie ────────── */
function cookieCsrf(): string {
  const m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

let csrfValue = "";
let csrfFetching: Promise<string> | null = null;

async function fetchCsrf(): Promise<string> {
  if (csrfFetching) return csrfFetching;
  csrfFetching = (async () => {
    try {
      const res = await guardedFetch(`${apiBase}/api/v1/auth/csrf/`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new ApiError(res.status, "Impossible d'initialiser la protection CSRF.");
      let payload: { csrfToken?: string } = {};
      try {
        payload = (await res.json()) as { csrfToken?: string };
      } catch {
        /* ignore */
      }
      const token = payload.csrfToken || cookieCsrf();
      if (!token) throw new ApiError(0, "Impossible d'obtenir le jeton de sécurité. Réessayez.");
      csrfValue = token;
      return token;
    } finally {
      csrfFetching = null;
    }
  })();
  return csrfFetching;
}

async function ensureCsrf(force = false): Promise<string> {
  if (!force) {
    const fromCookie = cookieCsrf();
    if (fromCookie) {
      csrfValue = fromCookie;
      return fromCookie;
    }
    if (csrfValue) return csrfValue;
  }
  return fetchCsrf();
}

/* ── Session invalide : notification centralisée ─────────────── */
type UnauthorizedHandler = (path: string) => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

function isCsrfFailure(detail: string): boolean {
  return /csrf/i.test(detail);
}

function isCredentialFailure(path: string, status: number, detail: string): boolean {
  if (status === 401) return true;
  if (status !== 403) return false;
  const normalized = detail.toLowerCase();
  if (path === "/auth/me/" || path === "/auth/logout/") return true;
  if (!/authentification|authentication|credentials|unauthenticated|session/i.test(normalized)) return false;
  return ["/favorites", "/addresses", "/orders"].some((prefix) => path.startsWith(prefix));
}

/* ── Message d'erreur lisible ──────────────────────────────────── */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.errors.detail) return String(err.errors.detail);
    if (err.errors.non_field_errors) {
      const v = err.errors.non_field_errors;
      return Array.isArray(v) ? String(v[0]) : String(v);
    }
    const firstKey = Object.keys(err.errors)[0];
    if (firstKey) {
      const v = err.errors[firstKey];
      return Array.isArray(v) ? `${firstKey} : ${v[0]}` : `${firstKey} : ${v}`;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Une erreur inattendue est survenue.";
}

/* ── Requête générique ─────────────────────────────────────────── */
async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");

  if (method !== "GET" && method !== "HEAD") {
    headers.set("X-CSRFToken", await ensureCsrf());
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const res = await guardedFetch(`${apiBase}/api/v1${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 204) return null as T;

  let payload: Record<string, unknown> = {};
  const contentType = res.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      payload = (await res.json()) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }

  if (!res.ok) {
    const detail =
      (typeof payload.detail === "string" && payload.detail) ||
      (typeof payload.message === "string" && payload.message) ||
      `Erreur ${res.status}`;

    if (!retried && method !== "GET" && method !== "HEAD" && isCsrfFailure(detail)) {
      csrfValue = "";
      await ensureCsrf(true);
      return request<T>(path, options, true);
    }

    if (isCredentialFailure(path, res.status, detail)) unauthorizedHandler?.(path);
    throw new ApiError(res.status, detail, payload);
  }

  return payload as T;
}

/* ── Helpers ───────────────────────────────────────────────────── */
export const get = <T>(path: string, signalOrHeaders?: AbortSignal | HeadersInit) => {
  const isSignal = signalOrHeaders instanceof AbortSignal;
  return request<T>(path, {
    method: "GET",
    signal: isSignal ? signalOrHeaders : undefined,
    headers: isSignal ? undefined : (signalOrHeaders as HeadersInit | undefined),
  });
};

export const post = <T>(path: string, body?: unknown, headers?: HeadersInit) =>
  request<T>(path, {
    method: "POST",
    headers,
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  });

export const put = <T>(path: string, body?: unknown, headers?: HeadersInit) =>
  request<T>(path, {
    method: "PUT",
    headers,
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  });

export const patch = <T>(path: string, body?: unknown, headers?: HeadersInit) =>
  request<T>(path, {
    method: "PATCH",
    headers,
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  });

export const del = <T>(path: string, headers?: HeadersInit) =>
  request<T>(path, { method: "DELETE", headers });
