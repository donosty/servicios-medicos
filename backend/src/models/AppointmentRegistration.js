import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AppointmentRegistration = sequelize.define(
  'RegistroCita',
  {
    registrationId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'id_registro' },
    appointmentId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'id_cita' },
    folio: { type: DataTypes.TEXT, allowNull: false, unique: true, field: 'folio' },
    specialtyName: { type: DataTypes.TEXT, allowNull: false, field: 'nombre_especialidad' },
    doctorName: { type: DataTypes.TEXT, allowNull: false, field: 'nombre_medico' },
    patientName: { type: DataTypes.TEXT, allowNull: false, field: 'nombre_paciente' },
    patientPhone: { type: DataTypes.TEXT, allowNull: false, field: 'telefono_paciente' },
    patientEmail: { type: DataTypes.TEXT, allowNull: false, field: 'correo_paciente' },
    appointmentDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'fecha_cita' },
    appointmentTime: { type: DataTypes.TIME, allowNull: false, field: 'hora_cita' },
  },
  { tableName: 'registros_citas', timestamps: true, createdAt: 'creado_en', updatedAt: false },
);

export default AppointmentRegistration;
