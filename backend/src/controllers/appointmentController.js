import { appointmentSchema } from "../validators/appointmentValidator.js";
import { createAppointment } from "../services/appointmentService.js";

export const createAppointmentController = async (request, response, next) => {
  try {
    const parsed = appointmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Los datos de la cita no son válidos.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const appointment = await createAppointment(parsed.data, request.usuario);
    return response.status(201).json({ appointment });
  } catch (error) {
    return next(error);
  }
};
