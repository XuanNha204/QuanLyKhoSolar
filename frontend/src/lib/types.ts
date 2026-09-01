export type Role = "ADMIN" | "WAREHOUSE_MANAGER" | "STAFF";
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}
export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}
export interface ApiErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: unknown };
}
export type EntityRecord = Record<string, unknown> & { id: string };
