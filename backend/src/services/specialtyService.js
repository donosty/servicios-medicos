import { MedicalSpecialty } from '../models/index.js';

export const getActiveSpecialties = async () => {
  const specialties = await MedicalSpecialty.findAll({
    where: { isActive: true },
    attributes: ['specialtyId', 'slug', 'name', 'description', 'iconPath'],
    order: [['displayOrder', 'ASC'], ['name', 'ASC']],
  });

  return specialties.map((specialty) => ({
    id: specialty.slug,
    name: specialty.name,
    description: specialty.description,
    icon: specialty.iconPath,
  }));
};
