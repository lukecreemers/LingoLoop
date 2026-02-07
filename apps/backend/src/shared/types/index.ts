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
export * from './explanation.types';
export * from './ai-assist.types';
export * from './ai-assist.dto';
export * from './redo-unit.dto';
export * from './flashcard.types';
export * from './writing-practice.types';
export * from './writing-practice.dto';
export * from './word-order.types';
export * from './topic-breakdown.types';
export * from './section-generation.types';
export * from './sectioned-lesson.types';
export * from './redo-section.dto';
export * from './timeline.types';
export * from './lesson-structure.types';
export * from './create-structured-lesson.dto';
export * from './curriculum.types';
export * from './section-chat.dto';
export * from './day-to-day-agent.types';
export * from './daily-loop.types';
