import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DoctorSpecialty = sequelize.define(
  "EspecialidadMedico",
  {
    doctorId: { type: DataTypes.UUID, primaryKey: true, field: "id_medico" },
    specialtyId: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      field: "id_especialidad",
    },
  },
  { tableName: "especialidades_medicos", timestamps: false },
);

export default DoctorSpecialty;
