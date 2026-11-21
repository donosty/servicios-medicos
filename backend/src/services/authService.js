import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import {
  sequelize,
  RolUsuario,
  Usuario,
  SesionUsuario,
  Patient,
} from '../models/index.js';

export const COOKIE_NAME = 'medicom_sesion';
export const SESSION_DAYS = 7;

export const hashSessionToken = (token) =>
  createHash('sha256').update(token).digest('hex');

export const createError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const registerUser = async (data) =>
  sequelize.transaction(async (transaction) => {
    const role = await RolUsuario.findOne({
      where: { code: 'consumidor' },
      transaction,
    });
    if (!role) throw createError('El rol consumidor no está configurado.', 500);

    const email = data.email.toLowerCase();
    const existing = await Usuario.findOne({ where: { email }, transaction });
    if (existing) throw createError('Ya existe una cuenta con este correo.', 409);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const patient = await Patient.create({
      fullName: data.fullName,
      phone: data.phone,
      email,
    }, { transaction });

    const user = await Usuario.create({
      patientId: patient.patientId,
      fullName: data.fullName,
      email,
      phone: data.phone,
      passwordHash,
      roleId: role.roleId,
      isActive: true,
    }, { transaction });

    return {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
    };
  });

export const loginUser = async (email, password) => {
  const user = await Usuario.findOne({
    where: { email: email.toLowerCase(), isActive: true },
    include: [{ model: RolUsuario, as: 'rol', required: true }],
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw createError('Correo o contraseña incorrectos.', 401);
  }

  const token = randomBytes(32).toString('base64url');
  await SesionUsuario.create({
    userId: user.userId,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
  });

  return {
    token,
    user: {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.rol.code,
    },
  };
};

export const getSessionUser = async (token) => {
  if (!token) return null;

  const session = await SesionUsuario.findOne({
    where: { tokenHash: hashSessionToken(token) },
    include: [{
      model: Usuario,
      as: 'usuario',
      where: { isActive: true },
      required: true,
      include: [{ model: RolUsuario, as: 'rol', required: true }],
    }],
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await session.destroy();
    return null;
  }

  return {
    userId: session.usuario.userId,
    fullName: session.usuario.fullName,
    email: session.usuario.email,
    phone: session.usuario.phone,
    role: session.usuario.rol.code,
  };
};

export const logoutSession = async (token) => {
  if (!token) return;
  await SesionUsuario.destroy({ where: { tokenHash: hashSessionToken(token) } });
};
