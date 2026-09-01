import { clearToken, getToken } from "@/lib/auth";
import type { ApiEnvelope, ApiErrorEnvelope } from "@/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    ApiEnvelope<T> | ApiErrorEnvelope | null;
  if (!response.ok) {
    const error =
      payload && !payload.success
        ? payload.error
        : { code: "NETWORK_ERROR", message: "Không thể kết nối đến máy chủ." };
    if (response.status === 401 && !path.endsWith("/auth/login")) clearToken();
    throw new ApiError(
      response.status,
      error.code,
      error.message,
      error.details,
    );
  }
  return payload as ApiEnvelope<T>;
}
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, data: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown = {}) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Đã xảy ra lỗi không xác định.";
}
