import { randomBytes } from "node:crypto";
import { Op } from "sequelize";
import {
  sequelize,
  MedicalSpecialty,
  Doctor,
  Patient,
  AppointmentStatus,
  Appointment,
  AppointmentRegistration,
  Usuario,
} from "../models/index.js";

const createError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const generateFolio = (date) =>
  `MED-${date.replaceAll("-", "")}-${randomBytes(4).toString("hex").toUpperCase()}`;

export const createAppointment = async (data, user) =>
  sequelize.transaction(async (transaction) => {
    if (!user || !user.userId) {
      throw createError("Debes iniciar sesión para agendar una cita.", 401);
    }

    const account = await Usuario.findByPk(user.userId, { transaction });
    if (!account || !account.isActive) {
      throw createError("La sesión del usuario ya no es válida.", 401);
    }

    const patientName = account.fullName;
    const patientPhone = account.phone;
    const patientEmail = account.email.toLowerCase();
    if (!patientPhone) {
      throw createError(
        "Completa tu teléfono en el perfil antes de agendar.",
        422,
      );
    }

    const specialty = await MedicalSpecialty.findOne({
      where: { slug: data.specialty, isActive: true },
      transaction,
    });
    if (!specialty) throw createError("Especialidad no encontrada.", 404);

    const doctor = await Doctor.findOne({
      where: { doctorId: data.doctorId, isActive: true },
      include: [
        {
          model: MedicalSpecialty,
          as: "especialidades",
          where: { specialtyId: specialty.specialtyId },
          through: { attributes: [] },
          required: true,
        },
      ],
      transaction,
    });
    if (!doctor) {
      throw createError(
        "El médico no corresponde a la especialidad seleccionada.",
        422,
      );
    }

    const startAt = new Date(`${data.date}T${data.time}:00Z`);
    if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) {
      throw createError(
        "La fecha y hora seleccionadas no están disponibles.",
        422,
      );
    }

    const confirmedStatus = await AppointmentStatus.findOne({
      where: { statusCode: "confirmada" },
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
    if (existing)
      throw createError("El horario seleccionado ya fue registrado.", 409);

    const [patient] = await Patient.findOrCreate({
      where: { email: patientEmail },
      defaults: {
        fullName: patientName,
        phone: patientPhone,
        email: patientEmail,
      },
      transaction,
    });
    if (
      patient.fullName !== patientName ||
      patient.phone !== patientPhone ||
      patient.email !== patientEmail
    ) {
      await patient.update(
        { fullName: patientName, phone: patientPhone, email: patientEmail },
        { transaction },
      );
    }

    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
    let appointment;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        appointment = await Appointment.create(
          {
            folio: generateFolio(data.date),
            userId: user.userId,
            patientId: patient.patientId,
            doctorId: doctor.doctorId,
            specialtyId: specialty.specialtyId,
            startAt,
            endAt,
            statusId: confirmedStatus.statusId,
          },
          { transaction },
        );
        break;
      } catch (error) {
        if (error.name !== "SequelizeUniqueConstraintError") throw error;
      }
    }
    if (!appointment) {
      throw createError("No fue posible generar un folio único.", 500);
    }

    await AppointmentRegistration.create(
      {
        appointmentId: appointment.appointmentId,
        folio: appointment.folio,
        specialtyName: specialty.name,
        doctorName: `${doctor.professionalTitle} ${doctor.firstName} ${doctor.lastName}`,
        patientName,
        patientPhone,
        patientEmail,
        appointmentDate: data.date,
        appointmentTime: data.time,
      },
      { transaction },
    );

    return {
      folio: appointment.folio,
      specialty: specialty.name,
      doctor: `${doctor.professionalTitle} ${doctor.firstName} ${doctor.lastName}`,
      date: data.date,
      time: data.time,
      patientName,
      patientEmail,
    };
  });
