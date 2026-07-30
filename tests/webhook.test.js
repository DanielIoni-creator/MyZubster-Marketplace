const request = require('supertest');
const app = require('../server');

// I modelli sono disponibili globalmente (da jest.setup.js)
const { User, Skill, Order, WebhookLog } = global.models;

describe('Webhook API', () => {
  beforeEach(async () => {
    // Pulisce il database
    await Order.destroy({ where: {} });
    await Skill.destroy({ where: {} });
    await User.destroy({ where: { email: 'webhook-seller@test.com' } });
    await User.destroy({ where: { email: 'webhook-buyer@test.com' } });
  });

  afterAll(async () => {
    await Order.destroy({ where: {} });
    await Skill.destroy({ where: {} });
    await User.destroy({ where: { email: 'webhook-seller@test.com' } });
    await User.destroy({ where: { email: 'webhook-buyer@test.com' } });
  });

  test('POST /api/webhook/order-update - aggiorna ordine', async () => {
    // Registra seller e buyer
    const sellerRes = await request(app)
      .post('/api/users/register')
      .send({
        email: 'webhook-seller@test.com',
        password: 'test123',
        name: 'Webhook Seller'
      });
    const buyerRes = await request(app)
      .post('/api/users/register')
      .send({
        email: 'webhook-buyer@test.com',
        password: 'test123',
        name: 'Webhook Buyer'
      });

    const sellerToken = sellerRes.body.token;
    const sellerId = sellerRes.body.user.id;
    const buyerId = buyerRes.body.user.id;

    // Crea una skill
    const skillRes = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Webhook Test Skill',
        description: 'Skill for webhook test',
        price: 0.5,
        category: 'Testing'
      });
    const skillId = skillRes.body.id;

    // Crea un ordine
    const orderRes = await request(app)
      .post('/api/orders')
      .send({
        skill_id: skillId,
        buyer_id: buyerId,
        amount: 0.5
      });
    const orderId = orderRes.body.id;

    // Invoca webhook
    const webhookRes = await request(app)
      .post('/api/webhook/order-update')
      .send({
        orderId,
        status: 'completed',
        event: 'order.completed',
        payload: { note: 'Lavoro completato' }
      });

    expect(webhookRes.statusCode).toBe(200);
    expect(webhookRes.body.message).toBe('Webhook ricevuto');
    expect(webhookRes.body.order.status).toBe('completed');

    // Verifica log
    const log = await WebhookLog.findOne({ where: { order_id: orderId } });
    expect(log).toBeTruthy();
    expect(log.event).toBe('order.completed');
  });
});
