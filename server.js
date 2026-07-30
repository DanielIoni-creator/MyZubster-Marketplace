const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MyZubster-Marketplace',
    version: '1.0.0',
    database: 'sqlite'
  });
});

app.get('/api/gateway/status', async (req, res) => {
  res.json({ gateway: { status: 'unreachable' }, status: 'disconnected' });
});

app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/webhook', require('./routes/webhook'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/nft', require('./routes/nft'));
app.use('/api/pgp', require('./routes/pgp'));

async function startServer() {
  try {
    await sequelize.sync();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

module.exports = app;

if (require.main === module) {
  startServer();
}