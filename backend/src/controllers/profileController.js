import { profileSchema } from '../validators/profileValidator.js';
import {
  getProfile,
  updateProfile,
  getUserAppointments,
  rescheduleUserAppointment,
} from '../services/profileService.js';
import { rescheduleSchema } from '../validators/profileValidator.js';

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
        message: 'Los datos del perfil no son válidos.',
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

export const rescheduleAppointmentController = async (request, response, next) => {
  try {
    const parsed = rescheduleSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ message: 'La nueva fecha y hora no son válidas.' });
    }

    const appointment = await rescheduleUserAppointment(
      request.usuario.userId,
      request.params.appointmentId,
      parsed.data,
    );
    return response.json({ appointment });
  } catch (error) {
    return next(error);
  }
};
