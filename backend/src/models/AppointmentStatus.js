import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AppointmentStatus = sequelize.define(
  "EstadoCita",
  {
    statusId: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      autoIncrement: true,
      field: "id_estado",
    },
    statusCode: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "codigo_estado",
    },
    name: { type: DataTypes.TEXT, allowNull: false, field: "nombre" },
  },
  { tableName: "estados_citas", timestamps: false },
);

export default AppointmentStatus;
