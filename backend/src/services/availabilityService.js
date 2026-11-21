import { Op } from 'sequelize';
import { DoctorAvailabilitySlot, Appointment } from '../models/index.js';

export const getAvailableTimes = async (doctorId, date) => {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const slots = await DoctorAvailabilitySlot.findAll({
    where: { doctorId, dayOfWeek: day, isActive: true },
    order: [['startTime', 'ASC']],
  });

  const dayStart = new Date(`${date}T00:00:00Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);
  const booked = await Appointment.findAll({
    where: {
      doctorId,
      startAt: { [Op.between]: [dayStart, dayEnd] },
      statusId: { [Op.ne]: 4 },
    },
    attributes: ['startAt'],
  });

  const bookedTimes = new Set(
    booked.map((appointment) =>
      new Date(appointment.startAt).toISOString().slice(11, 16),
    ),
  );

  return slots
    .map((slot) => slot.startTime.slice(0, 5))
    .filter((time) => !bookedTimes.has(time));
};
