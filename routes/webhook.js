const express = require('express');
const router = express.Router();

router.post('/order-update', (req, res) => {
  console.log('Webhook chiamato (test)');
  res.json({ success: true });
});

module.exports = router;
