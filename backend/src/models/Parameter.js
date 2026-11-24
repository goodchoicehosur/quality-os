const mongoose = require('mongoose');

const PARAMETER_TYPES = ['Process', 'Product'];

const parameterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. Weld Current
    specification: { type: String, required: true, trim: true }, // e.g. 17 ±1 KA
    unit: { type: String, trim: true }, // e.g. KA
    method: { type: String, trim: true }, // e.g. Amp Meter
    type: { type: String, enum: PARAMETER_TYPES, default: 'Process' },
    frequency: { type: String, trim: true, default: 'Every 2 hrs' },
    operation: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductModel', required: true },
    siNo: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

parameterSchema.index({ model: 1, operation: 1, siNo: 1 });

module.exports = mongoose.model('Parameter', parameterSchema);
module.exports.PARAMETER_TYPES = PARAMETER_TYPES;
