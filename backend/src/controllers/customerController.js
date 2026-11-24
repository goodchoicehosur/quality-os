const Customer = require('../models/Customer');
const buildCrudController = require('../utils/crudControllerFactory');

module.exports = buildCrudController(Customer, {
  searchFields: ['name', 'code', 'contactPerson', 'email'],
});
