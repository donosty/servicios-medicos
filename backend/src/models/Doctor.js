import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Doctor = sequelize.define(
  "Medico",
  {
    doctorId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: "id_medico",
    },
    professionalTitle: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "titulo_profesional",
    },
    firstName: { type: DataTypes.TEXT, allowNull: false, field: "nombre" },
    lastName: { type: DataTypes.TEXT, allowNull: false, field: "apellidos" },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "descripcion",
    },
    imagePath: { type: DataTypes.TEXT, field: "ruta_imagen" },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "esta_activo",
    },
  },
  {
    tableName: "medicos",
    timestamps: true,
    createdAt: "creado_en",
    updatedAt: "actualizado_en",
  },
);

export default Doctor;
