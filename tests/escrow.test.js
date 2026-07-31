const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { sequelize } = require('../server');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
function tokenFor(user) { return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' }); }

const buyerTok = tokenFor({ id: 1, email: 'buyer@test.com', role: 'user' });
const sellerTok = tokenFor({ id: 2, email: 'seller@test.com', role: 'user' });
const otherTok = tokenFor({ id: 99, email: 'other@test.com', role: 'user' });
const adminTok = tokenFor({ id: 999, email: 'admin@test.com', role: 'admin' });

beforeAll(async () => { await sequelize.sync({ force: true }); });
afterAll(async () => { await sequelize.close(); });

let skillId = null;

beforeAll(async () => {
  const { User, Skill } = require('../server').models;
  // Create both buyer (id=1, id=99, id=999) and seller (id=2) users
  await User.create({ id: 1, email: 'buyer@test.com', password: 'hash', role: 'user' });
  await User.create({ id: 2, email: 'seller@test.com', password: 'hash', role: 'user' });
  await User.create({ id: 99, email: 'other@test.com', password: 'hash', role: 'user' });
  await User.create({ id: 999, email: 'admin@test.com', password: 'hash', role: 'admin' });
  const skill = await Skill.create({
    seller_id: 2, title: 'React Dev', description: 'Full-stack', price: 100, status: 'active',
  });
  skillId = skill.id;
});

// ─── ORDER CREATION ───────────────────────────

describe('Order Creation with Payment Methods', () => {
  test('POST /api/orders — direct payment (default)', async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${buyerTok}`)
      .send({ skill_id: skillId, amount: 100 });
    expect(res.status).toBe(201);
    expect(res.body.paymentMethod).toBe('direct');
    expect(res.body.status).toBe('pending');
  });

  test('POST /api/orders — escrow payment method', async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${buyerTok}`)
      .send({ skill_id: skillId, amount: 150, paymentMethod: 'escrow' });
    expect(res.status).toBe(201);
    expect(res.body.paymentMethod).toBe('escrow');
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/orders — reject without auth', async () => {
    const res = await request(app).post('/api/orders').send({ skill_id: skillId, amount: 100 });
    expect(res.status).toBe(401);
  });

  test('POST /api/orders — reject invalid skill', async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${buyerTok}`).send({ skill_id: 99999, amount: 100 });
    expect(res.status).toBe(400);
  });

  test('POST /api/orders — cannot create for another user (non-admin)', async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${buyerTok}`).send({ skill_id: skillId, amount: 100, buyer_id: 99 });
    expect(res.status).toBe(403);
  });

  test('POST /api/orders — admin creates order for another', async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${adminTok}`).send({ skill_id: skillId, amount: 50, buyer_id: 1 });
    expect(res.status).toBe(201);
  });

  test('POST /api/orders — empty body rejected', async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${buyerTok}`).send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/orders — defaults to skill price when no amount', async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${buyerTok}`).send({ skill_id: skillId, paymentMethod: 'direct' });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(100); // skill price
  });
});

// ─── ORDER LISTING & ACCESS ───────────────────

describe('Order Listing & Access', () => {
  let orderId;
  beforeAll(async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${buyerTok}`).send({ skill_id: skillId, amount: 200 });
    orderId = res.body.id;
  });

  test('GET /api/orders — list all', async () => {
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${buyerTok}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/orders/:id — buyer views own', async () => {
    const res = await request(app).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${buyerTok}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
  });

  test('GET /api/orders/:id — seller views', async () => {
    const res = await request(app).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${sellerTok}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/orders/:id — third party blocked', async () => {
    const res = await request(app).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${otherTok}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/orders/:id — 404 for missing', async () => {
    const res = await request(app).get('/api/orders/99999').set('Authorization', `Bearer ${buyerTok}`);
    expect(res.status).toBe(404);
  });
});

// ─── ORDER STATUS UPDATES ─────────────────────

describe('Order Status Updates', () => {
  let orderId;
  beforeAll(async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${buyerTok}`).send({ skill_id: skillId, amount: 300 });
    orderId = res.body.id;
  });

  test('PATCH /api/orders/:id/status — set paid', async () => {
    const res = await request(app).patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${buyerTok}`).send({ status: 'paid' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paid');
    expect(res.body.paidAt).toBeDefined();
  });

  test('PATCH /api/orders/:id/status — in_progress', async () => {
    const res = await request(app).patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerTok}`).send({ status: 'in_progress' });
    expect(res.status).toBe(200);
  });

  test('PATCH /api/orders/:id/status — completed', async () => {
    const res = await request(app).patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${buyerTok}`).send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.completedAt).toBeDefined();
  });

  test('PATCH /api/orders/:id/status — reject invalid status', async () => {
    const res = await request(app).patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${buyerTok}`).send({ status: 'not_real' });
    expect(res.status).toBe(400);
  });

  test('PATCH /api/orders/:id/status — third party blocked', async () => {
    const res = await request(app).patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${otherTok}`).send({ status: 'paid' });
    expect(res.status).toBe(403);
  });
});

// ─── ESCROW CLIENT SERVICE ────────────────────

describe('Escrow Client Service', () => {
  const escrowClient = require('../services/escrowClient');

  test('createEscrow rejects missing params', async () => {
    await expect(escrowClient.createEscrow({})).rejects.toThrow('Missing required');
  });

  test('createEscrow rejects negative amount', async () => {
    await expect(escrowClient.createEscrow({ orderId: 1, buyerId: 1, sellerId: 2, amount: -50 }))
      .rejects.toThrow('Amount must be positive');
  });

  test('releaseEscrow rejects missing escrowId', async () => {
    await expect(escrowClient.releaseEscrow()).rejects.toThrow('escrowId is required');
  });

  test('disputeEscrow rejects missing escrowId', async () => {
    await expect(escrowClient.disputeEscrow()).rejects.toThrow('escrowId is required');
  });

  test('refundEscrow rejects missing escrowId', async () => {
    await expect(escrowClient.refundEscrow()).rejects.toThrow('escrowId is required');
  });

  test('healthCheck returns boolean', async () => {
    const result = await escrowClient.healthCheck();
    expect(typeof result).toBe('boolean');
  });
});

// ─── WEBHOOK ESCROW ───────────────────────────

describe('Webhook Escrow Updates', () => {
  test('POST /api/webhook/escrow-update — requires escrowId', async () => {
    const res = await request(app).post('/api/webhook/escrow-update').send({ status: 'funded' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('escrowId');
  });

  test('POST /api/webhook/escrow-update — 404 for unknown escrowId', async () => {
    const res = await request(app).post('/api/webhook/escrow-update').send({ escrowId: 'nonexistent' });
    expect(res.status).toBe(404);
  });

  test('POST /api/webhook/order-update — 404 for unknown orderId', async () => {
    const res = await request(app).post('/api/webhook/order-update').send({ orderId: 99999 });
    expect(res.status).toBe(404);
  });
});

// ─── HEALTH CHECK ─────────────────────────────

describe('Health Check', () => {
  test('GET /api/health — returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('MyZubster-Marketplace');
  });
});
