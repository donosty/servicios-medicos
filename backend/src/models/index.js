import sequelize from '../config/database.js';
import MedicalSpecialty from './MedicalSpecialty.js';
import Doctor from './Doctor.js';
import DoctorSpecialty from './DoctorSpecialty.js';
import DoctorAvailabilitySlot from './DoctorAvailabilitySlot.js';
import Patient from './Patient.js';
import AppointmentStatus from './AppointmentStatus.js';
import Appointment from './Appointment.js';
import AppointmentRegistration from './AppointmentRegistration.js';
import ServicioMedico from './ServicioMedico.js';

Doctor.belongsToMany(MedicalSpecialty, {
  as: 'especialidades',
  through: DoctorSpecialty,
  foreignKey: 'doctorId',
  otherKey: 'specialtyId',
});
MedicalSpecialty.belongsToMany(Doctor, {
  as: 'medicos',
  through: DoctorSpecialty,
  foreignKey: 'specialtyId',
  otherKey: 'doctorId',
});
Doctor.hasMany(DoctorAvailabilitySlot, {
  as: 'horarios',
  foreignKey: 'doctorId',
  sourceKey: 'doctorId',
});

export {
  sequelize,
  MedicalSpecialty,
  Doctor,
  DoctorSpecialty,
  DoctorAvailabilitySlot,
  Patient,
  AppointmentStatus,
  Appointment,
  AppointmentRegistration,
  ServicioMedico,
};
