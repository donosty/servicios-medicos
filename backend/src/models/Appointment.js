import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Appointment = sequelize.define(
  'Cita',
  {
    appointmentId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'id_cita' },
    folio: { type: DataTypes.TEXT, allowNull: false, unique: true, field: 'folio' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'id_paciente' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'id_medico' },
    specialtyId: { type: DataTypes.SMALLINT, allowNull: false, field: 'id_especialidad' },
    startAt: { type: DataTypes.DATE, allowNull: false, field: 'inicia_en' },
    endAt: { type: DataTypes.DATE, allowNull: false, field: 'termina_en' },
    statusId: { type: DataTypes.SMALLINT, allowNull: false, field: 'id_estado' },
  },
  { tableName: 'citas', timestamps: true, createdAt: 'creado_en', updatedAt: 'actualizado_en' },
);

export default Appointment;
