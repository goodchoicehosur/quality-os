const buildCrudRouter = require('../utils/crudRouterFactory');
const controller = require('../controllers/seriesController');
module.exports = buildCrudRouter(controller);
