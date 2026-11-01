const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  status: number;
  errors: Record<string, unknown>;
  constructor(status: number, message: string, errors: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
  /** Premier message d'erreur d'un champ. */
  field(name: string): string | undefined {
    const v = this.errors[name] as unknown;
    if (Array.isArray(v)) return String(v[0]);
    if (typeof v === "string") return v;
    return undefined;
  }
}

function csrfToken(): string {
  const m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/**
 * Flag indiquant que le cookie csrftoken est déjà posé.
 */
let csrfReady = false;

async function ensureCsrf() {
  if (csrfReady && !csrfToken()) {
    csrfReady = false;
  }
  if (csrfReady || csrfToken()) {
    csrfReady = true;
    return;
  }
  try {
    await fetch(`${BASE}/api/v1/auth/csrf/`, { credentials: "include" });
    csrfReady = true;
  } catch {
    // Si l'appel échoue, on continue
  }
}

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
      return Array.isArray(v) ? `${firstKey}: ${v[0]}` : `${firstKey}: ${v}`;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Une erreur inattendue est survenue.";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    await ensureCsrf();
    const token = csrfToken();
    if (token) headers.set("X-CSRFToken", token);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${BASE}/api/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let payload: Record<string, unknown> = {};
    try {
      payload = await res.json();
    } catch {
      /* réponse non-JSON */
    }
    const detail = (payload.detail as string) || (payload.message as string) || res.statusText;
    throw new ApiError(res.status, detail, payload);
  }

  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export const get = <T>(path: string, signalOrHeaders?: AbortSignal | HeadersInit) => {
  const isSignal = signalOrHeaders instanceof AbortSignal;
  return request<T>(path, {
    method: "GET",
    signal: isSignal ? signalOrHeaders : undefined,
    headers: isSignal ? undefined : signalOrHeaders,
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
