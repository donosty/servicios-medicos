import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Patient = sequelize.define(
  'Patient',
  {
    patientId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'patient_id' },
    fullName: { type: DataTypes.TEXT, allowNull: false, field: 'full_name' },
    phone: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false },
  },
  { tableName: 'patients', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' },
);

export default Patient;
