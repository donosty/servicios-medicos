import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DoctorSpecialty = sequelize.define(
  'DoctorSpecialty',
  {
    doctorId: { type: DataTypes.UUID, primaryKey: true, field: 'doctor_id' },
    specialtyId: { type: DataTypes.SMALLINT, primaryKey: true, field: 'specialty_id' },
  },
  { tableName: 'doctor_specialties', timestamps: false },
);

export default DoctorSpecialty;
