const express = require('express');
const router = express.Router();
const Battery = require('../models/Battery');
const Ammunition = require('../models/Ammunition');

// Get all batteries with ammo summary
router.get('/', async (req, res) => {
  try {
    const batteries = await Battery.find();
    const batteryStats = await Promise.all(
      batteries.map(async (battery) => {
        const ammo = await Ammunition.find({ batteryId: battery.id });
        const total = ammo.reduce((sum, a) => sum + a.quantity, 0);
        return {
          ...battery.toObject(),
          totalRounds: total,
          ammoCount: ammo.length
        };
      })
    );
    res.json(batteryStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific battery with details
router.get('/:batteryId', async (req, res) => {
  try {
    const battery = await Battery.findOne({ id: req.params.batteryId });
    if (!battery) {
      return res.status(404).json({ error: 'Battery not found' });
    }
    const ammo = await Ammunition.find({ batteryId: req.params.batteryId });
    res.json({ ...battery.toObject(), ammunition: ammo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize batteries
router.post('/init', async (req, res) => {
  try {
    const batteries = [
      { id: 'A', name: 'Battery Alpha', callsign: 'ALPHA-6', color: '#e85d04' },
      { id: 'B', name: 'Battery Bravo', callsign: 'BRAVO-6', color: '#38bdf8' },
      { id: 'C', name: 'Battery Charlie', callsign: 'CHARLIE-6', color: '#a3e635' },
      { id: 'D', name: 'Battery Delta', callsign: 'DELTA-6', color: '#f472b6' }
    ];

    for (const batteryData of batteries) {
      const exists = await Battery.findOne({ id: batteryData.id });
      if (!exists) {
        await Battery.create(batteryData);
      }
    }

    res.json({ message: 'Batteries initialized' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
