const express = require('express');
const router = express.Router();
const Ammunition = require('../models/Ammunition');

// Get all ammunition stocks
router.get('/', async (req, res) => {
  try {
    const ammunition = await Ammunition.find();
    res.json(ammunition);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get ammunition for specific battery
router.get('/:batteryId', async (req, res) => {
  try {
    const ammunition = await Ammunition.find({ batteryId: req.params.batteryId });
    res.json(ammunition);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update ammunition quantity
router.patch('/:batteryId/:ammoId', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    let ammo = await Ammunition.findOne({
      batteryId: req.params.batteryId,
      ammoId: req.params.ammoId
    });

    if (!ammo) {
      ammo = new Ammunition({
        batteryId: req.params.batteryId,
        ammoId: req.params.ammoId,
        quantity
      });
    } else {
      ammo.quantity = quantity;
      ammo.lastUpdated = Date.now();
    }

    await ammo.save();
    res.json(ammo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize default ammunition if needed
router.post('/init', async (req, res) => {
  try {
    const batteries = ['A', 'B', 'C', 'D'];
    const ammoTypes = ['HE', 'SMK', 'ILLUM', 'WP', 'DPICM', 'EXCAL'];

    for (const batteryId of batteries) {
      for (const ammoId of ammoTypes) {
        const exists = await Ammunition.findOne({ batteryId, ammoId });
        if (!exists) {
          await Ammunition.create({
            batteryId,
            ammoId,
            quantity: Math.floor(Math.random() * 200) + 50
          });
        }
      }
    }

    res.json({ message: 'Ammunition initialized' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
