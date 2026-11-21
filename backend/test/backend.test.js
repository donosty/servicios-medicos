import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
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

test('API expone los servicios médicos activos', async () => {
  const response = await fetch(`${baseUrl}/api/services`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(Array.isArray(data.services));
});

test('availability valida doctorId y date antes de consultar la base', async () => {
  const response = await fetch(`${baseUrl}/api/availability`);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: 'doctorId y date son requeridos.' });
});

test('appointment schema valida y normaliza datos', () => {
  const result = appointmentSchema.safeParse({
    doctorId: '1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10',
    specialty: 'neurologia',
    date: '2026-12-10',
    time: '09:30',
    patient: {
      name: '  Ana Pérez  ',
      phone: ' 5551234567 ',
      email: '  ANA@EXAMPLE.COM ',
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.data.patient.name, 'Ana Pérez');
  assert.equal(result.data.patient.email, 'ANA@EXAMPLE.COM');
});

test('appointment schema rechaza datos incompletos', () => {
  const result = appointmentSchema.safeParse({ patient: {} });
  assert.equal(result.success, false);
});
