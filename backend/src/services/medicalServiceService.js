import { Doctor, MedicalSpecialty, ServicioMedico } from '../models/index.js';
import { getOpenSlotsByDoctor, getUpcomingAgendaDates } from './availabilityService.js';

export const getActiveMedicalServices = async () => {
  const services = await ServicioMedico.findAll({
    where: { isActive: true },
    include: [{
      model: MedicalSpecialty,
      as: 'especialidades',
      attributes: ['slug', 'name'],
      through: { attributes: [] },
      where: { isActive: true },
      required: false,
      include: [{
        model: Doctor,
        as: 'medicos',
        attributes: ['doctorId'],
        through: { attributes: [] },
        where: { isActive: true },
        required: false,
      }],
    }],
    order: [
      ['displayOrder', 'ASC'],
      ['name', 'ASC'],
      [{ model: MedicalSpecialty, as: 'especialidades' }, 'displayOrder', 'ASC'],
      [{ model: MedicalSpecialty, as: 'especialidades' }, 'name', 'ASC'],
    ],
  });

  const specialties = services.flatMap((service) => service.especialidades);
  const doctorIds = new Set(specialties.flatMap((specialty) =>
    specialty.medicos.map((doctor) => doctor.doctorId),
  ));
  const openSlots = await getOpenSlotsByDoctor([...doctorIds], getUpcomingAgendaDates());

  return services.map((service) => {
    const serviceSpecialties = service.especialidades.map((specialty) => ({
      id: specialty.slug,
      name: specialty.name,
      available: specialty.medicos.some((doctor) => openSlots.has(doctor.doctorId)),
    }));
    const availableSpecialty = serviceSpecialties.find((specialty) => specialty.available);

    return {
      id: service.slug,
      serviceId: service.serviceId,
      name: service.name,
      description: service.description,
      icon: service.iconPath,
      price: service.price === null ? null : Number(service.price),
      title: service.catalogTitle ?? service.name,
      catalogDescription: service.catalogDescription ?? service.description,
      category: service.category ?? null,
      symbol: service.symbol ?? null,
      features: service.features ?? [],
      catalogOrder: service.catalogOrder ?? service.displayOrder,
      specialties: serviceSpecialties,
      available: Boolean(availableSpecialty),
      bookingSpecialty: availableSpecialty?.id ?? null,
    };
  });
};
