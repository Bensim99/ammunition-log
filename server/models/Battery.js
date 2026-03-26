const mongoose = require('mongoose');

const BatterySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D'],
    unique: true
  },
  name: String,
  callsign: String,
  color: String,
  lastTransaction: Date,
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Battery', BatterySchema);
