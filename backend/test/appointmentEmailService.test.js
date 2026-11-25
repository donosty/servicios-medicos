import { test } from "node:test";
import assert from "node:assert/strict";
import nodemailer from "nodemailer";
import { sendAppointmentConfirmation, sendAppointmentReschedule } from "../src/services/appointmentEmailService.js";

const smtpVariables = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
];

const preserveSmtpVariables = (t) => {
  const original = Object.fromEntries(
    smtpVariables.map((name) => [name, process.env[name]]),
  );
  t.after(() => {
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
};

test("envía la confirmación con folio y datos de la cita", async (t) => {
  preserveSmtpVariables(t);
  Object.assign(process.env, {
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "587",
    SMTP_SECURE: "false",
    SMTP_USER: "sender@example.com",
    SMTP_PASSWORD: "test-password",
    SMTP_FROM: "MEDICOM <sender@example.com>",
  });
  let message;
  const sendMail = t.mock.fn(async (mail) => {
    message = mail;
  });
  t.mock.method(nodemailer, "createTransport", (config) => {
    assert.deepEqual(config, {
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "sender@example.com", pass: "test-password" },
    });
    return { sendMail };
  });

  await sendAppointmentConfirmation({
    patientEmail: "patient@example.com",
    patientName: "Paciente <img>",
    folio: "MED-20261210-ABC123",
    specialty: "Cardiología",
    doctor: "Dra. Ana Pérez",
    date: "2026-12-10",
    time: "09:30",
  });

  assert.equal(message.from, "MEDICOM <sender@example.com>");
  assert.equal(message.to, "patient@example.com");
  assert.match(message.subject, /MED-20261210-ABC123/);
  assert.match(message.text, /Folio: MED-20261210-ABC123/);
  assert.match(message.text, /Especialidad: Cardiología/);
  assert.match(message.text, /Fecha: 10 de diciembre de 2026/);
  assert.match(message.html, /Paciente &lt;img&gt;/);
  assert.doesNotMatch(message.html, /<img>/);
});

test("falla explícitamente cuando no existe configuración SMTP", async (t) => {
  preserveSmtpVariables(t);
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;

  await assert.rejects(
    sendAppointmentConfirmation({
      patientEmail: "patient@example.com",
      patientName: "Paciente",
      folio: "MED-20261210-ABC123",
      specialty: "Cardiología",
      doctor: "Dra. Ana Pérez",
      date: "2026-12-10",
      time: "09:30",
    }),
    { message: "La configuración SMTP no está completa." },
  );
});

test("notifica el horario anterior y el nuevo al reprogramar", async (t) => {
  preserveSmtpVariables(t);
  Object.assign(process.env, { SMTP_HOST: "smtp.example.com", SMTP_USER: "sender@example.com", SMTP_PASSWORD: "test" });
  const sendMail = t.mock.fn(async () => {});
  t.mock.method(nodemailer, "createTransport", () => ({ sendMail }));
  await sendAppointmentReschedule({
    patientEmail: "patient@example.com", patientName: "Ana", folio: "MED-123",
    previousDate: "2026-12-10", previousTime: "09:00", date: "2026-12-12", time: "16:30",
  });
  const [message] = sendMail.mock.calls[0].arguments;
  assert.equal(message.to, "patient@example.com");
  assert.match(message.subject, /Cambio de cita MEDICOM - MED-123/);
  for (const body of [message.text, message.html]) {
    assert.match(body, /10 de diciembre de 2026 a las 09:00/);
    assert.match(body, /12 de diciembre de 2026 a las 16:30/);
  }
});
