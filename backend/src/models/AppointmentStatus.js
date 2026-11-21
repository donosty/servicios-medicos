import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AppointmentStatus = sequelize.define(
  'AppointmentStatus',
  {
    statusId: { type: DataTypes.SMALLINT, primaryKey: true, autoIncrement: true, field: 'status_id' },
    statusCode: { type: DataTypes.TEXT, allowNull: false, unique: true, field: 'status_code' },
    name: { type: DataTypes.TEXT, allowNull: false },
  },
  { tableName: 'appointment_statuses', timestamps: false },
);

export default AppointmentStatus;
