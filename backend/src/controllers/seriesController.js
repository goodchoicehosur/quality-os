const Series = require('../models/Series');
const buildCrudController = require('../utils/crudControllerFactory');

module.exports = buildCrudController(Series, {
  populate: ['customer'],
  searchFields: ['name', 'code'],
});
