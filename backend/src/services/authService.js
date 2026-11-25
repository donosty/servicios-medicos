import { randomBytes, randomUUID, createHash } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import {
  sequelize,
  RolUsuario,
  Usuario,
  SesionUsuario,
  Patient,
} from "../models/index.js";

export const COOKIE_NAME = "medicom_sesion";
export const SESSION_DAYS = 7;

export const hashSessionToken = (token) =>
  createHash("sha256").update(token).digest("hex");

const PASSWORD_RESET_MINUTES = 30;
const EMAIL_CONFIRMATION_HOURS = 24;

const getAuthTokenSecret = () => {
  const secret = process.env.PASSWORD_RESET_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw createError("PASSWORD_RESET_SECRET no está configurado.", 500);
  }
  return secret || "desarrollo-restablecimiento-local";
};

const hashAuthToken = (token) =>
  createHash("sha256").update(token).digest("hex");

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const createSmtpTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || "true") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

const assertSmtpConfigured = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    throw new Error("La configuración SMTP no está completa.");
  }
};

const verifyPasswordResetToken = async (token) => {
  const secret = getAuthTokenSecret();
  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch (_error) {
    throw createError(
      "El enlace de restablecimiento no es válido o expiró.",
      410,
    );
  }
  if (payload.type !== "password_reset" || !payload.sub || !payload.jti) {
    throw createError("El enlace de restablecimiento no es válido.", 410);
  }

  const user = await Usuario.findByPk(payload.sub);
  if (
    !user ||
    (!user.isActive && payload.reactivate !== true) ||
    !user.resetTokenActive ||
    user.resetTokenJti !== payload.jti ||
    user.resetTokenHash !== hashAuthToken(token) ||
    !user.resetTokenExpiresAt ||
    user.resetTokenExpiresAt <= new Date()
  ) {
    throw createError("El enlace de restablecimiento no está activo.", 410);
  }
  return { user, payload };
};

export const createError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const registerUser = async (data) =>
  sequelize.transaction(async (transaction) => {
    const role = await RolUsuario.findOne({
      where: { code: "consumidor" },
      transaction,
    });
    if (!role) throw createError("El rol consumidor no está configurado.", 500);

    const email = data.email.toLowerCase();
    const existing = await Usuario.findOne({ where: { email }, transaction });
    if (existing && !existing.isActive && existing.roleId === role.roleId) {
      const error = createError(
        "Ya tuviste una cuenta con este correo. ¿Deseas reactivarla?",
        409,
      );
      error.code = "ACCOUNT_INACTIVE";
      throw error;
    }
    if (existing)
      throw createError("Ya existe una cuenta con este correo.", 409);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const patient = await Patient.create(
      {
        fullName: data.fullName,
        phone: data.phone,
        email,
      },
      { transaction },
    );

    const user = await Usuario.create(
      {
        patientId: patient.patientId,
        fullName: data.fullName,
        email,
        phone: data.phone,
        passwordHash,
        roleId: role.roleId,
        isActive: true,
        emailConfirmed: false,
      },
      { transaction },
    );

    return {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
    };
  });

<<<<<<< HEAD
export const reactivateUser = async (email, password) =>
  sequelize.transaction(async (transaction) => {
    const user = await Usuario.findOne({
      where: { email: email.toLowerCase(), isActive: false },
      include: [
        { model: RolUsuario, as: "rol", where: { code: "consumidor" } },
      ],
      transaction,
      lock: { level: transaction.LOCK.UPDATE, of: Usuario },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw createError(
        "Ingresa la contraseña de tu cuenta anterior o recupérala por correo.",
        401,
      );
    }
    await user.update(
      { isActive: true, resetTokenActive: false },
      { transaction },
    );
  });

=======
const deliverEmailConfirmation = async (user) => {
  assertSmtpConfigured();

  const jti = randomUUID();
  const token = jwt.sign(
    { type: "email_confirmation", sub: user.userId, jti },
    getAuthTokenSecret(),
    { expiresIn: `${EMAIL_CONFIRMATION_HOURS}h` },
  );
  const expiresAt = new Date(
    Date.now() + EMAIL_CONFIRMATION_HOURS * 60 * 60 * 1000,
  );
  await user.update({
    emailConfirmationTokenActive: true,
    emailConfirmationTokenHash: hashAuthToken(token),
    emailConfirmationJti: jti,
    emailConfirmationExpiresAt: expiresAt,
  });

  const publicUrl = (
    process.env.APP_PUBLIC_URL || "http://localhost:4200"
  ).replace(/\/$/, "");
  const confirmationUrl = `${publicUrl}/confirm-email.html#token=${encodeURIComponent(token)}`;
  const transporter = createSmtpTransport();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: "Confirma tu correo electrónico de MEDICOM",
    text:
      `Hola ${user.fullName},\n\n` +
      "Confirma tu correo electrónico para activar tu cuenta de MEDICOM:\n" +
      `${confirmationUrl}\n\n` +
      `El enlace expirará en ${EMAIL_CONFIRMATION_HOURS} horas.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#243447">
        <h2 style="color:#003b71">Confirma tu correo electrónico</h2>
        <p>Hola ${escapeHtml(user.fullName)},</p>
        <p>Confirma tu correo para activar tu cuenta de MEDICOM.</p>
        <p>
          <a href="${confirmationUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#009fd9;color:#fff;text-decoration:none">
            Confirmar correo
          </a>
        </p>
        <p>El enlace expirará en ${EMAIL_CONFIRMATION_HOURS} horas.</p>
      </div>
    `,
  });
};

const findUnconfirmedUser = (where) =>
  Usuario.findOne({
    where: { ...where, isActive: true, emailConfirmed: false },
  });

export const sendEmailConfirmation = async (userId) => {
  const user = await findUnconfirmedUser({ userId });
  if (!user) return false;
  await deliverEmailConfirmation(user);
  return true;
};

export const resendEmailConfirmation = async (email) => {
  const user = await findUnconfirmedUser({ email: email.trim().toLowerCase() });
  if (!user) return;
  await deliverEmailConfirmation(user);
};

export const confirmEmail = async (token) => {
  const secret = getAuthTokenSecret();
  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch (_error) {
    throw createError("El enlace de confirmación no es válido o expiró.", 410);
  }
  if (
    payload.type !== "email_confirmation" ||
    !payload.sub ||
    !payload.jti
  ) {
    throw createError("El enlace de confirmación no es válido.", 410);
  }

  return sequelize.transaction(async (transaction) => {
    const user = await Usuario.findByPk(payload.sub, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (
      !user ||
      !user.isActive ||
      user.emailConfirmed ||
      !user.emailConfirmationTokenActive ||
      user.emailConfirmationJti !== payload.jti ||
      user.emailConfirmationTokenHash !== hashAuthToken(token) ||
      !user.emailConfirmationExpiresAt ||
      user.emailConfirmationExpiresAt <= new Date()
    ) {
      throw createError("El enlace de confirmación ya no está activo.", 410);
    }

    await user.update(
      {
        emailConfirmed: true,
        emailConfirmationTokenActive: false,
        emailConfirmationTokenHash: null,
        emailConfirmationJti: null,
        emailConfirmationExpiresAt: null,
      },
      { transaction },
    );
    return true;
  });
};

>>>>>>> beeaa7f (Confirmar cuenta y folio)
export const loginUser = async (email, password) => {
  const user = await Usuario.findOne({
    where: { email: email.toLowerCase(), isActive: true },
    include: [{ model: RolUsuario, as: "rol", required: true }],
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw createError("Correo o contraseña incorrectos.", 401);
  }
  if (!user.emailConfirmed) {
    throw createError("Confirma tu correo antes de iniciar sesión.", 403);
  }

  const token = randomBytes(32).toString("base64url");
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
    include: [
      {
        model: Usuario,
        as: "usuario",
        where: { isActive: true, emailConfirmed: true },
        required: true,
        include: [{ model: RolUsuario, as: "rol", required: true }],
      },
    ],
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
  await SesionUsuario.destroy({
    where: { tokenHash: hashSessionToken(token) },
  });
};

export const requestPasswordReset = async (email, reactivate = false) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await Usuario.findOne({
    where: { email: normalizedEmail, isActive: !reactivate },
    ...(reactivate && {
      include: [
        { model: RolUsuario, as: "rol", where: { code: "consumidor" } },
      ],
    }),
  });
  if (!user) return;

  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000);
  const token = jwt.sign(
<<<<<<< HEAD
    { type: "password_reset", sub: user.userId, jti, reactivate },
    getPasswordResetSecret(),
=======
    { type: "password_reset", sub: user.userId, jti },
    getAuthTokenSecret(),
>>>>>>> beeaa7f (Confirmar cuenta y folio)
    { expiresIn: `${PASSWORD_RESET_MINUTES}m` },
  );

  await user.update({
    resetTokenActive: true,
    resetTokenHash: hashAuthToken(token),
    resetTokenJti: jti,
    resetTokenExpiresAt: expiresAt,
  });

  try {
    assertSmtpConfigured();

    const publicUrl = (
      process.env.APP_PUBLIC_URL || "http://localhost:4200"
    ).replace(/\/$/, "");
    const resetUrl = `${publicUrl}/reset-password.html?token=${encodeURIComponent(token)}`;
    const transporter = createSmtpTransport();

    const instruction = reactivate
      ? "Usa este enlace para crear una nueva contraseña y reactivar tu cuenta."
      : "Usa este enlace para restablecer tu contraseña.";
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: "Restablece tu contraseña de MEDICOM",
      text:
        `Hola ${user.fullName},\n\n` +
        `${instruction}\n${resetUrl}\n\n` +
        `El enlace expirará en ${PASSWORD_RESET_MINUTES} minutos.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#243447">
          <h2 style="color:#003b71">Restablecer contraseña</h2>
          <p>Hola ${user.fullName},</p>
          <p>${instruction}</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#009fd9;color:#fff;text-decoration:none">
              Crear nueva contraseña
            </a>
          </p>
          <p>El enlace expirará en ${PASSWORD_RESET_MINUTES} minutos.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      `,
    });
  } catch (error) {
    await user.update({
      resetTokenActive: false,
      resetTokenHash: null,
      resetTokenJti: null,
      resetTokenExpiresAt: null,
    });
    console.error(
      "No fue posible enviar el correo de restablecimiento:",
      error.message,
    );
  }
};

export const validatePasswordResetToken = async (token) => {
  await verifyPasswordResetToken(token);
  return { valid: true };
};

export const cancelPasswordResetToken = async (token) => {
  try {
    const { user } = await verifyPasswordResetToken(token);
    await user.update({
      resetTokenActive: false,
      resetTokenHash: null,
      resetTokenJti: null,
      resetTokenExpiresAt: null,
    });
  } catch (_error) {
    return;
  }
};

export const resetPassword = async (token, password) =>
  sequelize.transaction(async (transaction) => {
    const { user, payload } = await verifyPasswordResetToken(token);

    const lockedUser = await Usuario.findByPk(user.userId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (
      !lockedUser ||
      !lockedUser.resetTokenActive ||
      lockedUser.resetTokenJti !== payload.jti ||
      lockedUser.resetTokenHash !== hashAuthToken(token) ||
      lockedUser.resetTokenExpiresAt <= new Date()
    ) {
      throw createError("El enlace de restablecimiento no está activo.", 410);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await lockedUser.update(
      {
        passwordHash,
        ...(payload.reactivate === true && { isActive: true }),
        resetTokenActive: false,
        resetTokenHash: null,
        resetTokenJti: null,
        resetTokenExpiresAt: null,
      },
      { transaction },
    );

    await SesionUsuario.destroy({
      where: { userId: lockedUser.userId },
      transaction,
    });
  });
