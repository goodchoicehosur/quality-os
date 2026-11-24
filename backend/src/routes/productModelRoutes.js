const buildCrudRouter = require('../utils/crudRouterFactory');
const controller = require('../controllers/productModelController');
module.exports = buildCrudRouter(controller);
