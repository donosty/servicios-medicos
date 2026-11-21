import { z } from 'zod';

export const appointmentSchema = z.object({
  doctorId: z.string().uuid(),
  specialty: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  patient: z.object({
    name: z.string().trim().min(3).max(120),
    phone: z.string().trim().min(7).max(25),
    email: z.string().trim().email().max(254),
  }),
});
