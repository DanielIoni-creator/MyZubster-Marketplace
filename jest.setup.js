const { sequelize } = require('./server');

beforeAll(async () => {
  console.log('🔧 Sincronizzazione database per i test...');
  await sequelize.sync({ force: true });
  console.log('✅ Database sincronizzato');
});

afterAll(async () => {
  console.log('🧹 Chiusura database...');
  await sequelize.close();
});
