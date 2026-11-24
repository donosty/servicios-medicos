import { getDoctors } from "../services/doctorService.js";

export const getDoctorsController = async (request, response, next) => {
  try {
    const doctors = await getDoctors(request.query.specialty);
    response.json({ doctors });
  } catch (error) {
    next(error);
  }
};
