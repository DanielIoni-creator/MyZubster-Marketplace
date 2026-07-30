const request = require('supertest');
const app = require('../server');
const { sequelize, Order, User, Skill } = require('../models');
const nock = require('nock');

describe('Webhook API', () => {
  let sellerToken;
  let buyerToken;
  let testOrder;

  beforeAll(() => {
    // Mock della chiamata al core gateway
    nock('http://localhost:3000')
      .post('/api/orders')
      .reply(201, {
        id: 999,
        moneroAddress: '8B1vWxYz123ABC...',
        moneroAmount: 0.00614,
        addressIndex: 1,
        status: 'pending',
        network: 'testnet'
      });
  });

  afterAll(() => {
    nock.cleanAll();
  });

  beforeEach(async () => {
    // Pulisce il database
    await Order.destroy({ where: {} });
    await Skill.destroy({ where: {} });
    await User.destroy({ where: { email: 'webhook-seller@test.com' } });
    await User.destroy({ where: { email: 'webhook-buyer@test.com' } });

    // Registra seller
    await request(app)
      .post('/api/users/register')
      .send({
        email: 'webhook-seller@test.com',
        password: 'test123',
        name: 'Webhook Seller'
      });

    const sellerLogin = await request(app)
      .post('/api/users/login')
      .send({
        email: 'webhook-seller@test.com',
        password: 'test123'
      });
    sellerToken = sellerLogin.body.token;

    // Diventa seller
    await request(app)
      .post('/api/users/become-seller')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        moneroAddress: '8B1vWxYz123ABC...'
      });

    // Crea skill
    const skillRes = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Skill Webhook Test',
        description: 'Descrizione per test webhook',
        category: 'Test',
        price: 50,
        currency: 'USD'
      });
    const skillId = skillRes.body.id;

    // Registra buyer
    await request(app)
      .post('/api/users/register')
      .send({
        email: 'webhook-buyer@test.com',
        password: 'test123',
        name: 'Webhook Buyer'
      });

    const buyerLogin = await request(app)
      .post('/api/users/login')
      .send({
        email: 'webhook-buyer@test.com',
        password: 'test123'
      });
    buyerToken = buyerLogin.body.token;

    // Crea ordine
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        skillId: skillId,
        amount: 50,
        currency: 'USD',
        customerEmail: 'webhook-buyer@test.com'
      });

    if (orderRes.statusCode !== 201) {
      console.error('❌ Errore creazione ordine:', orderRes.body);
      throw new Error('Impossibile creare l\'ordine di test');
    }

    testOrder = orderRes.body;
    console.log('✅ Ordine creato per test webhook:', testOrder.id);
  });

  test('POST /api/webhook/order-update - aggiorna ordine', async () => {
    expect(testOrder).toBeDefined();
    expect(testOrder.id).toBeDefined();

    const res = await request(app)
      .post('/api/webhook/order-update')
      .send({
        orderId: testOrder.id,
        status: 'completed',
        txHash: 'abc123',
        confirmations: 10,
        amountReceived: 0.00614
      });

    if (res.statusCode === 400) {
      console.error('❌ Webhook error:', res.body);
    }

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);

    const updatedOrder = await Order.findByPk(testOrder.id);
    expect(updatedOrder.status).toBe('completed');
    expect(updatedOrder.txHash).toBe('abc123');
  });

  afterAll(async () => {
    await Order.destroy({ where: {} });
    await Skill.destroy({ where: {} });
    await User.destroy({ where: { email: 'webhook-seller@test.com' } });
    await User.destroy({ where: { email: 'webhook-buyer@test.com' } });
  });
});