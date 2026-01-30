// Shared TypeScript types
// Example:
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string | null;
  error: string | null;
  path: string;
  method: string;
  timestamp: string;
  data?: T;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export * from "./units";
