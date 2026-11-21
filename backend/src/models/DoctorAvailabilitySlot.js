import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DoctorAvailabilitySlot = sequelize.define(
  'HorarioDisponibilidadMedico',
  {
    slotId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'id_horario' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'id_medico' },
    dayOfWeek: { type: DataTypes.SMALLINT, allowNull: false, field: 'dia_semana' },
    startTime: { type: DataTypes.TIME, allowNull: false, field: 'hora_inicio' },
    durationMinutes: { type: DataTypes.SMALLINT, allowNull: false, field: 'duracion_minutos' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'esta_activo' },
  },
  { tableName: 'horarios_disponibilidad_medicos', timestamps: false },
);

export default DoctorAvailabilitySlot;
