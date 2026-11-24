const mongoose = require('mongoose');

const STATUSES = ['Draft', 'InProgress', 'SubmittedForReview', 'Completed', 'Locked'];
const RESULT_VALUES = ['OK', 'NOK', 'CA', null];

// One cell of the Excel-like grid: a parameter's result for one shift.
const shiftResultSchema = new mongoose.Schema(
  {
    shiftCode: { type: String, required: true },
    value: { type: String, enum: RESULT_VALUES, default: null },
    actualValue: { type: String, trim: true }, // e.g. "14.2 KA" shown under spec when NOK
    verdictValues: {
      OK: { type: String, default: '' },
      NOK: { type: String, default: '' },
      CA: { type: String, default: '' },
    },
  },
  { _id: false }
);

// One row of the Excel-like grid: an operation+parameter pairing, carrying
// results across every configured shift.
const resultRowSchema = new mongoose.Schema(
  {
    operation: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true },
    opNumber: { type: Number, required: true },
    processName: { type: String, required: true },
    operationName: { type: String, required: true },
    parameter: { type: mongoose.Schema.Types.ObjectId, ref: 'Parameter', required: true },
    parameterName: { type: String, required: true },
    siNo: { type: Number, required: true },
    specification: { type: String, required: true },
    unit: { type: String },
    method: { type: String },
    shiftResults: [shiftResultSchema],
    remarks: { type: String, trim: true, default: '' },
    nonConformity: { type: mongoose.Schema.Types.ObjectId, ref: 'NonConformity', default: null },
  },
  { _id: true }
);

const inspectionEntrySchema = new mongoose.Schema(
  {
    reportId: { type: String, required: true, unique: true }, // IPIR-2025-0893
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'InspectionTemplate', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    productionLine: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionLine', required: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductModel', required: true },
    date: { type: Date, required: true },
    shift: { type: String, required: true }, // active shift code entry is focused on
    Auditor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: STATUSES, default: 'InProgress' },
    results: [resultRowSchema],
    summary: {
      totalParameters: { type: Number, default: 0 },
      totalNC: { type: Number, default: 0 },
      correctiveActions: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      qualityPercent: { type: Number, default: 0 },
    },
    lastSavedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    lockedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

inspectionEntrySchema.index({ productionLine: 1, date: -1 });
inspectionEntrySchema.index({ status: 1 });

// Recompute the auto-calculated summary block from the current result rows.
inspectionEntrySchema.methods.recalculateSummary = function () {
  let total = 0;
  let completed = 0;
  let ok = 0;
  let nok = 0;
  let ca = 0;

  for (const row of this.results) {
    total += 1;
    const activeCell = row.shiftResults.find((s) => s.shiftCode === this.shift);
    const value = activeCell ? activeCell.value : null;
    if (value) completed += 1;
    if (value === 'OK') ok += 1;
    if (value === 'NOK') nok += 1;
    if (value === 'CA') ca += 1;
  }

  const scored = ok + nok; // CA counted separately, matches reference "8 OK / 12" style ratio
  this.summary = {
    totalParameters: total,
    totalNC: nok,
    correctiveActions: ca,
    completed,
    qualityPercent: scored > 0 ? Math.round((ok / scored) * 1000) / 10 : 0,
  };
  return this.summary;
};

module.exports = mongoose.model('InspectionEntry', inspectionEntrySchema);
module.exports.STATUSES = STATUSES;
module.exports.RESULT_VALUES = RESULT_VALUES;
