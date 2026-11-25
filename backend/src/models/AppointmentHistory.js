import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AppointmentHistory = sequelize.define(
  "HistorialCita",
  {
    historyId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: "id_historial",
    },
    appointmentId: { type: DataTypes.UUID, allowNull: false, field: "id_cita" },
    userId: { type: DataTypes.UUID, allowNull: true, field: "id_usuario" },
    previousVersion: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: "version_anterior",
    },
    updatedVersion: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: "version_actualizada",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "realizado_en",
    },
  },
  { tableName: "historial_citas", timestamps: false },
);

export default AppointmentHistory;
