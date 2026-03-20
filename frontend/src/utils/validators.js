import { z } from 'zod';

// Allowed audio/text file types for call uploads
const ALLOWED_FILE_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'text/plain', 'audio/mp3', 'audio/mp4'];
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.txt'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const uploadSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required').max(50, 'Agent ID too long'),
  campaignType: z.string().max(50, 'Campaign type is too long').optional(),
  file: z
    .any()
    .refine((f) => f instanceof File, 'Please select a file')
    .refine((f) => f?.size <= MAX_FILE_SIZE, 'File size must be under 50MB')
    .refine(
      (f) => {
        const ext = '.' + f?.name?.split('.').pop()?.toLowerCase();
        return ALLOWED_EXTENSIONS.includes(ext);
      },
      'Only .mp3, .wav, .m4a, or .txt files are accepted'
    ),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Please enter a valid email address'),
  organization: z.string().min(2, 'Organization name required').max(100, 'Organization name too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Validate data against a Zod schema
 * @returns {{ success: boolean, data?: any, errors?: Record<string, string> }}
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = {};
  const errorList = result.error?.errors ?? [];
  errorList.forEach((e) => {
    const field = e.path.join('.') || '_';
    if (!errors[field]) errors[field] = e.message;
  });
  return { success: false, errors };
}
