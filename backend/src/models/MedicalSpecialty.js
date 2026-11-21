import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MedicalSpecialty = sequelize.define(
  'MedicalSpecialty',
  {
    specialtyId: { type: DataTypes.SMALLINT, primaryKey: true, autoIncrement: true, field: 'specialty_id' },
    slug: { type: DataTypes.TEXT, allowNull: false, unique: true },
    name: { type: DataTypes.TEXT, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: false },
    iconPath: { type: DataTypes.TEXT, field: 'icon_path' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
    displayOrder: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0, field: 'display_order' },
  },
  { tableName: 'medical_specialties', timestamps: true, createdAt: 'created_at', updatedAt: false },
);

export default MedicalSpecialty;
