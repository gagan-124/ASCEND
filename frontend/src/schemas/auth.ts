import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  passwordHash: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  passwordHash: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
export type SignupSchemaType = z.infer<typeof signupSchema>;
