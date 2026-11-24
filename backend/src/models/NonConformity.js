const mongoose = require('mongoose');

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'UnderCA', 'PendingApproval', 'Closed'];

const timelineItemSchema = new mongoose.Schema(
  {
    stage: { type: String, required: true }, // e.g. "NC Raised", "CA Implementation"
    status: { type: String, enum: ['done', 'active', 'pending', 'reject'], default: 'pending' },
    by: { type: String, trim: true },
    note: { type: String, trim: true },
    at: { type: Date },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, trim: true },
    text: { type: String, required: true, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: String, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const nonConformitySchema = new mongoose.Schema(
  {
    ncId: { type: String, required: true, unique: true }, // NC-2025-089
    inspectionEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'InspectionEntry' },
    resultRowId: { type: mongoose.Schema.Types.ObjectId },
    productionLine: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionLine', required: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductModel', required: true },
    operation: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true },
    parameter: { type: mongoose.Schema.Types.ObjectId, ref: 'Parameter', required: true },
    specification: { type: String },
    actualValue: { type: String },
    shift: { type: String },
    severity: { type: String, enum: SEVERITIES, default: 'Medium' },
    status: { type: String, enum: STATUSES, default: 'Open' },
    detectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    detectedByName: { type: String, trim: true },
    detectedAt: { type: Date, default: Date.now },
    description: { type: String, trim: true },
    rootCause: {
      category: { type: String, trim: true },
      description: { type: String, trim: true },
    },
    whyWhy: {
      analysis: { type: String, trim: true },
    },
    correctiveAction: {
      description: { type: String, trim: true },
      owner: { type: String, trim: true },
      targetDate: { type: Date },
      status: { type: String, trim: true, default: 'Not started' },
    },
    impact: {
      affectedParts: { type: Number, default: 0 },
      batch: { type: String, trim: true },
      disposition: { type: String, trim: true }, // Rework / Scrap / Use-as-is
      machineHalted: { type: Boolean, default: false },
      customerNotified: { type: Boolean, default: false },
    },
    timeline: [timelineItemSchema],
    comments: [commentSchema],
    attachments: [attachmentSchema],
    closedAt: { type: Date },
  },
  { timestamps: true }
);

nonConformitySchema.index({ status: 1, severity: 1 });
nonConformitySchema.index({ productionLine: 1, createdAt: -1 });

module.exports = mongoose.model('NonConformity', nonConformitySchema);
module.exports.SEVERITIES = SEVERITIES;
module.exports.STATUSES = STATUSES;
