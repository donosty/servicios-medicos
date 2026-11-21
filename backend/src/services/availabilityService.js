import { Op } from 'sequelize';
import { DoctorAvailabilitySlot, Appointment } from '../models/index.js';

const agendaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dayStart = (date) => new Date(`${date}T00:00:00Z`);
const slotKey = (doctorId, dateTime) => `${doctorId}/${dateTime}`;

export const getUpcomingAgendaDates = (now = new Date()) => {
  const parts = Object.fromEntries(agendaDate.formatToParts(now).map(({ type, value }) => [type, value]));
  const date = dayStart(`${parts.year}-${parts.month}-${parts.day}`);
  return Array.from({ length: 7 }, () => {
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  });
};

// The agenda queries one day at a time or the next seven consecutive days.
export const getOpenSlotsByDoctor = async (doctorIds, dates) => {
  const openSlots = new Map();
  if (doctorIds.length === 0) return openSlots;

  const datesByWeekday = new Map(dates.map((date) => [dayStart(date).getUTCDay(), date]));
  const nextDay = dayStart(dates.at(-1));
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const [slots, booked] = await Promise.all([
    DoctorAvailabilitySlot.findAll({
      where: {
        doctorId: { [Op.in]: doctorIds },
        dayOfWeek: { [Op.in]: [...datesByWeekday.keys()] },
        isActive: true,
      },
      attributes: ['doctorId', 'dayOfWeek', 'startTime'],
      order: [['startTime', 'ASC']],
    }),
    Appointment.findAll({
      where: {
        doctorId: { [Op.in]: doctorIds },
        startAt: { [Op.gte]: dayStart(dates[0]), [Op.lt]: nextDay },
        statusId: { [Op.ne]: 4 },
      },
      attributes: ['doctorId', 'startAt'],
    }),
  ]);
  const bookedTimes = new Set(booked.map((appointment) =>
    slotKey(appointment.doctorId, new Date(appointment.startAt).toISOString().slice(0, 16)),
  ));

  for (const slot of slots) {
    const date = datesByWeekday.get(slot.dayOfWeek);
    const time = slot.startTime.slice(0, 5);
    if (bookedTimes.has(slotKey(slot.doctorId, `${date}T${time}`))) continue;

    const doctorSlots = openSlots.get(slot.doctorId) ?? [];
    doctorSlots.push(time);
    openSlots.set(slot.doctorId, doctorSlots);
  }

  return openSlots;
};

export const getAvailableTimes = async (doctorId, date) => {
  const openSlots = await getOpenSlotsByDoctor([doctorId], [date]);
  return openSlots.get(doctorId) ?? [];
};
