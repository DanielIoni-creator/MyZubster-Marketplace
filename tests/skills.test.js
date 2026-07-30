const request = require('supertest');
const app = require('../server');

let token;

beforeAll(async () => {
  // Registra un utente e ottieni il token
  const res = await request(app)
    .post('/api/users/register')
    .send({
      email: 'seller@test.com',
      password: 'test123',
      name: 'Seller User'
    });
  token = res.body.token;
  if (!token) throw new Error('Token non generato!');
});

describe('Skills API', () => {
  test('POST /api/skills - crea una competenza (seller)', async () => {
    const res = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Sviluppo Monero',
        description: 'Esperto in Monero',
        price: 0.5,
        category: 'Blockchain'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title', 'Sviluppo Monero');
  });

  test('GET /api/skills - lista competenze', async () => {
    const res = await request(app).get('/api/skills');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
