import { MedicalSpecialty, Doctor } from '../models/index.js';

export const getDoctors = async (specialtySlug) => {
  const specialties = await MedicalSpecialty.findAll({
    where: {
      isActive: true,
      ...(specialtySlug ? { slug: specialtySlug } : {}),
    },
    attributes: ['specialtyId', 'slug', 'name'],
    include: [{
      model: Doctor,
      as: 'medicos',
      attributes: ['doctorId', 'professionalTitle', 'firstName', 'lastName', 'description', 'imagePath'],
      through: { attributes: [] },
      where: { isActive: true },
      required: true,
    }],
    order: [['displayOrder', 'ASC'], ['medicos', 'apellidos', 'ASC']],
  });

  return specialties.flatMap((item) =>
    (item.medicos || []).map((doctor) => ({
      id: doctor.doctorId,
      specialty: item.slug,
      specialtyName: item.name,
      name: `${doctor.professionalTitle} ${doctor.firstName} ${doctor.lastName}`,
      description: doctor.description,
      image: doctor.imagePath,
    })),
  );
};
