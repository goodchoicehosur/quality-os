const express = require('express');
const { protect, authorize } = require('../middleware/auth');

/**
 * Builds a standard REST router (list/getOne public-to-authenticated,
 * create/update/remove restricted to the given roles) for a controller
 * produced by crudControllerFactory.
 */
function buildCrudRouter(controller, { writeRoles = ['Admin', 'QualityManager'] } = {}) {
  const router = express.Router();

  router.use(protect);
  router.get('/', controller.list);
  router.get('/:id', controller.getOne);
  router.post('/', authorize(...writeRoles), controller.create);
  router.put('/:id', authorize(...writeRoles), controller.update);
  router.delete('/:id', authorize(...writeRoles), controller.remove);

  return router;
}

module.exports = buildCrudRouter;
