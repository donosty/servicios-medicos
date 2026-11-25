import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  phone: z.string().trim().min(7).max(25),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const passwordResetTokenSchema = z.object({
  token: z.string().trim().min(20).max(4096),
});

export const passwordResetSchema = z.object({
  token: z.string().trim().min(20).max(4096),
  password: z.string().min(8).max(72),
});
