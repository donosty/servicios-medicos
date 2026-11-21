import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DoctorAvailabilitySlot = sequelize.define(
  'DoctorAvailabilitySlot',
  {
    slotId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'slot_id' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    dayOfWeek: { type: DataTypes.SMALLINT, allowNull: false, field: 'day_of_week' },
    startTime: { type: DataTypes.TIME, allowNull: false, field: 'start_time' },
    durationMinutes: { type: DataTypes.SMALLINT, allowNull: false, field: 'duration_minutes' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  },
  { tableName: 'doctor_availability_slots', timestamps: false },
);

export default DoctorAvailabilitySlot;
