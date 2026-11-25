import { sendAppointmentReschedule } from "../services/appointmentEmailService.js";
import { profileSchema } from "../validators/profileValidator.js";
import {
  getProfile,
  deactivateProfile,
  updateProfile,
  getUserAppointments,
  rescheduleUserAppointment,
} from "../services/profileService.js";
import { rescheduleSchema } from "../validators/profileValidator.js";

import { clearSessionCookie } from "../middlewares/authMiddleware.js";

export const deactivateProfileController = async (request, response, next) => {
  try {
    await deactivateProfile(request.usuario.userId);
    clearSessionCookie(response);
    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const getProfileController = async (request, response, next) => {
  try {
    const profile = await getProfile(request.usuario.userId);
    return response.json({ profile });
  } catch (error) {
    return next(error);
  }
};

export const updateProfileController = async (request, response, next) => {
  try {
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Los datos del perfil no son válidos.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const profile = await updateProfile(request.usuario.userId, parsed.data);
    return response.json({ profile });
  } catch (error) {
    return next(error);
  }
};

export const getAppointmentsController = async (request, response, next) => {
  try {
    const appointments = await getUserAppointments(request.usuario.userId);
    return response.json(appointments);
  } catch (error) {
    return next(error);
  }
};

export const rescheduleAppointmentController = async (
  request,
  response,
  next,
) => {
  try {
    const parsed = rescheduleSchema.safeParse(request.body);
    if (!parsed.success) {
      return response
        .status(400)
        .json({ message: "La nueva fecha y hora no son válidas." });
    }

    const appointment = await rescheduleUserAppointment(
      request.usuario.userId,
      request.params.appointmentId,
      parsed.data,
    );
    let emailSent = true;
    try {
      await sendAppointmentReschedule({
        ...appointment,
        patientName: request.usuario.fullName,
        patientEmail: request.usuario.email,
      });
    } catch (error) {
      emailSent = false;
      console.error("No se pudo enviar el correo de reprogramación:", error.message);
    }
    return response.json({ appointment, emailSent });
  } catch (error) {
    return next(error);
  }
};
