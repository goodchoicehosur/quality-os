const Operation = require('../models/Operation');
const buildCrudController = require('../utils/crudControllerFactory');

module.exports = buildCrudController(Operation, {
  searchFields: ['name', 'processName'],
});
