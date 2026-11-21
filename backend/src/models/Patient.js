import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Patient = sequelize.define(
  'Paciente',
  {
    patientId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'id_paciente' },
    fullName: { type: DataTypes.TEXT, allowNull: false, field: 'nombre_completo' },
    phone: { type: DataTypes.TEXT, allowNull: false, field: 'telefono' },
    email: { type: DataTypes.TEXT, allowNull: false, field: 'correo' },
  },
  { tableName: 'pacientes', timestamps: true, createdAt: 'creado_en', updatedAt: 'actualizado_en' },
);

export default Patient;
