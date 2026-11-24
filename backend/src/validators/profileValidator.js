import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  phone: z.string().trim().min(7).max(25),
  email: z.string().trim().email().max(254),
});

export const rescheduleSchema = z.object({
  date: z.string().date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});
