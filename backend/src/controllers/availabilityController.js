import { getAvailableTimes } from '../services/availabilityService.js';

export const getAvailability = async (request, response, next) => {
  try {
    const { doctorId, date } = request.query;
    if (!doctorId || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
      return response.status(400).json({ message: 'doctorId y date son requeridos.' });
    }

    const times = await getAvailableTimes(doctorId, date);
    return response.json({ times });
  } catch (error) {
    return next(error);
  }
};
