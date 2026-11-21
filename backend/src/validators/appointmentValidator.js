import { z } from 'zod';

export const appointmentSchema = z.object({
  doctorId: z.string().uuid(),
  specialty: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});
