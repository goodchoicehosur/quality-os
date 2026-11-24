const mongoose = require('mongoose');

// Generic incrementing counter used to build human-friendly IDs
// e.g. IPIR-2025-0001, NC-2025-0001. One document per (key + year).
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

async function nextSequence(prefix) {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const padded = String(doc.seq).padStart(4, '0');
  return { id: `${prefix}-${year}-${padded}`, year, seq: doc.seq };
}

module.exports = { Counter, nextSequence };
