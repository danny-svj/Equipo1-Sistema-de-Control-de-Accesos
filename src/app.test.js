const request = require('supertest');
const { app, _resetParaTests } = require('./app');

const residenteValido = {
  name: 'Mariana López García',
  home: 'Casa 18',
  phone: '55 1234 5678',
  relation: 'Titular',
};

beforeEach(() => {
  _resetParaTests();
});

test('crea un residente con datos válidos', async () => {
  const res = await request(app).post('/api/residentes').send(residenteValido);
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('id');
  expect(res.body.name).toBe(residenteValido.name);
});

test('rechaza el alta si falta un campo obligatorio', async () => {
  const res = await request(app)
    .post('/api/residentes')
    .send({ ...residenteValido, name: '' });
  expect(res.status).toBe(400);
});

test('lista solo residentes activos', async () => {
  const creado = await request(app).post('/api/residentes').send(residenteValido);
  await request(app).delete(`/api/residentes/${creado.body.id}`);
  await request(app).post('/api/residentes').send({ ...residenteValido, home: 'Casa 20' });

  const res = await request(app).get('/api/residentes');
  expect(res.body).toHaveLength(1);
  expect(res.body[0].home).toBe('Casa 20');
});

test('obtiene un residente por id', async () => {
  const creado = await request(app).post('/api/residentes').send(residenteValido);
  const res = await request(app).get(`/api/residentes/${creado.body.id}`);
  expect(res.status).toBe(200);
  expect(res.body.name).toBe(residenteValido.name);
});

test('actualiza el teléfono de un residente existente', async () => {
  const creado = await request(app).post('/api/residentes').send(residenteValido);
  const res = await request(app)
    .put(`/api/residentes/${creado.body.id}`)
    .send({ phone: '81 9999 0000' });
  expect(res.status).toBe(200);
  expect(res.body.phone).toBe('81 9999 0000');
});
