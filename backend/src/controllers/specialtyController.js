import { getActiveSpecialties } from '../services/specialtyService.js';

export const getSpecialties = async (_request, response, next) => {
  try {
    const specialties = await getActiveSpecialties();
    response.json({ specialties });
  } catch (error) {
    next(error);
  }
};
