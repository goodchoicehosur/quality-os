const mongoose = require('mongoose');

const productionLineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. FML-1
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    defaultModel: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductModel' },
    location: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductionLine', productionLineSchema);
