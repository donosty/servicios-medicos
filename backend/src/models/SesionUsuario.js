import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SesionUsuario = sequelize.define(
  "SesionUsuario",
  {
    sessionId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: "id_sesion",
    },
    userId: { type: DataTypes.UUID, allowNull: false, field: "id_usuario" },
    tokenHash: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "token_hash",
    },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expira_en" },
  },
  {
    tableName: "sesiones_usuario",
    timestamps: true,
    createdAt: "creado_en",
    updatedAt: "actualizado_en",
  },
);

export default SesionUsuario;
