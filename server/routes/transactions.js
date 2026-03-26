const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Ammunition = require('../models/Ammunition');

// Get all transactions with optional filtering
router.get('/', async (req, res) => {
  try {
    const { batteryId, limit = 100 } = req.query;
    let query = {};
    if (batteryId) query.batteryId = batteryId;

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new transaction
router.post('/', async (req, res) => {
  try {
    const { batteryId, ammoId, type, quantity, note, batteryName, ammoLabel } = req.body;

    // Validate input
    if (!batteryId || !ammoId || !type || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid transaction data' });
    }

    // Get current ammunition
    let ammo = await Ammunition.findOne({ batteryId, ammoId });
    if (!ammo) {
      return res.status(404).json({ error: 'Ammunition not found' });
    }

    const before = ammo.quantity;
    let after;

    if (type === 'ADD') {
      after = before + quantity;
    } else if (type === 'SUB') {
      if (before < quantity) {
        return res.status(400).json({ error: 'Insufficient ammunition' });
      }
      after = before - quantity;
    } else {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    // Update ammunition
    ammo.quantity = after;
    ammo.lastUpdated = Date.now();
    await ammo.save();

    // Record transaction
    const transaction = new Transaction({
      batteryId,
      ammoId,
      type,
      quantity,
      note,
      before,
      after,
      batteryName,
      ammoLabel
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get transaction stats
router.get('/stats/summary', async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments();
    const byBattery = await Transaction.aggregate([
      { $group: { _id: '$batteryId', count: { $sum: 1 } } }
    ]);
    const byType = await Transaction.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.json({ totalTransactions, byBattery, byType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
