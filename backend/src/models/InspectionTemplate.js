const mongoose = require('mongoose');

// A template is the "database configuration" the Excel-like Inspection Entry
// screen is generated from. It ties a Customer + Production Line + Model to
// an ordered set of Operations, each carrying an ordered set of Parameters.
// Nothing about the sheet layout is hardcoded on the frontend - it is all
// derived from this document at render time.

const shiftSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true }, // F, JD, M
    label: { type: String, required: true, trim: true }, // Shift F (06:00-14:00)
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
  },
  { _id: false }
);

const templateParameterSchema = new mongoose.Schema(
  {
    parameter: { type: mongoose.Schema.Types.ObjectId, ref: 'Parameter', required: true },
    siNo: { type: Number, required: true },
    // Optional per-template overrides, since the same master parameter can
    // have a different spec on a different model/line combination.
    specificationOverride: { type: String, trim: true },
    unitOverride: { type: String, trim: true },
    methodOverride: { type: String, trim: true },
  },
  { _id: false }
);

const templateOperationSchema = new mongoose.Schema(
  {
    operation: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true },
    sequence: { type: Number, required: true },
    parameters: [templateParameterSchema],
  },
  { _id: false }
);

const inspectionTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    productionLine: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionLine', required: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductModel', required: true },
    shifts: { type: [shiftSchema], default: () => [
      { code: 'F', label: 'Shift F (06:00\u201314:00)', startTime: '06:00', endTime: '14:00' },
      { code: 'JD', label: 'Shift JD (14:00\u201322:00)', startTime: '14:00', endTime: '22:00' },
      { code: 'M', label: 'Shift M (22:00\u201306:00)', startTime: '22:00', endTime: '06:00' },
    ]},
    operations: [templateOperationSchema],
    qualityThreshold: { type: Number, default: 85 }, // % - below this, supervisor review required
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

inspectionTemplateSchema.index({ customer: 1, productionLine: 1, model: 1 });

module.exports = mongoose.model('InspectionTemplate', inspectionTemplateSchema);
