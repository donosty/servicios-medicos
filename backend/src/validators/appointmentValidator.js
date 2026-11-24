import { z } from 'zod';

const uuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
);

export const availabilitySchema = z.object({
  doctorId: uuidSchema,
  date: z.string().date(),
  excludeAppointmentId: uuidSchema.optional(),
});

export const appointmentSchema = availabilitySchema.extend({
  specialty: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});
