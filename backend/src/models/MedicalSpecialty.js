import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const MedicalSpecialty = sequelize.define(
  "EspecialidadMedica",
  {
    specialtyId: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      autoIncrement: true,
      field: "id_especialidad",
    },
    slug: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "clave",
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "nombre",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "descripcion",
    },
    iconPath: { type: DataTypes.TEXT, field: "ruta_icono" },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "esta_activa",
    },
    displayOrder: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
      field: "orden_visualizacion",
    },
  },
  {
    tableName: "especialidades_medicas",
    timestamps: true,
    createdAt: "creado_en",
    updatedAt: false,
  },
);

export default MedicalSpecialty;
