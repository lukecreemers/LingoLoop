// Shared TypeScript types
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

export * from './fill-in-blanks.types';
export * from './write-in-blanks.types';
export * from './word-meaning-match.types';
export * from './translation-marking.types';
export * from './translation-marking.dto';
export * from './translation-generation.types';
export * from './story-generation.types';
export * from './conversation-generation.types';
export * from './custom-lesson-generation.types';
