import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RolUsuario = sequelize.define(
  "RolUsuario",
  {
    roleId: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      autoIncrement: true,
      field: "id_rol",
    },
    code: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "codigo",
    },
    name: { type: DataTypes.TEXT, allowNull: false, field: "nombre" },
  },
  { tableName: "roles_usuario", timestamps: false },
);

export default RolUsuario;
