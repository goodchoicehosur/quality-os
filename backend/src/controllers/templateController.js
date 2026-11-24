const asyncHandler = require('../middleware/asyncHandler');
const InspectionTemplate = require('../models/InspectionTemplate');
const Parameter = require('../models/Parameter');
const Operation = require('../models/Operation');

const DEEP_POPULATE = [
  { path: 'customer' },
  { path: 'productionLine' },
  { path: 'model' },
  { path: 'operations.operation' },
  { path: 'operations.parameters.parameter' },
];

// @desc    List templates
// @route   GET /api/templates
const list = asyncHandler(async (req, res) => {
  const { customer, productionLine, model, active } = req.query;
  const query = {};
  if (customer) query.customer = customer;
  if (productionLine) query.productionLine = productionLine;
  if (model) query.model = model;
  if (active !== undefined) query.active = active === 'true';

  const templates = await InspectionTemplate.find(query)
    .populate('customer productionLine model')
    .sort('-createdAt');
  res.json({ success: true, count: templates.length, data: templates });
});

// @desc    Get one template (shallow)
// @route   GET /api/templates/:id
const getOne = asyncHandler(async (req, res) => {
  let cursor = InspectionTemplate.findById(req.params.id);
  DEEP_POPULATE.forEach((p) => {
    cursor = cursor.populate(p);
  });
  const template = await cursor;
  if (!template) {
    res.status(404);
    throw new Error('Template not found.');
  }
  res.json({ success: true, data: template });
});

// @desc    Create a template
// @route   POST /api/templates
const create = asyncHandler(async (req, res) => {
  const template = await InspectionTemplate.create(req.body);
  res.status(201).json({ success: true, data: template });
});

// @desc    Update a template (add/remove operations & parameters, reorder, override specs)
// @route   PUT /api/templates/:id
const update = asyncHandler(async (req, res) => {
  const template = await InspectionTemplate.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!template) {
    res.status(404);
    throw new Error('Template not found.');
  }
  res.json({ success: true, data: template });
});

// @desc    Delete a template
// @route   DELETE /api/templates/:id
const remove = asyncHandler(async (req, res) => {
  const template = await InspectionTemplate.findByIdAndDelete(req.params.id);
  if (!template) {
    res.status(404);
    throw new Error('Template not found.');
  }
  res.json({ success: true, data: {} });
});

// @desc    Fully resolve a template into the exact row structure the Excel-like
//          Inspection Entry grid needs: operations in sequence, each with its
//          parameters (spec/unit/method merged with any override), ready to
//          render with zero hardcoding on the frontend.
// @route   GET /api/templates/:id/resolve
const resolve = asyncHandler(async (req, res) => {
  let cursor = InspectionTemplate.findById(req.params.id);
  DEEP_POPULATE.forEach((p) => {
    cursor = cursor.populate(p);
  });
  const template = await cursor;
  if (!template) {
    res.status(404);
    throw new Error('Template not found.');
  }

  const operations = template.operations
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((opRow) => ({
      operation: opRow.operation._id,
      opNumber: opRow.operation.opNumber,
      name: opRow.operation.name,
      processName: opRow.operation.processName,
      sequence: opRow.sequence,
      parameters: opRow.parameters
        .slice()
        .sort((a, b) => a.siNo - b.siNo)
        .map((p) => ({
          parameter: p.parameter._id,
          siNo: p.siNo,
          name: p.parameter.name,
          specification: p.specificationOverride || p.parameter.specification,
          unit: p.unitOverride || p.parameter.unit,
          method: p.methodOverride || p.parameter.method,
          type: p.parameter.type,
        })),
    }));

  res.json({
    success: true,
    data: {
      _id: template._id,
      name: template.name,
      customer: template.customer,
      productionLine: template.productionLine,
      model: template.model,
      shifts: template.shifts,
      qualityThreshold: template.qualityThreshold,
      operations,
    },
  });
});

// @desc    Auto-build a template's operation/parameter tree from whatever is
//          already configured in the Parameter master for the given model.
//          This is what lets an admin add a new production line or model and
//          have the Excel-like sheet generate itself from Parameter Master
//          records instead of hand-wiring each cell.
// @route   POST /api/templates/auto-build
// @body    { name, customer, productionLine, model }
const autoBuild = asyncHandler(async (req, res) => {
  const { name, customer, productionLine, model } = req.body;
  if (!customer || !productionLine || !model) {
    res.status(400);
    throw new Error('customer, productionLine and model are required.');
  }

  const parameters = await Parameter.find({ model, active: true }).populate('operation');
  if (!parameters.length) {
    res.status(400);
    throw new Error('No active parameters are configured for this model in Parameter Master yet.');
  }

  const byOperation = new Map();
  parameters.forEach((p) => {
    const opId = String(p.operation._id);
    if (!byOperation.has(opId)) {
      byOperation.set(opId, { operation: p.operation, parameters: [] });
    }
    byOperation.get(opId).parameters.push({ parameter: p._id, siNo: p.siNo });
  });

  const operations = Array.from(byOperation.values())
    .sort((a, b) => a.operation.opNumber - b.operation.opNumber)
    .map((entry, idx) => ({
      operation: entry.operation._id,
      sequence: idx + 1,
      parameters: entry.parameters.sort((a, b) => a.siNo - b.siNo),
    }));

  const template = await InspectionTemplate.create({
    name: name || `Auto-generated Template`,
    customer,
    productionLine,
    model,
    operations,
  });

  res.status(201).json({ success: true, data: template });
});

module.exports = { list, getOne, create, update, remove, resolve, autoBuild };
