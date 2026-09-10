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
