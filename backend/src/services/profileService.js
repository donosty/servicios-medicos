import {
  sequelize,
  Usuario,
  Patient,
  Appointment,
  Doctor,
  MedicalSpecialty,
  AppointmentStatus,
  AppointmentRegistration,
  AppointmentHistory,
  DoctorAvailabilitySlot,
} from "../models/index.js";
import { Op } from "sequelize";

const rescheduleNoticeMs = 24 * 60 * 60 * 1000;
const clinicClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// startAt stores the clinic's displayed date and time in its UTC fields.
const earliestReschedulableStart = (now) => {
  const threshold = new Date(now + rescheduleNoticeMs);
  const parts = Object.fromEntries(
    clinicClock
      .formatToParts(threshold)
      .map(({ type, value }) => [type, value]),
  );
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    threshold.getUTCMilliseconds(),
  );
};

export const createError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const getProfile = async (userId) => {
  const user = await Usuario.findByPk(userId);
  if (!user) throw createError("Usuario no encontrado.", 404);

  return {
    fullName: user.fullName,
    phone: user.phone || "",
    email: user.email,
  };
};

export const updateProfile = async (userId, data) =>
  sequelize.transaction(async (transaction) => {
    const user = await Usuario.findByPk(userId, { transaction });
    if (!user) throw createError("Usuario no encontrado.", 404);

    const email = data.email.toLowerCase();
    const emailOwner = await Usuario.findOne({
      where: { email },
      transaction,
    });
    if (emailOwner && emailOwner.userId !== userId) {
      throw createError("Ya existe una cuenta con este correo.", 409);
    }

    await user.update(
      {
        fullName: data.fullName,
        phone: data.phone,
        email,
      },
      { transaction },
    );

    if (user.patientId) {
      const patient = await Patient.findByPk(user.patientId, { transaction });
      if (patient) {
        await patient.update(
          {
            fullName: data.fullName,
            phone: data.phone,
            email,
          },
          { transaction },
        );
      }
    }

    return {
      fullName: data.fullName,
      phone: data.phone,
      email,
    };
  });

export const getUserAppointments = async (userId) => {
  const appointments = await Appointment.findAll({
    where: { userId },
    include: [
      {
        model: Doctor,
        as: "medico",
        attributes: ["professionalTitle", "firstName", "lastName"],
      },
      {
        model: MedicalSpecialty,
        as: "especialidad",
        attributes: ["name"],
      },
      {
        model: AppointmentStatus,
        as: "estado",
        attributes: ["statusCode", "name"],
      },
    ],
    order: [["startAt", "DESC"]],
  });

  const now = Date.now();
  const earliestStart = earliestReschedulableStart(now);
  const scheduled = [];
  const completed = [];

  appointments.forEach((appointment) => {
    const startAt = new Date(appointment.startAt);
    const statusCode = appointment.estado ? appointment.estado.statusCode : "";
    const isCompleted =
      statusCode === "completada" ||
      (statusCode !== "cancelada" && now >= startAt.getTime() + 60 * 1000);

    const item = {
      appointmentId: appointment.appointmentId,
      doctorId: appointment.doctorId,
      folio: appointment.folio,
      date: startAt.toISOString().slice(0, 10),
      time: startAt.toISOString().slice(11, 16),
      doctor: appointment.medico
        ? `${appointment.medico.professionalTitle} ${appointment.medico.firstName} ${appointment.medico.lastName}`
        : "Médico no disponible",
      specialty: appointment.especialidad
        ? appointment.especialidad.name
        : "Especialidad no disponible",
      status: appointment.estado ? appointment.estado.name : "Sin estado",
      statusCode,
      rescheduled: !!appointment.rescheduledAt,
      canReschedule:
        statusCode === "confirmada" &&
        !appointment.rescheduledAt &&
        startAt.getTime() >= earliestStart,
    };

    if (isCompleted) completed.push(item);
    else if (statusCode !== "cancelada") scheduled.push(item);
  });

  return { scheduled, completed };
};

export const rescheduleUserAppointment = async (userId, appointmentId, data) =>
  sequelize.transaction(async (transaction) => {
    const appointment = await Appointment.findOne({
      where: { appointmentId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!appointment)
      throw createError("La cita no existe o no pertenece a tu perfil.", 404);
    if (appointment.rescheduledAt) {
      throw createError("Esta cita ya fue reprogramada una vez.", 422);
    }

    const status = await AppointmentStatus.findByPk(appointment.statusId, {
      transaction,
    });
    if (!status || status.statusCode !== "confirmada") {
      throw createError("Solo puedes cambiar citas confirmadas.", 422);
    }

    const now = Date.now();
    if (
      new Date(appointment.startAt).getTime() < earliestReschedulableStart(now)
    ) {
      throw createError(
        "Solo puedes cambiar el horario con al menos 24 horas de anticipación a tu cita.",
        422,
      );
    }

    const startAt = new Date(`${data.date}T${data.time}:00Z`);
    if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) {
      throw createError("La nueva fecha y hora no están disponibles.", 422);
    }
    const originalStartAt = new Date(appointment.startAt);
    if (
      startAt.getUTCFullYear() === originalStartAt.getUTCFullYear() &&
      startAt.getUTCMonth() === originalStartAt.getUTCMonth() &&
      startAt.getUTCDate() === originalStartAt.getUTCDate() &&
      startAt.getUTCHours() === originalStartAt.getUTCHours() &&
      startAt.getUTCMinutes() === originalStartAt.getUTCMinutes()
    ) {
      throw createError(
        "Selecciona una fecha o hora diferente a la cita actual.",
        422,
      );
    }

    const slot = await DoctorAvailabilitySlot.findOne({
      where: {
        doctorId: appointment.doctorId,
        dayOfWeek: new Date(`${data.date}T00:00:00Z`).getUTCDay(),
        startTime: `${data.time}:00`,
        isActive: true,
      },
      transaction,
    });
    if (!slot)
      throw createError("El horario seleccionado no está disponible.", 409);

    const conflict = await Appointment.findOne({
      where: {
        doctorId: appointment.doctorId,
        startAt,
        statusId: { [Op.ne]: 4 },
        appointmentId: { [Op.ne]: appointmentId },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (conflict)
      throw createError("El horario seleccionado ya fue registrado.", 409);

    const previousStartAt = new Date(appointment.startAt);
    const previousEndAt = appointment.endAt
      ? new Date(appointment.endAt)
      : new Date(previousStartAt.getTime() + 30 * 60 * 1000);
    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
    const previousVersion = {
      startAt: previousStartAt.toISOString(),
      endAt: previousEndAt.toISOString(),
      date: previousStartAt.toISOString().slice(0, 10),
      time: previousStartAt.toISOString().slice(11, 16),
      doctorId: appointment.doctorId,
      specialtyId: appointment.specialtyId,
      statusId: appointment.statusId,
    };
    const updatedVersion = {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      date: data.date,
      time: data.time,
      doctorId: appointment.doctorId,
      specialtyId: appointment.specialtyId,
      statusId: appointment.statusId,
    };

    await appointment.update(
      {
        startAt,
        endAt,
        rescheduledAt: new Date(now),
      },
      { transaction },
    );

    await AppointmentHistory.create(
      {
        appointmentId,
        userId,
        previousVersion,
        updatedVersion,
        createdAt: new Date(now),
      },
      { transaction },
    );

    const registration = await AppointmentRegistration.findOne({
      where: { appointmentId },
      transaction,
    });
    if (registration) {
      await registration.update(
        {
          appointmentDate: data.date,
          appointmentTime: data.time,
        },
        { transaction },
      );
    }

    return {
      appointmentId: appointment.appointmentId,
      folio: appointment.folio,
      date: data.date,
      time: data.time,
    };
  });
