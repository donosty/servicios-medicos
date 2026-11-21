import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AppointmentRegistration = sequelize.define(
  'AppointmentRegistration',
  {
    registrationId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'registration_id' },
    appointmentId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'appointment_id' },
    folio: { type: DataTypes.TEXT, allowNull: false, unique: true },
    specialtyName: { type: DataTypes.TEXT, allowNull: false, field: 'specialty_name' },
    doctorName: { type: DataTypes.TEXT, allowNull: false, field: 'doctor_name' },
    patientName: { type: DataTypes.TEXT, allowNull: false, field: 'patient_name' },
    patientPhone: { type: DataTypes.TEXT, allowNull: false, field: 'patient_phone' },
    patientEmail: { type: DataTypes.TEXT, allowNull: false, field: 'patient_email' },
    appointmentDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'appointment_date' },
    appointmentTime: { type: DataTypes.TIME, allowNull: false, field: 'appointment_time' },
  },
  { tableName: 'appointment_registrations', timestamps: true, createdAt: 'created_at', updatedAt: false },
);

export default AppointmentRegistration;
