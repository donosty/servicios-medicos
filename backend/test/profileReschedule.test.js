import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  sequelize,
  Appointment,
  AppointmentRegistration,
  AppointmentStatus,
  DoctorAvailabilitySlot,
} from '../src/models/index.js';
import { getUserAppointments, rescheduleUserAppointment } from '../src/services/profileService.js';

// 09:00 del día 22 en Ciudad de México. La agenda guarda la hora local en los campos UTC.
const now = Date.parse('2026-11-22T15:00:00Z');
const originalStart = '2026-11-23T09:00:00.000Z';
const tooSoon = '2026-11-23T08:59:59.999Z';
const confirmed = { statusCode: 'confirmada', name: 'Confirmada' };

test('el perfil permite reprogramar con al menos 24 horas de anticipación', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now });
  t.mock.method(Appointment, 'findAll', async () => [
    { appointmentId: 'limite', startAt: originalStart, estado: confirmed },
    { appointmentId: 'tarde', startAt: tooSoon, estado: confirmed },
    { appointmentId: 'cambiada', startAt: originalStart, estado: confirmed, rescheduledAt: new Date(now) },
    { appointmentId: 'completada', startAt: originalStart, estado: { statusCode: 'completada' } },
  ]);

  const { scheduled, completed } = await getUserAppointments('paciente');
  assert.deepEqual(scheduled.map((item) => item.canReschedule), [true, false, false]);
  assert.equal(completed[0].canReschedule, false);
});

test('la reprogramación aplica el límite al horario original y conserva la cita al rechazar el cambio', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now });
  const appointment = {
    appointmentId: 'cita',
    statusId: 1,
    doctorId: 'medico',
    startAt: tooSoon,
    update: t.mock.fn(async () => {}),
  };
  t.mock.method(sequelize, 'transaction', async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }));
  t.mock.method(Appointment, 'findOne', async ({ where }) => where.userId ? appointment : null);
  t.mock.method(AppointmentStatus, 'findByPk', async () => confirmed);
  t.mock.method(DoctorAvailabilitySlot, 'findOne', async () => ({}));
  t.mock.method(AppointmentRegistration, 'findOne', async () => null);

  const proposed = { date: '2026-11-25', time: '12:00' };
  await assert.rejects(rescheduleUserAppointment('paciente', 'cita', proposed), { status: 422 });
  assert.equal(appointment.update.mock.callCount(), 0);

  appointment.startAt = originalStart;
  const result = await rescheduleUserAppointment('paciente', 'cita', proposed);
  assert.equal(appointment.update.mock.callCount(), 1);
  assert.equal(result.date, proposed.date);
  assert.equal(result.time, proposed.time);
});
