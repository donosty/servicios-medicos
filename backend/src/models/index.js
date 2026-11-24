import sequelize from '../config/database.js';
import MedicalSpecialty from './MedicalSpecialty.js';
import Doctor from './Doctor.js';
import DoctorSpecialty from './DoctorSpecialty.js';
import DoctorAvailabilitySlot from './DoctorAvailabilitySlot.js';
import Patient from './Patient.js';
import AppointmentStatus from './AppointmentStatus.js';
import Appointment from './Appointment.js';
import AppointmentRegistration from './AppointmentRegistration.js';
import AppointmentHistory from './AppointmentHistory.js';
import ServicioMedico from './ServicioMedico.js';
import ServiceSpecialty from './ServiceSpecialty.js';
import RolUsuario from './RolUsuario.js';
import Usuario from './Usuario.js';
import SesionUsuario from './SesionUsuario.js';

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
ServicioMedico.belongsToMany(MedicalSpecialty, {
  as: 'especialidades',
  through: ServiceSpecialty,
  foreignKey: 'serviceId',
  otherKey: 'specialtyId',
});
Doctor.hasMany(DoctorAvailabilitySlot, {
  as: 'horarios',
  foreignKey: 'doctorId',
  sourceKey: 'doctorId',
});
Usuario.belongsTo(RolUsuario, { as: 'rol', foreignKey: 'roleId', targetKey: 'roleId' });
RolUsuario.hasMany(Usuario, { as: 'usuarios', foreignKey: 'roleId', sourceKey: 'roleId' });
SesionUsuario.belongsTo(Usuario, { as: 'usuario', foreignKey: 'userId', targetKey: 'userId' });
Usuario.hasMany(SesionUsuario, { as: 'sesiones', foreignKey: 'userId', sourceKey: 'userId' });
Appointment.belongsTo(Doctor, { as: 'medico', foreignKey: 'doctorId', targetKey: 'doctorId' });
Appointment.belongsTo(MedicalSpecialty, { as: 'especialidad', foreignKey: 'specialtyId', targetKey: 'specialtyId' });
Appointment.belongsTo(AppointmentStatus, { as: 'estado', foreignKey: 'statusId', targetKey: 'statusId' });
Appointment.belongsTo(Patient, { as: 'paciente', foreignKey: 'patientId', targetKey: 'patientId' });
AppointmentHistory.belongsTo(Appointment, { as: 'cita', foreignKey: 'appointmentId', targetKey: 'appointmentId' });
AppointmentHistory.belongsTo(Usuario, { as: 'usuario', foreignKey: 'userId', targetKey: 'userId' });

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
  AppointmentHistory,
  ServicioMedico,
  ServiceSpecialty,
  RolUsuario,
  Usuario,
  SesionUsuario,
};
