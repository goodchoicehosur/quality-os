const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    description: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

seriesSchema.index({ code: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model('Series', seriesSchema);
