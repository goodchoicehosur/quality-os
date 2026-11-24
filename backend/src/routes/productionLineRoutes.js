const buildCrudRouter = require('../utils/crudRouterFactory');
const controller = require('../controllers/productionLineController');
module.exports = buildCrudRouter(controller);
