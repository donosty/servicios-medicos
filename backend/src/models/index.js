import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    dialect: 'postgres',
    logging: false,
  },
);

const MedicalSpecialty = sequelize.define(
  'MedicalSpecialty',
  {
    specialtyId: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      autoIncrement: true,
      field: 'specialty_id',
    },
    slug: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    iconPath: {
      type: DataTypes.TEXT,
      field: 'icon_path',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    displayOrder: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order',
    },
  },
  {
    tableName: 'medical_specialties',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  },
);

const Doctor = sequelize.define(
  'Doctor',
  {
    doctorId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'doctor_id' },
    professionalTitle: { type: DataTypes.TEXT, allowNull: false, field: 'professional_title' },
    firstName: { type: DataTypes.TEXT, allowNull: false, field: 'first_name' },
    lastName: { type: DataTypes.TEXT, allowNull: false, field: 'last_name' },
    description: { type: DataTypes.TEXT, allowNull: false },
    imagePath: { type: DataTypes.TEXT, field: 'image_path' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  },
  { tableName: 'doctors', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' },
);

const DoctorSpecialty = sequelize.define(
  'DoctorSpecialty',
  {
    doctorId: { type: DataTypes.UUID, primaryKey: true, field: 'doctor_id' },
    specialtyId: { type: DataTypes.SMALLINT, primaryKey: true, field: 'specialty_id' },
  },
  { tableName: 'doctor_specialties', timestamps: false },
);

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

const Patient = sequelize.define(
  'Patient',
  {
    patientId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'patient_id' },
    fullName: { type: DataTypes.TEXT, allowNull: false, field: 'full_name' },
    phone: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false },
  },
  { tableName: 'patients', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' },
);

const AppointmentStatus = sequelize.define(
  'AppointmentStatus',
  {
    statusId: { type: DataTypes.SMALLINT, primaryKey: true, autoIncrement: true, field: 'status_id' },
    statusCode: { type: DataTypes.TEXT, allowNull: false, unique: true, field: 'status_code' },
    name: { type: DataTypes.TEXT, allowNull: false },
  },
  { tableName: 'appointment_statuses', timestamps: false },
);

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

const AppointmentRegistration = sequelize.define(
  'AppointmentRegistration',
  {
    registrationId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'registration_id' },
    appointmentId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'appointment_id' },
    folio: { type: DataTypes.TEXT, allowNull: false, unique: true },
    specialtyName: { type: DataTypes.TEXT, allowNull: false, field: 'specialty_name' },
    doctorName: { type: DataTypes.TEXT, allowNull: false, field: 'doctor_name' },
    patientName: { type: DataTypes.TEXT, allowNull: false, field: 'patient_name' },
    patientPhone: { type: DataTypes.TEXT, allowNull: false, field: 'patient_phone' },
    patientEmail: { type: DataTypes.TEXT, allowNull: false, field: 'patient_email' },
    appointmentDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'appointment_date' },
    appointmentTime: { type: DataTypes.TIME, allowNull: false, field: 'appointment_time' },
  },
  { tableName: 'appointment_registrations', timestamps: true, createdAt: 'created_at', updatedAt: false },
);

Doctor.belongsToMany(MedicalSpecialty, { through: DoctorSpecialty, foreignKey: 'doctorId', otherKey: 'specialtyId' });
MedicalSpecialty.belongsToMany(Doctor, { through: DoctorSpecialty, foreignKey: 'specialtyId', otherKey: 'doctorId' });
Doctor.hasMany(DoctorAvailabilitySlot, { foreignKey: 'doctorId', sourceKey: 'doctorId' });

export {
  sequelize,
  MedicalSpecialty,
  Doctor,
  DoctorSpecialty,
  DoctorAvailabilitySlot,
  Patient,
  AppointmentStatus,
  Appointment,
  AppointmentRegistration,
};
