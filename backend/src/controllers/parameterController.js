const Parameter = require('../models/Parameter');
const buildCrudController = require('../utils/crudControllerFactory');

module.exports = buildCrudController(Parameter, {
  populate: ['operation', 'model'],
  searchFields: ['name', 'specification', 'method'],
});
