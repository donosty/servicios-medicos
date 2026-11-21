import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Appointment = sequelize.define(
  'Appointment',
  {
    appointmentId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'appointment_id' },
    folio: { type: DataTypes.TEXT, allowNull: false, unique: true },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    specialtyId: { type: DataTypes.SMALLINT, allowNull: false, field: 'specialty_id' },
    startAt: { type: DataTypes.DATE, allowNull: false, field: 'start_at' },
    endAt: { type: DataTypes.DATE, allowNull: false, field: 'end_at' },
    statusId: { type: DataTypes.SMALLINT, allowNull: false, field: 'status_id' },
  },
  { tableName: 'appointments', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' },
);

export default Appointment;
