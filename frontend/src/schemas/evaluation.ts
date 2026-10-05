import { z } from 'zod';

export const evaluationRequestSchema = z.object({
  interviewId: z.string().min(1, 'Interview ID is required'),
});

export type EvaluationRequestSchemaType = z.infer<typeof evaluationRequestSchema>;
