import { getActiveMedicalServices } from '../services/medicalServiceService.js';

export const getMedicalServices = async (_request, response, next) => {
  try {
    const services = await getActiveMedicalServices();
    response.json({ services });
  } catch (error) {
    next(error);
  }
};
