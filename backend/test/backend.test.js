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

test('API protege los servicios médicos sin sesión', async () => {
  const response = await fetch(`${baseUrl}/api/services`);
  assert.equal(response.status, 401);
});

test('availability requiere sesión antes de validar parámetros', async () => {
  const response = await fetch(`${baseUrl}/api/availability`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Inicia sesión para continuar.' });
});

test('perfil requiere sesión', async () => {
  const response = await fetch(`${baseUrl}/api/profile`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Inicia sesión para continuar.' });
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
