import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import { z } from 'zod';
import {
  sequelize,
  MedicalSpecialty,
  Doctor,
  DoctorAvailabilitySlot,
  Patient,
  AppointmentStatus,
  Appointment,
  AppointmentRegistration,
} from './models/index.js';

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/api', (_request, response) => {
  response.json({ message: 'Servicios Médicos API' });
});

app.get('/api/specialties', async (_request, response, next) => {
  try {
    const specialties = await MedicalSpecialty.findAll({
      where: { isActive: true },
      attributes: ['specialtyId', 'slug', 'name', 'description', 'iconPath'],
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
    });

    response.json({
      specialties: specialties.map((specialty) => ({
        id: specialty.slug,
        name: specialty.name,
        description: specialty.description,
        icon: specialty.iconPath,
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/doctors', async (request, response, next) => {
  try {
    const { specialty } = request.query;
    const where = specialty ? { slug: specialty } : {};
    const specialties = await MedicalSpecialty.findAll({
      where: { ...where, isActive: true },
      attributes: ['specialtyId', 'slug', 'name'],
      include: [{
        model: Doctor,
        attributes: ['doctorId', 'professionalTitle', 'firstName', 'lastName', 'description', 'imagePath'],
        through: { attributes: [] },
        where: { isActive: true },
        required: true,
      }],
      order: [['displayOrder', 'ASC'], [Doctor, 'lastName', 'ASC']],
    });

    response.json({
      doctors: specialties.flatMap((item) =>
        item.Doctors.map((doctor) => ({
          id: doctor.doctorId,
          specialty: item.slug,
          specialtyName: item.name,
          name: `${doctor.professionalTitle} ${doctor.firstName} ${doctor.lastName}`,
          description: doctor.description,
          image: doctor.imagePath,
        })),
      ),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/availability', async (request, response, next) => {
  try {
    const { doctorId, date } = request.query;
    if (!doctorId || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
      return response.status(400).json({ message: 'doctorId y date son requeridos.' });
    }

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

    response.json({
      times: slots
        .map((slot) => slot.startTime.slice(0, 5))
        .filter((time) => !bookedTimes.has(time)),
    });
  } catch (error) {
    next(error);
  }
});

const appointmentSchema = z.object({
  doctorId: z.string().uuid(),
  specialty: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  patient: z.object({
    name: z.string().trim().min(3).max(120),
    phone: z.string().trim().min(7).max(25),
    email: z.string().trim().email().max(254),
  }),
});

app.post('/api/appointments', async (request, response, next) => {
  try {
    const parsed = appointmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: 'Los datos de la cita no son válidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const folio = () =>
      `MED-${parsed.data.date.replaceAll('-', '')}-${randomBytes(4).toString('hex').toUpperCase()}`;

    const result = await sequelize.transaction(async (transaction) => {
      const specialty = await MedicalSpecialty.findOne({
        where: { slug: parsed.data.specialty, isActive: true },
        transaction,
      });
      if (!specialty) {
        const error = new Error('Especialidad no encontrada.');
        error.status = 404;
        throw error;
      }

      const doctor = await Doctor.findOne({
        where: { doctorId: parsed.data.doctorId, isActive: true },
        include: [{
          model: MedicalSpecialty,
          where: { specialtyId: specialty.specialtyId },
          through: { attributes: [] },
          required: true,
        }],
        transaction,
      });
      if (!doctor) {
        const error = new Error('El médico no corresponde a la especialidad seleccionada.');
        error.status = 422;
        throw error;
      }

      const startAt = new Date(`${parsed.data.date}T${parsed.data.time}:00Z`);
      if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) {
        const error = new Error('La fecha y hora seleccionadas no están disponibles.');
        error.status = 422;
        throw error;
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
      if (existing) {
        const error = new Error('El horario seleccionado ya fue registrado.');
        error.status = 409;
        throw error;
      }

      const [patient] = await Patient.findOrCreate({
        where: { email: parsed.data.patient.email.toLowerCase() },
        defaults: {
          fullName: parsed.data.patient.name,
          phone: parsed.data.patient.phone,
          email: parsed.data.patient.email.toLowerCase(),
        },
        transaction,
      });
      if (patient.fullName !== parsed.data.patient.name || patient.phone !== parsed.data.patient.phone) {
        await patient.update(
          { fullName: parsed.data.patient.name, phone: parsed.data.patient.phone },
          { transaction },
        );
      }

      const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
      let appointment;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          appointment = await Appointment.create({
            folio: folio(),
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
        const error = new Error('No fue posible generar un folio único.');
        error.status = 500;
        throw error;
      }

      await AppointmentRegistration.create({
        appointmentId: appointment.appointmentId,
        folio: appointment.folio,
        specialtyName: specialty.name,
        doctorName: `${doctor.professionalTitle} ${doctor.firstName} ${doctor.lastName}`,
        patientName: parsed.data.patient.name,
        patientPhone: parsed.data.patient.phone,
        patientEmail: parsed.data.patient.email.toLowerCase(),
        appointmentDate: parsed.data.date,
        appointmentTime: parsed.data.time,
      }, { transaction });

      return {
        folio: appointment.folio,
        specialty: specialty.name,
        doctor: `${doctor.professionalTitle} ${doctor.firstName} ${doctor.lastName}`,
        date: parsed.data.date,
        time: parsed.data.time,
      };
    });

    return response.status(201).json({ appointment: result });
  } catch (error) {
    if (error.status) {
      return response.status(error.status).json({ message: error.message });
    }
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: 'Error interno del servidor.' });
});

const start = async () => {
  await sequelize.authenticate();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Backend escuchando en el puerto ${port}`);
  });
};

start().catch((error) => {
  console.error('No fue posible iniciar el backend:', error);
  process.exit(1);
});
