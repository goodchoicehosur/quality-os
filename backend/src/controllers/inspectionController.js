const asyncHandler = require('../middleware/asyncHandler');
const InspectionEntry = require('../models/InspectionEntry');
const InspectionTemplate = require('../models/InspectionTemplate');
const NonConformity = require('../models/NonConformity');
const { nextSequence } = require('../models/Counter');

const POPULATE = [
  'template',
  'customer',
  'productionLine',
  'model',
  'Auditor',
  'supervisor',
  'results.operation',
  'results.parameter',
  'results.nonConformity',
];

const populateAll = (cursor) => {
  POPULATE.forEach((p) => {
    cursor = cursor.populate(p);
  });
  return cursor;
};

// @desc    List inspection entries (used by Inspection list, Dashboard log, Reports)
// @route   GET /api/inspections
const list = asyncHandler(async (req, res) => {
  const { status, productionLine, model, shift, from, to, limit = 100 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (productionLine) query.productionLine = productionLine;
  if (model) query.model = model;
  if (shift) query.shift = shift;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const entries = await populateAll(
    InspectionEntry.find(query).sort('-date -createdAt').limit(Math.min(parseInt(limit, 10) || 100, 500))
  );
  res.json({ success: true, count: entries.length, data: entries });
});

// @desc    Get one inspection entry, fully populated for the Excel-like grid
// @route   GET /api/inspections/:id
const getOne = asyncHandler(async (req, res) => {
  const entry = await populateAll(InspectionEntry.findById(req.params.id));
  if (!entry) {
    res.status(404);
    throw new Error('Inspection entry not found.');
  }
  res.json({ success: true, data: entry });
});

// @desc    Start a new inspection entry from a resolved template - this is
//          the "generate the Excel-like screen from database configuration"
//          step. Every row/column on the frontend grid comes from here.
// @route   POST /api/inspections
// @body    { template, date, shift, Auditor, supervisor }
const create = asyncHandler(async (req, res) => {
  const { template: templateId, date, shift, Auditor, supervisor } = req.body;
  if (!templateId || !date || !shift) {
    res.status(400);
    throw new Error('template, date and shift are required.');
  }

  const template = await InspectionTemplate.findById(templateId)
    .populate('operations.operation')
    .populate('operations.parameters.parameter');

  if (!template) {
    res.status(404);
    throw new Error('Inspection template not found.');
  }

  const shiftCodes = template.shifts.map((s) => s.code);

  const results = [];
  template.operations
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .forEach((opRow) => {
      opRow.parameters
        .slice()
        .sort((a, b) => a.siNo - b.siNo)
        .forEach((p) => {
          results.push({
            operation: opRow.operation._id,
            opNumber: opRow.operation.opNumber,
            processName: opRow.operation.processName,
            operationName: opRow.operation.name,
            parameter: p.parameter._id,
            parameterName: p.parameter.name,
            siNo: p.siNo,
            specification: p.specificationOverride || p.parameter.specification,
            unit: p.unitOverride || p.parameter.unit,
            method: p.methodOverride || p.parameter.method,
            shiftResults: shiftCodes.map((code) => ({ shiftCode: code, value: null, actualValue: '' })),
            remarks: '',
          });
        });
    });

  const { id: reportId } = await nextSequence('IPIR');

  const entry = await InspectionEntry.create({
    reportId,
    template: template._id,
    customer: template.customer,
    productionLine: template.productionLine,
    model: template.model,
    date,
    shift,
    Auditor,
    supervisor,
    status: 'InProgress',
    results,
    createdBy: req.user?._id,
  });

  entry.recalculateSummary();
  await entry.save();

  const populated = await populateAll(InspectionEntry.findById(entry._id));
  res.status(201).json({ success: true, data: populated });
});

// @desc    Update a single cell in the grid (OK / NOK / CA click, or an
//          actual-value entry). Recalculates the auto-summary and, on NOK,
//          auto-creates a linked Non-Conformity the way the reference sheet
//          shows ("NC-2025-089 · View NC").
// @route   PATCH /api/inspections/:id/cell
// @body    { rowId, shiftCode, value, actualValue, verdict, verdictValue }
const updateCell = asyncHandler(async (req, res) => {
  const { rowId, shiftCode, value, actualValue, verdict, verdictValue } = req.body;
  if (!rowId || !shiftCode) {
    res.status(400);
    throw new Error('rowId and shiftCode are required.');
  }
  if (value !== undefined && value !== null && !['OK', 'NOK', 'CA'].includes(value)) {
    res.status(400);
    throw new Error('value must be one of OK, NOK, CA or null.');
  }
  if (verdictValue !== undefined && (!['OK', 'NOK', 'CA'].includes(verdict) || typeof verdictValue !== 'string')) {
    res.status(400);
    throw new Error('verdict and a string verdictValue are required to update a verdict value.');
  }

  const entry = await InspectionEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Inspection entry not found.');
  }
  if (['Completed', 'Locked'].includes(entry.status)) {
    res.status(409);
    throw new Error('This report is locked and can no longer be edited.');
  }

  const row = entry.results.id(rowId);
  if (!row) {
    res.status(404);
    throw new Error('Parameter row not found on this report.');
  }

  let cell = row.shiftResults.find((s) => s.shiftCode === shiftCode);
  if (!cell) {
    row.shiftResults.push({ shiftCode, value: null, actualValue: '' });
    cell = row.shiftResults.find((s) => s.shiftCode === shiftCode);
  }

  if (value !== undefined) cell.value = value;
  if (actualValue !== undefined) cell.actualValue = actualValue;
  if (verdictValue !== undefined) {
    cell.verdictValues = cell.verdictValues || {};
    cell.verdictValues[verdict] = verdictValue;
    if (verdict === 'NOK') {
      cell.actualValue = verdictValue;
      if (row.nonConformity) {
        await NonConformity.findByIdAndUpdate(row.nonConformity, { actualValue: verdictValue });
      }
    }
  }

  // Auto-create a Non-Conformity the first time a cell is marked NOK.
  if (value === 'NOK' && !row.nonConformity) {
    const { id: ncId } = await nextSequence('NC');
    const nc = await NonConformity.create({
      ncId,
      inspectionEntry: entry._id,
      resultRowId: row._id,
      productionLine: entry.productionLine,
      model: entry.model,
      operation: row.operation,
      parameter: row.parameter,
      specification: row.specification,
      actualValue: cell.actualValue || '',
      shift: shiftCode,
      severity: 'Medium',
      status: 'Open',
      detectedBy: req.user?._id,
      detectedByName: req.user?.name,
      detectedAt: new Date(),
      description: `${row.parameterName} out of specification (${row.specification}) detected on ${row.operationName}.`,
      timeline: [
        { stage: 'NC Raised', status: 'done', by: req.user?.name || 'System', at: new Date() },
        { stage: 'Root Cause Analysis', status: 'pending' },
        { stage: 'CA Implementation', status: 'pending' },
        { stage: 'Quality Manager Review', status: 'pending' },
        { stage: 'NC Closed', status: 'pending' },
      ],
    });
    row.nonConformity = nc._id;
  }

  entry.recalculateSummary();
  entry.lastSavedAt = new Date();
  await entry.save();

  const populated = await populateAll(InspectionEntry.findById(entry._id));
  res.json({ success: true, data: populated });
});

// @desc    Update the remarks/CA free-text cell for a row
// @route   PATCH /api/inspections/:id/remarks
// @body    { rowId, remarks }
const updateRemarks = asyncHandler(async (req, res) => {
  const { rowId, remarks } = req.body;
  const entry = await InspectionEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Inspection entry not found.');
  }
  if (['Completed', 'Locked'].includes(entry.status)) {
    res.status(409);
    throw new Error('This report is locked and can no longer be edited.');
  }
  const row = entry.results.id(rowId);
  if (!row) {
    res.status(404);
    throw new Error('Parameter row not found on this report.');
  }
  row.remarks = remarks || '';
  entry.lastSavedAt = new Date();
  await entry.save();
  res.json({ success: true, data: { rowId, remarks: row.remarks } });
});

// @desc    Add an ad-hoc parameter row to a report ("+ Add Parameter")
// @route   POST /api/inspections/:id/rows
const addRow = asyncHandler(async (req, res) => {
  const entry = await InspectionEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Inspection entry not found.');
  }
  if (['Completed', 'Locked'].includes(entry.status)) {
    res.status(409);
    throw new Error('This report is locked and can no longer be edited.');
  }

  const template = await InspectionTemplate.findById(entry.template);
  const shiftCodes = template ? template.shifts.map((s) => s.code) : ['F', 'JD', 'M'];

  const {
    operation, opNumber, processName, operationName,
    parameter, parameterName, siNo, specification, unit, method,
  } = req.body;

  entry.results.push({
    operation, opNumber, processName, operationName,
    parameter, parameterName, siNo: siNo || entry.results.length + 1,
    specification, unit, method,
    shiftResults: shiftCodes.map((code) => ({ shiftCode: code, value: null, actualValue: '' })),
    remarks: '',
  });

  entry.recalculateSummary();
  entry.lastSavedAt = new Date();
  await entry.save();

  const populated = await populateAll(InspectionEntry.findById(entry._id));
  res.status(201).json({ success: true, data: populated });
});

// @desc    Update a row's editable fields (specification, unit, method)
// @route   PATCH /api/inspections/:id/row
// @body    { rowId, specification, unit, method }
const updateRow = asyncHandler(async (req, res) => {
  const { rowId, specification, unit, method } = req.body;
  if (!rowId) {
    res.status(400);
    throw new Error('rowId is required.');
  }
  const entry = await InspectionEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Inspection entry not found.');
  }
  if (['Completed', 'Locked'].includes(entry.status)) {
    res.status(409);
    throw new Error('This report is locked and can no longer be edited.');
  }

  const row = entry.results.id(rowId);
  if (!row) {
    res.status(404);
    throw new Error('Parameter row not found on this report.');
  }

  if (specification !== undefined) row.specification = specification;
  if (unit !== undefined) row.unit = unit;
  if (method !== undefined) row.method = method;

  entry.lastSavedAt = new Date();
  await entry.save();

  const populated = await populateAll(InspectionEntry.findById(entry._id));
  res.json({ success: true, data: populated });
});

// @desc    Explicit autosave/save-draft ping from the frontend's autosave timer
// @route   POST /api/inspections/:id/save-draft
const saveDraft = asyncHandler(async (req, res) => {
  const entry = await InspectionEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Inspection entry not found.');
  }
  if (entry.status === 'InProgress') entry.status = 'Draft';
  entry.lastSavedAt = new Date();
  await entry.save();
  res.json({ success: true, data: { lastSavedAt: entry.lastSavedAt, status: entry.status } });
});

// @desc    Resume a draft (Draft -> InProgress)
// @route   POST /api/inspections/:id/resume
const resume = asyncHandler(async (req, res) => {
  const entry = await InspectionEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Inspection entry not found.');
  }
  if (entry.status !== 'Draft') {
    res.status(409);
    throw new Error('Only draft reports can be resumed.');
  }
  entry.status = 'InProgress';
  await entry.save();
  res.json({ success: true, data: entry });
});

// @desc    Submit the report. If quality % is below the template's threshold
//          it goes to SubmittedForReview (supervisor sign-off required),
//          otherwise straight to Completed - mirrors the reference UI's
//          "requires supervisor review before submission" banner.
// @route   POST /api/inspections/:id/submit
const submit = asyncHandler(async (req, res) => {
  const entry = await InspectionEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Inspection entry not found.');
  }
  const template = await InspectionTemplate.findById(entry.template);
  const threshold = template ? template.qualityThreshold : 85;

  entry.recalculateSummary();
  entry.status = entry.summary.qualityPercent < threshold ? 'SubmittedForReview' : 'Completed';
  entry.submittedAt = new Date();
  await entry.save();

  const populated = await populateAll(InspectionEntry.findById(entry._id));
  res.json({ success: true, data: populated });
});

// @desc    Supervisor final approval after review
// @route   POST /api/inspections/:id/approve
const approve = asyncHandler(async (req, res) => {
  const entry = await InspectionEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Inspection entry not found.');
  }
  entry.status = 'Completed';
  await entry.save();
  res.json({ success: true, data: entry });
});

// @desc    Lock a completed/in-review report against further edits
// @route   POST /api/inspections/:id/lock
const lock = asyncHandler(async (req, res) => {
  const entry = await InspectionEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Inspection entry not found.');
  }
  entry.status = 'Locked';
  entry.lockedAt = new Date();
  await entry.save();
  res.json({ success: true, data: entry });
});

// @desc    Discard a draft entirely
// @route   DELETE /api/inspections/:id
const discard = asyncHandler(async (req, res) => {
  const entry = await InspectionEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Inspection entry not found.');
  }
  if (!['Draft', 'InProgress'].includes(entry.status)) {
    res.status(409);
    throw new Error('Only draft or in-progress reports can be discarded.');
  }
  await entry.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = {
  list, getOne, create, updateCell, updateRemarks, addRow, updateRow,
  saveDraft, resume, submit, approve, lock, discard,
};
