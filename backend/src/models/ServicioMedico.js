import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ServicioMedico = sequelize.define(
  'ServicioMedico',
  {
    serviceId: { type: DataTypes.SMALLINT, primaryKey: true, autoIncrement: true, field: 'id_servicio' },
    slug: { type: DataTypes.TEXT, allowNull: false, unique: true, field: 'clave' },
    name: { type: DataTypes.TEXT, allowNull: false, unique: true, field: 'nombre' },
    description: { type: DataTypes.TEXT, allowNull: false, field: 'descripcion' },
    iconPath: { type: DataTypes.TEXT, field: 'ruta_icono' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'esta_activo' },
    displayOrder: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0, field: 'orden_visualizacion' },
  },
  { tableName: 'servicios_medicos', timestamps: true, createdAt: 'creado_en', updatedAt: false },
);

export default ServicioMedico;
