import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export const resumeUploadSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, 'Please select a valid resume file.')
    .refine((file) => file.size <= MAX_FILE_SIZE, 'File size exceeds maximum limit of 10MB.')
    .refine((file) => {
      if (ACCEPTED_FILE_TYPES.includes(file.type)) return true;
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension === 'pdf' || extension === 'docx' || extension === 'doc';
    }, 'Invalid file format. Only PDF and DOCX documents are supported.'),
});

export type ResumeUploadSchemaType = z.infer<typeof resumeUploadSchema>;

