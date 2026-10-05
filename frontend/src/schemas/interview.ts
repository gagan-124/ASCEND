import { z } from 'zod';

export const createInterviewSchema = z.object({
  roleTitle: z.string().min(2, 'Role title is required'),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'lead']),
  resumeId: z.string().optional(),
});

export type CreateInterviewSchemaType = z.infer<typeof createInterviewSchema>;
