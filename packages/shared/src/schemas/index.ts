import { z } from 'zod';

// Shared Zod schemas for validation on both frontend and backend
// Example:
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.coerce.date(),
});

export type UserDTO = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true });
export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type PaginationDTO = z.infer<typeof PaginationSchema>;

