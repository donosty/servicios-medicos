import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Usuario = sequelize.define(
  'Usuario',
  {
    userId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: 'id_usuario' },
    patientId: { type: DataTypes.UUID, field: 'id_paciente' },
    fullName: { type: DataTypes.TEXT, allowNull: false, field: 'nombre_completo' },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true, field: 'correo' },
    phone: { type: DataTypes.TEXT, field: 'telefono' },
    passwordHash: { type: DataTypes.TEXT, allowNull: false, field: 'contrasena_hash' },
    roleId: { type: DataTypes.SMALLINT, allowNull: false, field: 'id_rol' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'esta_activo' },
    resetTokenActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'restablecimiento_token_activo' },
    resetTokenHash: { type: DataTypes.TEXT, field: 'restablecimiento_token_hash' },
    resetTokenJti: { type: DataTypes.TEXT, field: 'restablecimiento_jti' },
    resetTokenExpiresAt: { type: DataTypes.DATE, field: 'restablecimiento_expira_en' },
  },
  { tableName: 'usuarios', timestamps: true, createdAt: 'creado_en', updatedAt: 'actualizado_en' },
);

export default Usuario;
