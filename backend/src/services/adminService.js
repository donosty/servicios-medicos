import { z } from "zod";
import { Op } from "sequelize";
import {
  sequelize,
  ServicioMedico,
  MedicalSpecialty,
  Doctor,
  DoctorAvailabilitySlot,
  Appointment,
  AppointmentStatus,
  Patient,
  AppointmentHistory,
} from "../models/index.js";

const createError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const toSlug = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const getAdminData = async () => {
  const [
    services,
    specialties,
    doctors,
    appointments,
    statuses,
    appointmentHistory,
  ] = await Promise.all([
    ServicioMedico.findAll({
      include: [
        {
          model: MedicalSpecialty,
          as: "especialidades",
          attributes: ["specialtyId", "slug", "name"],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [
        ["displayOrder", "ASC"],
        ["name", "ASC"],
      ],
    }),
    MedicalSpecialty.findAll({
      order: [
        ["displayOrder", "ASC"],
        ["name", "ASC"],
      ],
    }),
    Doctor.findAll({
      include: [
        {
          model: MedicalSpecialty,
          as: "especialidades",
          attributes: ["specialtyId", "slug", "name"],
          through: { attributes: [] },
          required: false,
        },
        {
          model: DoctorAvailabilitySlot,
          as: "horarios",
          attributes: [
            "slotId",
            "doctorId",
            "dayOfWeek",
            "startTime",
            "durationMinutes",
            "isActive",
          ],
          required: false,
        },
      ],
      order: [
        ["firstName", "ASC"],
        ["lastName", "ASC"],
      ],
    }),
    Appointment.findAll({
      include: [
        {
          model: Doctor,
          as: "medico",
          attributes: ["professionalTitle", "firstName", "lastName"],
        },
        { model: MedicalSpecialty, as: "especialidad", attributes: ["name"] },
        {
          model: AppointmentStatus,
          as: "estado",
          attributes: ["statusId", "statusCode", "name"],
        },
        {
          model: Patient,
          as: "paciente",
          attributes: ["fullName", "phone", "email"],
        },
      ],
      order: [["startAt", "ASC"]],
    }),
    AppointmentStatus.findAll({ order: [["statusId", "ASC"]] }),
    AppointmentHistory.findAll({
      order: [["createdAt", "DESC"]],
    }),
  ]);

  return {
    services: services.map((service) => ({
      id: service.serviceId,
      slug: service.slug,
      name: service.name,
      description: service.description,
      catalogTitle: service.catalogTitle,
      catalogDescription: service.catalogDescription,
      category: service.category,
      symbol: service.symbol,
      features: service.features ?? [],
      catalogOrder: service.catalogOrder ?? service.displayOrder,
      displayOrder: service.displayOrder,
      price: service.price === null ? null : Number(service.price),
      isActive: service.isActive,
      specialties: (service.especialidades ?? []).map((item) => item.slug),
    })),
    specialties: specialties.map((item) => ({
      id: item.specialtyId,
      description: item.description,
      iconPath: item.iconPath,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
      slug: item.slug,
      name: item.name,
    })),
    doctors: doctors.map((doctor) => ({
      id: doctor.doctorId,
      professionalTitle: doctor.professionalTitle,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      description: doctor.description,
      imagePath: doctor.imagePath,
      name: `${doctor.professionalTitle} ${doctor.firstName} ${doctor.lastName}`,
      isActive: doctor.isActive,
      specialties: (doctor.especialidades ?? []).map((item) => item.slug),
      slots: (doctor.horarios ?? [])
        .map((slot) => ({
          id: slot.slotId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime.slice(0, 5),
          durationMinutes: slot.durationMinutes,
          isActive: slot.isActive,
        }))
        .sort(
          (a, b) =>
            a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
        ),
    })),
    appointments: appointments.map((appointment) => {
      const startAt = new Date(appointment.startAt);
      const history = appointmentHistory
        .filter((item) => item.appointmentId === appointment.appointmentId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map((item) => ({
          id: item.historyId,
          changedAt: item.createdAt?.toISOString() ?? null,
          previous: item.previousVersion,
          updated: item.updatedVersion,
        }));
      return {
        id: appointment.appointmentId,
        folio: appointment.folio,
        patient: appointment.paciente?.fullName ?? "Paciente no disponible",
        phone: appointment.paciente?.phone ?? "",
        email: appointment.paciente?.email ?? "",
        doctor: appointment.medico
          ? `${appointment.medico.professionalTitle} ${appointment.medico.firstName} ${appointment.medico.lastName}`
          : "Médico no disponible",
        specialty:
          appointment.especialidad?.name ?? "Especialidad no disponible",
        date: startAt.toISOString().slice(0, 10),
        time: startAt.toISOString().slice(11, 16),
        statusId: appointment.estado?.statusId ?? appointment.statusId,
        statusCode: appointment.estado?.statusCode ?? "",
        status: appointment.estado?.name ?? "Sin estado",
        rescheduled: Boolean(appointment.rescheduledAt),
        rescheduleHistory: history,
      };
    }),
    statuses: statuses.map((status) => ({
      id: status.statusId,
      code: status.statusCode,
      name: status.name,
    })),
  };
};

async function updateServiceSpecialties(service, { specialtyIds, specialtyName }, transaction) {
  if (specialtyName !== undefined) throw createError("Selecciona una especialidad existente.", 422);
  if (!Array.isArray(specialtyIds) || specialtyIds.length !== 1 || !Number.isInteger(specialtyIds[0])) {
    throw createError("Selecciona una especialidad.", 422);
  }
  const specialty = await MedicalSpecialty.findOne({
    where: { specialtyId: specialtyIds[0], isActive: true },
    transaction,
  });
  if (!specialty) throw createError("Selecciona una especialidad activa.", 422);
  await service.setEspecialidades([specialty], { transaction });
}

const textField = z.string().trim().min(1);
const imageField = z.string().trim().nullable().optional();
const doctorForm = z.object({
  professionalTitle: textField, firstName: textField, lastName: textField,
  description: textField, imagePath: imageField, isActive: z.boolean(),
  specialtyIds: z.array(z.number().int().positive()).min(1),
});
const specialtyForm = z.object({
  name: textField, slug: z.string().trim().optional(), description: textField,
  iconPath: imageField, displayOrder: z.number().int().min(0).max(32767), isActive: z.boolean(),
});

export async function saveDirectoryEntry(kind, id, input) {
  const isDoctor = kind === "doctors";
  const parsed = (isDoctor ? doctorForm : specialtyForm).safeParse(input);
  if (!parsed.success) throw createError("Completa los campos obligatorios del formulario.", 422);
  const model = isDoctor ? Doctor : MedicalSpecialty;
  try {
    await sequelize.transaction(async (transaction) => {
      const record = id ? await model.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE }) : null;
      if (id && !record) throw createError("Registro no encontrado.", 404);
      if (isDoctor) {
        const { specialtyIds, ...fields } = parsed.data;
        const ids = [...new Set(specialtyIds)];
        const specialties = await MedicalSpecialty.findAll({ where: { specialtyId: ids }, transaction });
        const previous = record ? await record.getEspecialidades({ transaction }) : [];
        if (specialties.length !== ids.length || specialties.some((item) =>
          !item.isActive && !previous.some((old) => old.specialtyId === item.specialtyId))) {
          throw createError("Selecciona especialidades existentes y activas.", 422);
        }
        const doctor = record ? await record.update(fields, { transaction }) : await Doctor.create(fields, { transaction });
        await doctor.setEspecialidades(ids, { transaction });
      } else {
        const fields = parsed.data;
        fields.slug = record?.slug || fields.slug || toSlug(fields.name);
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug)) throw createError("La clave de especialidad no es válida.", 422);
        if (record) await record.update(fields, { transaction });
        else await MedicalSpecialty.create(fields, { transaction });
      }
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") throw createError("Ya existe un registro con esos datos.", 409);
    if (error.name === "SequelizeForeignKeyConstraintError") throw createError("Una cita utiliza esta especialidad del médico. Conserva esa asignación.", 409);
    throw error;
  }
  return getAdminData();
}

export const createAdminService = async (data) =>
  sequelize
    .transaction(async (transaction) => {
      const slug = data.slug ?? toSlug(data.name);
      if (!slug)
        throw createError(
          "El nombre no permite generar una clave válida.",
          422,
        );
      const existing = await ServicioMedico.findOne({
        where: { [Op.or]: [{ slug }, { name: data.name }] },
        transaction,
      });
      if (existing)
        throw createError("Ya existe un servicio con esa clave o nombre.", 409);

      const service = await ServicioMedico.create(
        {
          slug,
          name: data.name,
          description: data.description,
          catalogTitle: data.catalogTitle ?? data.name,
          catalogDescription: data.catalogDescription ?? data.description,
          category: data.category ?? null,
          symbol: data.symbol ?? null,
          features: data.features ?? [],
          catalogOrder: data.catalogOrder ?? data.displayOrder ?? 0,
          displayOrder: data.displayOrder ?? data.catalogOrder ?? 0,
          price: data.price ?? null,
          isActive: data.isActive ?? true,
        },
        { transaction },
      );
      await updateServiceSpecialties(service, data, transaction);
    })
    .then(getAdminData);

export const updateAdminService = async (serviceId, data) =>
  sequelize
    .transaction(async (transaction) => {
      const service = await ServicioMedico.findByPk(serviceId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!service) throw createError("Servicio no encontrado.", 404);

      const slug = data.slug ?? service.slug;
      const duplicate = await ServicioMedico.findOne({
        where: {
          serviceId: { [Op.ne]: serviceId },
          [Op.or]: [{ slug }, { name: data.name }],
        },
        transaction,
      });
      if (duplicate)
        throw createError("Ya existe un servicio con esa clave o nombre.", 409);

      await service.update(
        {
          ...(data.slug !== undefined ? { slug } : {}),
          name: data.name,
          description: data.description,
          catalogTitle: data.catalogTitle ?? data.name,
          catalogDescription: data.catalogDescription ?? data.description,
          category: data.category ?? null,
          symbol: data.symbol ?? null,
          features: data.features ?? [],
          catalogOrder:
            data.catalogOrder ?? data.displayOrder ?? service.catalogOrder,
          displayOrder:
            data.displayOrder ?? data.catalogOrder ?? service.displayOrder,
          price: data.price ?? null,
          isActive: data.isActive ?? service.isActive,
        },
        { transaction },
      );
      if (data.specialtyIds !== undefined || data.specialtyName !== undefined) {
        await updateServiceSpecialties(service, data, transaction);
      }
    })
    .then(getAdminData);

function validateSlotHours(startTime, durationMinutes) {
  if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240) {
    throw createError("La duración debe ser de 15 a 240 minutos.", 400);
  }
  const [hours, minutes, seconds = 0] = startTime.split(":").map(Number);
  const start = hours * 60 + minutes + seconds / 60;
  if (start < 8 * 60 || start + durationMinutes > 20 * 60) {
    throw createError("El horario debe comenzar y terminar entre las 08:00 y las 20:00.", 400);
  }
}

async function checkSlotOverlap(doctorId, dayOfWeek, startTime, duration, slotId, transaction) {
  const toMinutes = (time) => {
    const [hours, minutes, seconds = 0] = time.split(":").map(Number);
    return hours * 60 + minutes + seconds / 60;
  };
  const slots = await DoctorAvailabilitySlot.findAll({
    where: { doctorId, dayOfWeek, isActive: true, ...(slotId ? { slotId: { [Op.ne]: slotId } } : {}) },
    transaction,
  });
  const start = toMinutes(startTime);
  if (slots.some((slot) => {
    const other = toMinutes(slot.startTime);
    return start < other + slot.durationMinutes && other < start + duration;
  })) throw createError("El médico ya tiene un horario que se cruza con el seleccionado.", 409);
}

export const createAdminSlot = async (data) =>
  sequelize.transaction(async (transaction) => {
    const durationMinutes = data.durationMinutes ?? 30;
    validateSlotHours(data.startTime, durationMinutes);
    const doctor = await Doctor.findByPk(data.doctorId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!doctor) throw createError("Médico no encontrado.", 404);
    if (data.isActive !== false) await checkSlotOverlap(data.doctorId, data.dayOfWeek, data.startTime, durationMinutes, null, transaction);
    const slot = await DoctorAvailabilitySlot.create(
      {
        doctorId: data.doctorId,
        dayOfWeek: data.dayOfWeek,
        startTime: `${data.startTime}:00`,
        durationMinutes,
        isActive: data.isActive ?? true,
      },
      { transaction },
    );
    return slot;
  });

export const updateAdminSlot = async (slotId, data) =>
  sequelize.transaction(async (transaction) => {
    const slot = await DoctorAvailabilitySlot.findByPk(slotId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!slot) throw createError("Horario no encontrado.", 404);
    validateSlotHours(data.startTime ?? slot.startTime, data.durationMinutes ?? slot.durationMinutes);
    await Doctor.findByPk(slot.doctorId, { transaction, lock: transaction.LOCK.UPDATE });
    if (data.isActive ?? slot.isActive) {
      await checkSlotOverlap(slot.doctorId, data.dayOfWeek ?? slot.dayOfWeek, data.startTime ?? slot.startTime, data.durationMinutes ?? slot.durationMinutes, slotId, transaction);
    }
    await slot.update(
      {
        ...(data.dayOfWeek !== undefined ? { dayOfWeek: data.dayOfWeek } : {}),
        ...(data.startTime !== undefined
          ? { startTime: `${data.startTime}:00` }
          : {}),
        ...(data.durationMinutes !== undefined
          ? { durationMinutes: data.durationMinutes }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      { transaction },
    );
    return slot;
  });

export const deleteAdminSlot = async (slotId) => {
  const slot = await DoctorAvailabilitySlot.findByPk(slotId);
  if (!slot) throw createError("Horario no encontrado.", 404);
  await slot.destroy();
};

export const updateAdminAppointmentStatus = async (appointmentId, statusId) =>
  sequelize.transaction(async (transaction) => {
    const [appointment, status] = await Promise.all([
      Appointment.findByPk(appointmentId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      }),
      AppointmentStatus.findByPk(statusId, { transaction }),
    ]);
    if (!appointment) throw createError("Cita no encontrada.", 404);
    if (!status) throw createError("Estado no encontrado.", 404);
    await appointment.update({ statusId }, { transaction });
    return {
      id: appointment.appointmentId,
      statusId: status.statusId,
      statusCode: status.statusCode,
      status: status.name,
    };
  });
