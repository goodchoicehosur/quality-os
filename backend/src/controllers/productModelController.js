const ProductModel = require('../models/ProductModel');
const buildCrudController = require('../utils/crudControllerFactory');

module.exports = buildCrudController(ProductModel, {
  populate: ['customer', 'series'],
  searchFields: ['name', 'code'],
});
