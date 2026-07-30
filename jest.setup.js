const { sequelize, models } = require('./server');

// Sincronizza il database prima di tutti i test
beforeAll(async () => {
  console.log('🔧 Sincronizzazione database per i test...');
  await sequelize.sync({ force: true });
  console.log('✅ Database sincronizzato');
});

afterAll(async () => {
  console.log('🧹 Chiusura database...');
  await sequelize.close();
});

// Rendi i modelli disponibili globalmente per i test
global.models = models;
