import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import {
  Appointment,
  DoctorAvailabilitySlot,
  MedicalSpecialty,
  ServicioMedico,
} from '../src/models/index.js';
import { appointmentSchema } from '../src/validators/appointmentValidator.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('health endpoint responde correctamente', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('API principal conserva su respuesta', async () => {
  const response = await fetch(`${baseUrl}/api`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { message: 'Servicios Médicos API' });
});

test('API permite consultar el catálogo sin sesión', async (t) => {
  t.mock.method(MedicalSpecialty, 'findAll', async () => []);
  t.mock.method(ServicioMedico, 'findAll', async () => [{
    slug: 'laboratorio',
    name: 'Laboratorio',
    description: 'Análisis clínicos.',
    iconPath: null,
    price: '650.00',
  }]);

  const services = await fetch(`${baseUrl}/api/services`);
  assert.equal(services.status, 200);
  assert.deepEqual(await services.json(), {
    services: [{
      id: 'laboratorio',
      name: 'Laboratorio',
      description: 'Análisis clínicos.',
      icon: null,
      price: 650,
    }],
  });

  for (const route of ['specialties', 'doctors']) {
    const response = await fetch(`${baseUrl}/api/${route}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { [route]: [] });
  }
});

test('API permite consultar la disponibilidad sin sesión', async (t) => {
  t.mock.method(DoctorAvailabilitySlot, 'findAll', async () => [{ startTime: '09:30:00' }]);
  t.mock.method(Appointment, 'findAll', async () => []);
  const query = 'doctorId=1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10&date=2026-12-10';
  const response = await fetch(`${baseUrl}/api/availability?${query}`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { times: ['09:30'] });
});

test('API rechaza fechas e identificadores de médico inválidos al consultar horarios', async () => {
  for (const query of [
    '',
    '?doctorId=invalido&date=2026-12-10',
    '?doctorId=1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10&date=2026-02-31',
  ]) {
    const response = await fetch(`${baseUrl}/api/availability${query}`);
    assert.equal(response.status, 400);
  }
});

test('confirmar una cita requiere sesión', async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, { method: 'POST' });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Inicia sesión para continuar.' });
});

test('el perfil y las citas personales requieren sesión', async () => {
  for (const [route, method] of [
    ['/api/profile', 'GET'],
    ['/api/profile', 'PATCH'],
    ['/api/profile/appointments', 'GET'],
  ]) {
    const response = await fetch(baseUrl + route, { method });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Inicia sesión para continuar.' });
  }
});

test('appointment schema valida y normaliza datos', () => {
  const result = appointmentSchema.safeParse({
    doctorId: '1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10',
    specialty: 'neurologia',
    date: '2026-12-10',
    time: '09:30',
  });

  assert.equal(result.success, true);
});

test('appointment schema rechaza datos incompletos', () => {
  const result = appointmentSchema.safeParse({ patient: {} });
  assert.equal(result.success, false);
});

test('appointment schema acepta cita sin datos personales repetidos', () => {
  const result = appointmentSchema.safeParse({
    doctorId: '1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10',
    specialty: 'neurologia',
    date: '2026-12-10',
    time: '09:30',
  });
  assert.equal(result.success, true);
});
