import { appointmentSchema } from "../validators/appointmentValidator.js";
import { createAppointment } from "../services/appointmentService.js";
import { sendAppointmentConfirmation } from "../services/appointmentEmailService.js";

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
    let emailSent = true;
    try {
      await sendAppointmentConfirmation(appointment);
    } catch (error) {
      emailSent = false;
      console.error(
        "No fue posible enviar la confirmación de cita:",
        error.message,
      );
    }

    const {
      patientName: _patientName,
      patientEmail: _patientEmail,
      ...details
    } = appointment;
    return response.status(201).json({ appointment: details, emailSent });
  } catch (error) {
    return next(error);
  }
};
