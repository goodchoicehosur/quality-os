const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema(
  {
    opNumber: { type: Number, required: true }, // e.g. 20, 30, 40
    name: { type: String, required: true, trim: true }, // e.g. Outer Spot Welding
    processName: { type: String, required: true, trim: true }, // e.g. Spot Weld (short badge label)
    description: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

operationSchema.index({ opNumber: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Operation', operationSchema);
