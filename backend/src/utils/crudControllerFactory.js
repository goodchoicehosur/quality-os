const asyncHandler = require('../middleware/asyncHandler');

/**
 * Builds a standard set of REST controllers (list, getOne, create, update,
 * remove) for a Mongoose model. Individual master-data routers (Customer,
 * Series, ProductModel, ProductionLine, Operation, Parameter, User) reuse
 * this instead of re-implementing the same CRUD logic five times.
 *
 * @param {import('mongoose').Model} Model
 * @param {Object} options
 * @param {string[]} options.populate - fields to populate on list/getOne
 * @param {string[]} options.searchFields - string fields eligible for ?q= search
 */
function buildCrudController(Model, options = {}) {
  const { populate = [], searchFields = [] } = options;

  const list = asyncHandler(async (req, res) => {
    const { q, active, page = 1, limit = 200, sort = '-createdAt', ...filters } = req.query;

    const query = {};
    if (active !== undefined) query.active = active === 'true';

    // allow simple equality filters on known reference fields, e.g. ?customer=<id>
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== '') query[key] = filters[key];
    });

    if (q && searchFields.length) {
      query.$or = searchFields.map((f) => ({ [f]: { $regex: q, $options: 'i' } }));
    }

    let cursor = Model.find(query).sort(sort);
    populate.forEach((p) => {
      cursor = cursor.populate(p);
    });

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 200, 500);

    const [items, total] = await Promise.all([
      cursor.skip((pageNum - 1) * limitNum).limit(limitNum),
      Model.countDocuments(query),
    ]);

    res.json({ success: true, count: items.length, total, page: pageNum, data: items });
  });

  const getOne = asyncHandler(async (req, res) => {
    let cursor = Model.findById(req.params.id);
    populate.forEach((p) => {
      cursor = cursor.populate(p);
    });
    const item = await cursor;
    if (!item) {
      res.status(404);
      throw new Error('Record not found.');
    }
    res.json({ success: true, data: item });
  });

  const create = asyncHandler(async (req, res) => {
    const item = await Model.create(req.body);
    res.status(201).json({ success: true, data: item });
  });

  const update = asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      res.status(404);
      throw new Error('Record not found.');
    }
    res.json({ success: true, data: item });
  });

  const remove = asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Record not found.');
    }
    res.json({ success: true, data: {} });
  });

  return { list, getOne, create, update, remove };
}

module.exports = buildCrudController;
