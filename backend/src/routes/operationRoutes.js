const buildCrudRouter = require('../utils/crudRouterFactory');
const controller = require('../controllers/operationController');
module.exports = buildCrudRouter(controller);
