import { ServicioMedico } from '../models/index.js';

export const getActiveMedicalServices = async () =>
  ServicioMedico.findAll({
    where: { isActive: true },
    attributes: ['serviceId', 'slug', 'name', 'description', 'iconPath'],
    order: [['displayOrder', 'ASC'], ['name', 'ASC']],
  }).then((services) =>
    services.map((service) => ({
      id: service.slug,
      name: service.name,
      description: service.description,
      icon: service.iconPath,
    })),
  );
