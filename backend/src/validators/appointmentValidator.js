import { z } from 'zod';

export const availabilitySchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().date(),
});

export const appointmentSchema = availabilitySchema.extend({
  specialty: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});
