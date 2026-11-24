const buildCrudRouter = require('../utils/crudRouterFactory');
const controller = require('../controllers/customerController');
module.exports = buildCrudRouter(controller);
