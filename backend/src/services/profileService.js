import {
  sequelize,
  Usuario,
  Patient,
  Appointment,
  Doctor,
  MedicalSpecialty,
  AppointmentStatus,
} from '../models/index.js';

export const createError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const getProfile = async (userId) => {
  const user = await Usuario.findByPk(userId);
  if (!user) throw createError('Usuario no encontrado.', 404);

  return {
    fullName: user.fullName,
    phone: user.phone || '',
    email: user.email,
  };
};

export const updateProfile = async (userId, data) =>
  sequelize.transaction(async (transaction) => {
    const user = await Usuario.findByPk(userId, { transaction });
    if (!user) throw createError('Usuario no encontrado.', 404);

    const email = data.email.toLowerCase();
    const emailOwner = await Usuario.findOne({
      where: { email },
      transaction,
    });
    if (emailOwner && emailOwner.userId !== userId) {
      throw createError('Ya existe una cuenta con este correo.', 409);
    }

    await user.update({
      fullName: data.fullName,
      phone: data.phone,
      email,
    }, { transaction });

    if (user.patientId) {
      const patient = await Patient.findByPk(user.patientId, { transaction });
      if (patient) {
        await patient.update({
          fullName: data.fullName,
          phone: data.phone,
          email,
        }, { transaction });
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
        as: 'medico',
        attributes: ['professionalTitle', 'firstName', 'lastName'],
      },
      {
        model: MedicalSpecialty,
        as: 'especialidad',
        attributes: ['name'],
      },
      {
        model: AppointmentStatus,
        as: 'estado',
        attributes: ['statusCode', 'name'],
      },
    ],
    order: [['startAt', 'DESC']],
  });

  const now = Date.now();
  const scheduled = [];
  const completed = [];

  appointments.forEach((appointment) => {
    const startAt = new Date(appointment.startAt);
    const statusCode = appointment.estado ? appointment.estado.statusCode : '';
    const isCompleted =
      statusCode === 'completada' ||
      (statusCode !== 'cancelada' && now >= startAt.getTime() + 60 * 1000);

    const item = {
      folio: appointment.folio,
      date: startAt.toISOString().slice(0, 10),
      time: startAt.toISOString().slice(11, 16),
      doctor: appointment.medico
        ? `${appointment.medico.professionalTitle} ${appointment.medico.firstName} ${appointment.medico.lastName}`
        : 'Médico no disponible',
      specialty: appointment.especialidad ? appointment.especialidad.name : 'Especialidad no disponible',
      status: appointment.estado ? appointment.estado.name : 'Sin estado',
    };

    if (isCompleted) completed.push(item);
    else if (statusCode !== 'cancelada') scheduled.push(item);
  });

  return { scheduled, completed };
};
