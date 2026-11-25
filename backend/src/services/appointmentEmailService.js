import nodemailer from "nodemailer";

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

const formatDate = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

async function sendAppointmentMail(patientEmail, subject, text, html) {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    throw new Error("La configuración SMTP no está completa.");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || "true") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: patientEmail,
    subject,
    text,
    html,
  });
}

export const sendAppointmentConfirmation = async ({
  patientEmail,
  patientName,
  folio,
  specialty,
  doctor,
  date,
  time,
}) => {
  const formattedDate = formatDate(date);
  const subject = `Confirmación de cita MEDICOM - ${folio}`;
  const text =
    `Hola ${patientName},\n\n` +
    `Tu cita ha sido confirmada. Estos son los detalles:\n\n` +
    `Folio: ${folio}\n` +
    `Especialidad: ${specialty}\n` +
    `Médico: ${doctor}\n` +
    `Fecha: ${formattedDate}\n` +
    `Hora: ${time}\n\n` +
    "Gracias por elegir MEDICOM.";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#243447">
      <h2 style="color:#003b71">Tu cita está confirmada</h2>
      <p>Hola ${escapeHtml(patientName)},</p>
      <p>Gracias por elegir MEDICOM. Estos son los detalles de tu cita:</p>
      <ul>
        <li><strong>Folio:</strong> ${escapeHtml(folio)}</li>
        <li><strong>Especialidad:</strong> ${escapeHtml(specialty)}</li>
        <li><strong>Médico:</strong> ${escapeHtml(doctor)}</li>
        <li><strong>Fecha:</strong> ${escapeHtml(formattedDate)}</li>
        <li><strong>Hora:</strong> ${escapeHtml(time)}</li>
      </ul>
    </div>
  `;

  await sendAppointmentMail(patientEmail, subject, text, html);
};

export async function sendAppointmentReschedule({ patientEmail, patientName, folio, date, time, previousDate, previousTime }) {
  const before = `${formatDate(previousDate)} a las ${previousTime}`;
  const after = `${formatDate(date)} a las ${time}`;
  const subject = `Cambio de cita MEDICOM - ${folio}`;
  const text = `Hola ${patientName}, tu cita con folio ${folio} fue reprogramada.\nHorario anterior: ${before}\nNuevo horario: ${after}`;
  const html = `<h2>Tu cita fue reprogramada</h2><p>Hola ${escapeHtml(patientName)},</p>
    <p>Folio: ${escapeHtml(folio)}</p><p>Horario anterior: ${escapeHtml(before)}</p>
    <p><strong>Nuevo horario: ${escapeHtml(after)}</strong></p>`;
  await sendAppointmentMail(patientEmail, subject, text, html);
}
