import { API_BASE_URL } from "./constants";

const isBrowser = globalThis.window !== undefined;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ApiClientOptions = RequestInit & {
  cookieHeader?: string;
  retry?: boolean;
};

function prepareRequestBody(rest: RequestInit, headers: Headers): void {
  const isBinaryType = (body: BodyInit): boolean =>
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof ReadableStream;

  if (rest.body && !headers.has("Content-Type") && !isBinaryType(rest.body)) {
    headers.set("Content-Type", "application/json");
  }

  if (
    rest.body &&
    typeof rest.body === "object" &&
    !isBinaryType(rest.body)
  ) {
    rest.body = JSON.stringify(rest.body);
  }
}

async function handleUnauthorized<T>(path: string, options: ApiClientOptions): Promise<T> {
  try {
    const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });

    if (refreshRes.ok) {
      return apiClient<T>(path, { ...options, retry: true });
    }

    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });

    globalThis.window.location.href = "/auth";
    throw new ApiError("Session expired", 401);
  } catch {
    globalThis.window.location.href = "/auth";
    throw new ApiError("Session expired", 401);
  }
}

export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { cookieHeader, headers: inputHeaders, ...rest } = options;
  const headers = new Headers(inputHeaders);

  prepareRequestBody(rest, headers);

  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (response.status === 401 && isBrowser && !options.retry) {
    return handleUnauthorized<T>(path, options);
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String(payload.message)
        : response.statusText || "Request failed";

    throw new ApiError(message, response.status);
  }

  return payload as T;
}
