const mongoose = require('mongoose');

// Named ProductModel to avoid clashing with mongoose's own "Model" concept.
// Represents a part / vehicle model such as "U245".
const productModelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. U245
    code: { type: String, required: true, uppercase: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
    description: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productModelSchema.index({ code: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model('ProductModel', productModelSchema);
