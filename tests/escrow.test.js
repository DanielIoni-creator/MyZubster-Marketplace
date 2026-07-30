const request = require('supertest');
const app = require('../server');
const { sequelize } = require('../server');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Escrow Integration', () => {
  let orderId;

  test('POST /api/orders with escrow payment method', async () => {
    // First register a user and create a skill
    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'seller@test.com', password: 'test123', name: 'Seller' });
    
    const token = authRes.body.token;
    
    const skillRes = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Skill', price: 50, category: 'dev' });
    
    const skillId = skillRes.body.id;

    // Register a buyer
    const buyerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'buyer@test.com', password: 'test123', name: 'Buyer' });
    
    const buyerId = buyerRes.body.user.id;

    // Create order with escrow payment
    const res = await request(app)
      .post('/api/orders')
      .send({ skill_id: skillId, buyer_id: buyerId, amount: 50, paymentMethod: 'escrow' });
    
    expect(res.status).toBe(201);
    expect(res.body.paymentMethod).toBe('escrow');
    expect(res.body.escrowStatus).toBe('awaiting_deposit');
    expect(res.body.status).toBe('pending');
    orderId = res.body.id;
  });

  test('PATCH /api/orders/:id/escrow - deposit', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/escrow`)
      .send({ escrowId: 'escrow_abc123', escrowStatus: 'deposited' });
    
    expect(res.status).toBe(200);
    expect(res.body.escrowId).toBe('escrow_abc123');
    expect(res.body.escrowStatus).toBe('deposited');
    expect(res.body.status).toBe('paid');
  });

  test('PATCH /api/orders/:id/escrow - release', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/escrow`)
      .send({ escrowStatus: 'released' });
    
    expect(res.status).toBe(200);
    expect(res.body.escrowStatus).toBe('released');
    expect(res.body.status).toBe('completed');
  });

  test('GET /api/orders includes escrow fields', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    const order = res.body.find(o => o.id === orderId);
    expect(order).toBeDefined();
    expect(order.paymentMethod).toBe('escrow');
    expect(order.escrowId).toBe('escrow_abc123');
    expect(order.escrowStatus).toBe('released');
  });
});
