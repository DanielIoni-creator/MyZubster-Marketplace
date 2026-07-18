const request = require('supertest');
const app = require('../server');

let authToken;

beforeAll(async () => {
  await request(app)
    .post('/api/users/register')
    .send({
      email: 'seller@test.com',
      password: 'test123',
      name: 'Seller User'
    });

  const res = await request(app)
    .post('/api/users/login')
    .send({
      email: 'seller@test.com',
      password: 'test123'
    });
  authToken = res.body.token;

  await request(app)
    .post('/api/users/become-seller')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      moneroAddress: '8B1vWxYz123ABC...'
    });
});

describe('Skills API', () => {
  test('POST /api/skills - crea una competenza (seller)', async () => {
    const res = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Sviluppo Monero',
        description: 'Integrazione pagamenti Monero',
        category: 'Blockchain',
        price: 100,
        currency: 'USD'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', 'Sviluppo Monero');
  });

  test('GET /api/skills - lista competenze', async () => {
    const res = await request(app).get('/api/skills');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});