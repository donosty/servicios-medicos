import { getAvailableTimes } from "../services/availabilityService.js";
import { availabilitySchema } from "../validators/appointmentValidator.js";

export const getAvailability = async (request, response, next) => {
  try {
    const parsed = availabilitySchema.safeParse(request.query);
    if (!parsed.success) {
      return response
        .status(400)
        .json({ message: "Indica un médico y una fecha válidos." });
    }

    const { doctorId, date, excludeAppointmentId } = parsed.data;
    const times = await getAvailableTimes(doctorId, date, excludeAppointmentId);
    return response.json({ times });
  } catch (error) {
    return next(error);
  }
};
