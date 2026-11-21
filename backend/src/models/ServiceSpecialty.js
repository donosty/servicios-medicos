import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ServiceSpecialty = sequelize.define(
  'ServicioEspecialidad',
  {
    serviceId: { type: DataTypes.SMALLINT, primaryKey: true, field: 'id_servicio' },
    specialtyId: { type: DataTypes.SMALLINT, primaryKey: true, field: 'id_especialidad' },
  },
  { tableName: 'servicios_especialidades', timestamps: false },
);

export default ServiceSpecialty;
