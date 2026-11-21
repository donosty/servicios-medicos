import { randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  MedicalSpecialty,
  Doctor,
  Patient,
  AppointmentStatus,
  Appointment,
  AppointmentRegistration,
} from '../models/index.js';

const createError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const generateFolio = (date) =>
  `MED-${date.replaceAll('-', '')}-${randomBytes(4).toString('hex').toUpperCase()}`;

export const createAppointment = async (data) =>
  sequelize.transaction(async (transaction) => {
    const specialty = await MedicalSpecialty.findOne({
      where: { slug: data.specialty, isActive: true },
      transaction,
    });
    if (!specialty) throw createError('Especialidad no encontrada.', 404);

    const doctor = await Doctor.findOne({
      where: { doctorId: data.doctorId, isActive: true },
      include: [{
        model: MedicalSpecialty,
        where: { specialtyId: specialty.specialtyId },
        through: { attributes: [] },
        required: true,
      }],
      transaction,
    });
    if (!doctor) {
      throw createError('El médico no corresponde a la especialidad seleccionada.', 422);
    }

    const startAt = new Date(`${data.date}T${data.time}:00Z`);
    if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) {
      throw createError('La fecha y hora seleccionadas no están disponibles.', 422);
    }

    const confirmedStatus = await AppointmentStatus.findOne({
      where: { statusCode: 'confirmed' },
      transaction,
    });
    const existing = await Appointment.findOne({
      where: {
        doctorId: doctor.doctorId,
        startAt,
        statusId: { [Op.ne]: 4 },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (existing) throw createError('El horario seleccionado ya fue registrado.', 409);

    const [patient] = await Patient.findOrCreate({
      where: { email: data.patient.email.toLowerCase() },
      defaults: {
        fullName: data.patient.name,
        phone: data.patient.phone,
        email: data.patient.email.toLowerCase(),
      },
      transaction,
    });
    if (patient.fullName !== data.patient.name || patient.phone !== data.patient.phone) {
      await patient.update(
        { fullName: data.patient.name, phone: data.patient.phone },
        { transaction },
      );
    }

    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
    let appointment;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        appointment = await Appointment.create({
          folio: generateFolio(data.date),
          patientId: patient.patientId,
          doctorId: doctor.doctorId,
          specialtyId: specialty.specialtyId,
          startAt,
          endAt,
          statusId: confirmedStatus.statusId,
        }, { transaction });
        break;
      } catch (error) {
        if (error.name !== 'SequelizeUniqueConstraintError') throw error;
      }
    }
    if (!appointment) {
      throw createError('No fue posible generar un folio único.', 500);
    }

    await AppointmentRegistration.create({
      appointmentId: appointment.appointmentId,
      folio: appointment.folio,
      specialtyName: specialty.name,
      doctorName: `${doctor.professionalTitle} ${doctor.firstName} ${doctor.lastName}`,
      patientName: data.patient.name,
      patientPhone: data.patient.phone,
      patientEmail: data.patient.email.toLowerCase(),
      appointmentDate: data.date,
      appointmentTime: data.time,
    }, { transaction });

    return {
      folio: appointment.folio,
      specialty: specialty.name,
      doctor: `${doctor.professionalTitle} ${doctor.firstName} ${doctor.lastName}`,
      date: data.date,
      time: data.time,
    };
  });
