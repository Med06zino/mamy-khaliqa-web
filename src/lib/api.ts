const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[] | string[][]>;
  constructor(status: number, message: string, errors: Record<string, never> = {}) {
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

let csrfReady = false;
async function ensureCsrf() {
  if (csrfReady || csrfToken()) { csrfReady = true; return; }
  await fetch(`${BASE}/api/v1/auth/csrf/`, { credentials: "include" });
  csrfReady = true;
}

interface Options { method?: string; body?: unknown; headers?: Record<string, string>; signal?: AbortSignal }

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) body = opts.body;
  else if (opts.body !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(opts.body); }
  if (method !== "GET") { await ensureCsrf(); headers["X-CSRFToken"] = csrfToken(); }

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/v1${path}`, { method, headers, body, credentials: "include", signal: opts.signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError(0, "Impossible de joindre le serveur. Verifiez votre connexion et reessayez.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.detail || (res.status >= 500 ? "Une erreur est survenue sur le serveur. Reessayez dans un instant." : "Requete invalide.");
    throw new ApiError(res.status, msg, data?.errors ?? {});
  }
  return data as T;
}

export const get = <T,>(p: string, signal?: AbortSignal) => api<T>(p, { signal });
export const post = <T,>(p: string, body?: unknown, headers?: Record<string, string>) => api<T>(p, { method: "POST", body, headers });
export const patch = <T,>(p: string, body?: unknown) => api<T>(p, { method: "PATCH", body });
export const put = <T,>(p: string, body?: unknown) => api<T>(p, { method: "PUT", body });
export const del = <T,>(p: string) => api<T>(p, { method: "DELETE" });

export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : "Une erreur inattendue est survenue.";
}
