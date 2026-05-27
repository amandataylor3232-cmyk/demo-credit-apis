import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email(),
  phone: z
    .string()
    .trim()
    .regex(/^\+234\d{10}$/, 'Phone must be in +234XXXXXXXXXX format'),
  bvn: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'BVN must be an 11-digit number'),
});

export const amountSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
});

export const transferSchema = amountSchema.extend({
  recipientEmail: z.string().trim().email(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type AmountInput = z.infer<typeof amountSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
