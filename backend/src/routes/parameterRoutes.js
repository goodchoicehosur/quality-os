const buildCrudRouter = require('../utils/crudRouterFactory');
const controller = require('../controllers/parameterController');
module.exports = buildCrudRouter(controller);
