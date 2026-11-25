import { test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import {
  confirmEmail,
  getSessionUser,
  loginUser,
  sendEmailConfirmation,
} from "../src/services/authService.js";
import { login as loginController } from "../src/controllers/authController.js";
import { errorHandler } from "../src/middlewares/errorHandler.js";
import {
  sequelize,
  SesionUsuario,
  Usuario,
} from "../src/models/index.js";

const environmentVariables = [
  "APP_PUBLIC_URL",
  "NODE_ENV",
  "PASSWORD_RESET_SECRET",
  "SMTP_FROM",
  "SMTP_HOST",
  "SMTP_PASSWORD",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
];

const preserveEnvironment = (t) => {
  const original = Object.fromEntries(
    environmentVariables.map((name) => [name, process.env[name]]),
  );
  t.after(() => {
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
};

test("el correo confirma una sola vez y consume solo su token", async (t) => {
  preserveEnvironment(t);
  Object.assign(process.env, {
    APP_PUBLIC_URL: "https://medicom.example",
    PASSWORD_RESET_SECRET: "test-secret",
    SMTP_FROM: "MEDICOM <sender@example.com>",
    SMTP_HOST: "smtp.example.com",
    SMTP_PASSWORD: "test-password",
    SMTP_PORT: "587",
    SMTP_SECURE: "false",
    SMTP_USER: "sender@example.com",
  });
  const user = {
    userId: "6f55d129-12d1-4de6-9e4e-d0c7f09a6e01",
    fullName: "Paciente <uno>",
    email: "patient@example.com",
    isActive: true,
    emailConfirmed: false,
    update: t.mock.fn(async (values) => Object.assign(user, values)),
  };
  t.mock.method(Usuario, "findOne", async () => user);

  let message;
  t.mock.method(nodemailer, "createTransport", () => ({
    sendMail: async (mail) => {
      message = mail;
    },
  }));
  assert.equal(await sendEmailConfirmation(user.userId), true);

  assert.equal(message.to, user.email);
  assert.equal(message.from, "MEDICOM <sender@example.com>");
  assert.match(message.html, /Paciente &lt;uno&gt;/);
  const token = message.text.match(/https:\/\/\S+/)[0].split("token=")[1];
  const payload = jwt.verify(decodeURIComponent(token), "test-secret");
  assert.equal(payload.type, "email_confirmation");
  assert.equal(payload.sub, user.userId);
  assert.equal(user.emailConfirmationTokenActive, true);

  t.mock.method(sequelize, "transaction", (callback) =>
    callback({ LOCK: { UPDATE: "UPDATE" } }),
  );
  t.mock.method(Usuario, "findByPk", async () => user);
  const signedToken = decodeURIComponent(token);
  assert.equal(await confirmEmail(signedToken), true);
  assert.equal(user.emailConfirmed, true);
  assert.equal(user.emailConfirmationTokenActive, false);
  assert.equal(user.emailConfirmationTokenHash, null);
  await assert.rejects(confirmEmail(signedToken), { status: 410 });
});

test("una cuenta sin confirmar no obtiene sesión ni cookie", async (t) => {
  const user = {
    userId: "6f55d129-12d1-4de6-9e4e-d0c7f09a6e01",
    emailConfirmed: false,
    isActive: true,
    passwordHash: await bcrypt.hash("Password123!", 4),
  };
  t.mock.method(Usuario, "findOne", async () => user);
  const createSession = t.mock.method(SesionUsuario, "create", async () => {});

  const response = {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  await loginController(
    {
      body: { email: "patient@example.com", password: "Password123!" },
    },
    response,
    (error) => errorHandler(error, {}, response, () => {}),
  );

  assert.equal(response.statusCode, 403);
  assert.match(response.body.message, /Confirma tu correo/);
  assert.equal(response.headers["Set-Cookie"], undefined);
  assert.equal(createSession.mock.callCount(), 0);
});

test("una sesión no confunde el token de reset con confirmación pendiente", async (t) => {
  const passwordHash = await bcrypt.hash("Password123!", 4);
  const user = {
    userId: "6f55d129-12d1-4de6-9e4e-d0c7f09a6e01",
    fullName: "Paciente",
    email: "patient@example.com",
    phone: "5551234567",
    emailConfirmed: true,
    isActive: true,
    resetTokenActive: true,
    passwordHash,
    rol: { code: "consumidor" },
  };
  t.mock.method(Usuario, "findOne", async () => user);
  const createSession = t.mock.method(SesionUsuario, "create", async () => {});

  const session = await loginUser("patient@example.com", "Password123!");
  assert.equal(session.user.email, user.email);
  assert.equal(createSession.mock.callCount(), 1);
});

test("las sesiones existentes también requieren correo confirmado", async (t) => {
  t.mock.method(SesionUsuario, "findOne", async (options) => {
    assert.deepEqual(options.include[0].where, {
      isActive: true,
      emailConfirmed: true,
    });
    return null;
  });

  assert.equal(await getSessionUser("session-token"), null);
});

test("una clave ausente en producción no se trata como token inválido", async (t) => {
  preserveEnvironment(t);
  process.env.NODE_ENV = "production";
  delete process.env.PASSWORD_RESET_SECRET;

  await assert.rejects(confirmEmail("invalid-token"), { status: 500 });
});
