import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Doctor = sequelize.define(
  'Doctor',
  {
    doctorId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'doctor_id' },
    professionalTitle: { type: DataTypes.TEXT, allowNull: false, field: 'professional_title' },
    firstName: { type: DataTypes.TEXT, allowNull: false, field: 'first_name' },
    lastName: { type: DataTypes.TEXT, allowNull: false, field: 'last_name' },
    description: { type: DataTypes.TEXT, allowNull: false },
    imagePath: { type: DataTypes.TEXT, field: 'image_path' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  },
  { tableName: 'doctors', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' },
);

export default Doctor;
