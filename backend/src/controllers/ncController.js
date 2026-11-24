const asyncHandler = require('../middleware/asyncHandler');
const NonConformity = require('../models/NonConformity');

const POPULATE = ['productionLine', 'model', 'operation', 'parameter', 'detectedBy'];
const populateAll = (cursor) => {
  POPULATE.forEach((p) => {
    cursor = cursor.populate(p);
  });
  return cursor.populate('inspectionEntry', 'reportId status');
};

// @desc    List NCs (Non-Conformity list, dashboard "recent NCs")
// @route   GET /api/nc
const list = asyncHandler(async (req, res) => {
  const { status, severity, productionLine, model, limit = 100 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (productionLine) query.productionLine = productionLine;
  if (model) query.model = model;

  const items = await populateAll(
    NonConformity.find(query).sort('-createdAt').limit(Math.min(parseInt(limit, 10) || 100, 500))
  );
  res.json({ success: true, count: items.length, data: items });
});

// @desc    Get one NC, fully populated
// @route   GET /api/nc/:id
const getOne = asyncHandler(async (req, res) => {
  const item = await populateAll(NonConformity.findById(req.params.id));
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  res.json({ success: true, data: item });
});

// @desc    Create an NC manually (not tied to an inspection cell)
// @route   POST /api/nc
const create = asyncHandler(async (req, res) => {
  const { nextSequence } = require('../models/Counter');
  const { id: ncId } = await nextSequence('NC');
  const item = await NonConformity.create({
    ...req.body,
    ncId,
    detectedBy: req.user?._id,
    detectedByName: req.user?.name,
    timeline: req.body.timeline || [
      { stage: 'NC Raised', status: 'done', by: req.user?.name || 'System', at: new Date() },
      { stage: 'Root Cause Analysis', status: 'pending' },
      { stage: 'CA Implementation', status: 'pending' },
      { stage: 'Quality Manager Review', status: 'pending' },
      { stage: 'NC Closed', status: 'pending' },
    ],
  });
  res.status(201).json({ success: true, data: item });
});

// @desc    Update top-level NC fields (severity, status, description, edit form)
// @route   PUT /api/nc/:id
const update = asyncHandler(async (req, res) => {
  const item = await NonConformity.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  res.json({ success: true, data: item });
});

// @desc    Update root cause analysis + severity
// @route   PUT /api/nc/:id/root-cause
const updateRootCause = asyncHandler(async (req, res) => {
  const { category, description, severity } = req.body;
  const item = await NonConformity.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  item.rootCause = { category, description };
  if (severity) item.severity = severity;
  item.status = 'UnderCA';

  const rcaStage = item.timeline.find((t) => t.stage === 'Root Cause Analysis');
  if (rcaStage) {
    rcaStage.status = 'done';
    rcaStage.at = new Date();
    rcaStage.by = req.user?.name;
  }
  const caStage = item.timeline.find((t) => t.stage === 'CA Implementation');
  if (caStage && caStage.status === 'pending') caStage.status = 'active';

  await item.save();
  res.json({ success: true, data: item });
});

// @desc    Update corrective action plan
// @route   PUT /api/nc/:id/corrective-action
const updateCorrectiveAction = asyncHandler(async (req, res) => {
  const { description, owner, targetDate, status } = req.body;
  const item = await NonConformity.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  item.correctiveAction = {
    description: description ?? item.correctiveAction?.description,
    owner: owner ?? item.correctiveAction?.owner,
    targetDate: targetDate ?? item.correctiveAction?.targetDate,
    status: status ?? item.correctiveAction?.status,
  };

  if (status === 'Completed') {
    const caStage = item.timeline.find((t) => t.stage === 'CA Implementation');
    if (caStage) {
      caStage.status = 'done';
      caStage.at = new Date();
    }
    const qmStage = item.timeline.find((t) => t.stage === 'Quality Manager Review');
    if (qmStage) qmStage.status = 'active';
    item.status = 'PendingApproval';
  }

  await item.save();
  res.json({ success: true, data: item });
});

// @desc    Update Why-Why analysis
// @route   PUT /api/nc/:id/whywhy
const updateWhyWhy = asyncHandler(async (req, res) => {
  const { analysis } = req.body;
  const item = await NonConformity.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  item.whyWhy = { analysis };
  await item.save();
  res.json({ success: true, data: item });
});

// @desc    Update impact assessment (affected parts, batch, disposition, halted, notified)
// @route   PUT /api/nc/:id/impact
const updateImpact = asyncHandler(async (req, res) => {
  const item = await NonConformity.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  item.impact = { ...item.impact.toObject(), ...req.body };
  await item.save();
  res.json({ success: true, data: item });
});

// @desc    Add a comment
// @route   POST /api/nc/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400);
    throw new Error('Comment text is required.');
  }
  const item = await NonConformity.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  item.comments.push({ user: req.user?._id, userName: req.user?.name || 'User', text, at: new Date() });
  await item.save();
  res.status(201).json({ success: true, data: item.comments });
});

// @desc    Register an attachment (metadata only - file storage is out of scope for local dev)
// @route   POST /api/nc/:id/attachments
const addAttachment = asyncHandler(async (req, res) => {
  const { filename, url } = req.body;
  if (!filename || !url) {
    res.status(400);
    throw new Error('filename and url are required.');
  }
  const item = await NonConformity.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  item.attachments.push({ filename, url, uploadedBy: req.user?.name, at: new Date() });
  await item.save();
  res.status(201).json({ success: true, data: item.attachments });
});

// @desc    Upload an attachment file (base64 payload) and register it
// @route   POST /api/nc/:id/attachments/upload
const uploadAttachment = asyncHandler(async (req, res) => {
  const { filename, data } = req.body;
  if (!filename || !data) {
    res.status(400);
    throw new Error('filename and data are required.');
  }
  const item = await NonConformity.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }

  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // prefix timestamp to avoid collisions
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(uploadsDir, safeName);

  // data is expected as data URI or base64 string
  const base64 = data.startsWith('data:') ? data.split(',')[1] : data;
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(filePath, buffer);

  const url = `/uploads/${safeName}`;
  item.attachments.push({ filename, url, uploadedBy: req.user?.name, at: new Date() });
  await item.save();
  res.status(201).json({ success: true, data: item.attachments, url });
});

// @desc    Advance the workflow to Quality Manager review
// @route   POST /api/nc/:id/advance
const advance = asyncHandler(async (req, res) => {
  const item = await NonConformity.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  const qmStage = item.timeline.find((t) => t.stage === 'Quality Manager Review');
  if (qmStage) {
    qmStage.status = 'done';
    qmStage.at = new Date();
    qmStage.by = req.user?.name;
  }
  const closeStage = item.timeline.find((t) => t.stage === 'NC Closed');
  if (closeStage) closeStage.status = 'active';
  item.status = 'PendingApproval';
  await item.save();
  res.json({ success: true, data: item });
});

// @desc    Approve & close the NC
// @route   POST /api/nc/:id/approve-close
const approveClose = asyncHandler(async (req, res) => {
  const item = await NonConformity.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  item.status = 'Closed';
  item.closedAt = new Date();
  const closeStage = item.timeline.find((t) => t.stage === 'NC Closed');
  if (closeStage) {
    closeStage.status = 'done';
    closeStage.at = new Date();
    closeStage.by = req.user?.name;
  }
  await item.save();
  res.json({ success: true, data: item });
});

// @desc    Escalate an NC (bump severity to Critical + flag)
// @route   POST /api/nc/:id/escalate
const escalate = asyncHandler(async (req, res) => {
  const item = await NonConformity.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  item.severity = 'Critical';
  item.comments.push({
    user: req.user?._id,
    userName: req.user?.name || 'User',
    text: req.body.reason || 'Escalated for immediate attention.',
    at: new Date(),
  });
  await item.save();
  res.json({ success: true, data: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await NonConformity.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Non-conformity not found.');
  }
  res.json({ success: true, data: {} });
});

module.exports = {
  list, getOne, create, update, remove,
  updateRootCause, updateCorrectiveAction, updateImpact,
  addComment, addAttachment, advance, approveClose, escalate,
  updateWhyWhy, uploadAttachment,
};
