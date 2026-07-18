// Imposta le variabili d'ambiente
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.MYZUBSTER_API_URL = 'http://localhost:3000/api';
process.env.MYZUBSTER_API_TOKEN = 'test_token';
process.env.WEBHOOK_SECRET = 'test_webhook_secret';
process.env.DATABASE_URL = 'sqlite::memory:'; // Usa database in memoria per evitare problemi di file

global.MYZUBSTER_API_URL = process.env.MYZUBSTER_API_URL;
global.MYZUBSTER_API_TOKEN = process.env.MYZUBSTER_API_TOKEN;

// Importa i modelli e sincronizza il database
const { sequelize } = require('./models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});