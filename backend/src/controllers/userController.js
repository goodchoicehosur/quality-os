const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');

// @desc    List users
// @route   GET /api/users
const list = asyncHandler(async (req, res) => {
  const { q, active, role } = req.query;
  const query = {};
  if (active !== undefined) query.active = active === 'true';
  if (role) query.role = role;
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }
  const users = await User.find(query).populate('productionLines').sort('name');
  res.json({ success: true, count: users.length, data: users.map((u) => u.toSafeObject()) });
});

// @desc    List active auditors for inspection assignment without exposing user records
// @route   GET /api/users/inspectors
const listInspectors = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'Auditor', active: true })
    .select('name initials')
    .sort('name');
  res.json({ success: true, count: users.length, data: users });
});

// @desc    Get one user
// @route   GET /api/users/:id
const getOne = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('productionLines');
  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }
  res.json({ success: true, data: user.toSafeObject() });
});

// @desc    Create a user (Admin)
// @route   POST /api/users
const create = asyncHandler(async (req, res) => {
  const exists = await User.findOne({ email: req.body.email?.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error('A user with this email already exists.');
  }
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user.toSafeObject() });
});

// @desc    Update a user (Admin) - goes through save() so password re-hashes if provided
// @route   PUT /api/users/:id
const update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  const editable = ['name', 'email', 'role', 'phone', 'productionLines', 'active', 'password', 'initials'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== '') {
      user[field] = req.body[field];
    }
  });

  const updated = await user.save();
  res.json({ success: true, data: updated.toSafeObject() });
});

// @desc    Deactivate/delete a user
// @route   DELETE /api/users/:id
const remove = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }
  // Soft-delete by default to preserve historical inspection/NC references
  user.active = false;
  await user.save();
  res.json({ success: true, data: {} });
});

module.exports = { list, listInspectors, getOne, create, update, remove };
