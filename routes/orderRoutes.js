const express = require('express');
const Order = require('../models/Order');
const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  const order = await Order.create(req.body);
  res.json(order);
});

// Get user orders
router.get('/:userId', async (req, res) => {
  const orders = await Order.find({ user: req.params.userId });
  res.json(orders);
});

module.exports = router;
