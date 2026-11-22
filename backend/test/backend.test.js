import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Op } from 'sequelize';
import app from '../src/app.js';
import {
  Appointment,
  DoctorAvailabilitySlot,
  MedicalSpecialty,
  ServicioMedico,
} from '../src/models/index.js';
import { getUpcomingAgendaDates } from '../src/services/availabilityService.js';
import { appointmentSchema } from '../src/validators/appointmentValidator.js';

const doctorId = '1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10';
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
    serviceId: 3,
    slug: 'laboratorio',
    name: 'Laboratorio',
    description: 'Análisis clínicos.',
    iconPath: null,
    price: '650.00',
    displayOrder: 3,
    especialidades: [],
  }]);

  const services = await fetch(`${baseUrl}/api/services`);
  assert.equal(services.status, 200);
  assert.equal(services.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await services.json(), {
    services: [{
      id: 'laboratorio',
      serviceId: 3,
      name: 'Laboratorio',
      description: 'Análisis clínicos.',
      icon: null,
      price: 650,
      title: 'Laboratorio',
      catalogDescription: 'Análisis clínicos.',
      category: null,
      symbol: null,
      features: [],
      catalogOrder: 3,
      specialties: [],
      available: false,
      bookingSpecialty: null,
    }],
  });

  for (const route of ['specialties', 'doctors']) {
    const response = await fetch(`${baseUrl}/api/${route}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { [route]: [] });
  }
});

test('el catálogo indica qué servicios tienen un horario libre y sugiere su especialidad', async (t) => {
  const otherDoctorId = '4d170f18-a7d8-4c73-bc8d-6a51ec8f7ed7';
  const [firstDate] = getUpcomingAgendaDates();
  const dayOfWeek = new Date(`${firstDate}T00:00:00Z`).getUTCDay();
  const bookedSpecialty = { slug: 'neurologia', name: 'Neurología', medicos: [{ doctorId }] };
  const openSpecialty = {
    slug: 'cardiologia',
    name: 'Cardiología',
    medicos: [{ doctorId: otherDoctorId }],
  };
  t.mock.method(ServicioMedico, 'findAll', async ({ where, include }) => {
    assert.equal(where.isActive, true);
    assert.equal(include[0].where.isActive, true);
    assert.equal(include[0].include[0].where.isActive, true);
    return [
      {
        serviceId: 10,
        slug: 'consulta-especializada',
        name: 'Consulta',
        description: 'Consulta médica.',
        catalogTitle: 'Consulta Especializada',
        catalogDescription: 'Valoración con especialista.',
        category: 'Consultas Médicas',
        symbol: '♧',
        features: ['Citas presenciales'],
        catalogOrder: 1,
        price: '900.00',
        especialidades: [bookedSpecialty, openSpecialty],
      },
      {
        serviceId: 11,
        slug: 'consulta-neurologia',
        name: 'Consulta Neurológica',
        description: 'Valoración neurológica.',
        displayOrder: 2,
        price: null,
        especialidades: [bookedSpecialty],
      },
    ];
  });
  t.mock.method(DoctorAvailabilitySlot, 'findAll', async ({ where }) => {
    assert.equal(where.isActive, true);
    assert.deepEqual(where.doctorId[Op.in], [doctorId, otherDoctorId]);
    return [
      { doctorId, dayOfWeek, startTime: '09:30:00' },
      { doctorId: otherDoctorId, dayOfWeek, startTime: '09:30:00' },
    ];
  });
  t.mock.method(Appointment, 'findAll', async ({ where }) => {
    assert.equal(where.startAt[Op.gte].toISOString(), `${firstDate}T00:00:00.000Z`);
    assert.equal(where.statusId[Op.ne], 4);
    return [{ doctorId, startAt: new Date(`${firstDate}T09:30:00Z`) }];
  });

  const response = await fetch(`${baseUrl}/api/services`);
  assert.equal(response.status, 200);
  const { services: [consultation, neurology] } = await response.json();
  assert.deepEqual(consultation.specialties, [
    { id: 'neurologia', name: 'Neurología', available: false },
    { id: 'cardiologia', name: 'Cardiología', available: true },
  ]);
  assert.equal(consultation.title, 'Consulta Especializada');
  assert.equal(consultation.catalogDescription, 'Valoración con especialista.');
  assert.deepEqual(consultation.features, ['Citas presenciales']);
  assert.equal(consultation.available, true);
  assert.equal(consultation.bookingSpecialty, 'cardiologia');
  assert.equal(neurology.available, false);
  assert.equal(neurology.bookingSpecialty, null);
});

test('la agenda calcula los siguientes siete días desde la fecha de Ciudad de México', () => {
  const dates = getUpcomingAgendaDates(new Date('2026-01-01T03:00:00Z'));
  assert.equal(dates.length, 7);
  assert.equal(dates[0], '2026-01-01');
  assert.equal(dates.at(-1), '2026-01-07');
});

test('API permite consultar la disponibilidad sin sesión', async (t) => {
  t.mock.method(DoctorAvailabilitySlot, 'findAll', async () => [
    { doctorId, dayOfWeek: 4, startTime: '09:30:00' },
  ]);
  t.mock.method(Appointment, 'findAll', async () => []);
  const query = `doctorId=${doctorId}&date=2026-12-10`;
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
    ['/api/profile/appointments/1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10', 'PATCH'],
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
