const ProductionLine = require('../models/ProductionLine');
const buildCrudController = require('../utils/crudControllerFactory');

module.exports = buildCrudController(ProductionLine, {
  populate: ['defaultModel'],
  searchFields: ['name', 'code', 'location'],
});
