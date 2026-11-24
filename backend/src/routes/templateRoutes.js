const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const controller = require('../controllers/templateController');

const router = express.Router();

router.use(protect);
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.get('/:id/resolve', controller.resolve);
router.post('/', authorize('Admin', 'QualityManager'), controller.create);
router.post('/auto-build', authorize('Admin', 'QualityManager'), controller.autoBuild);
router.put('/:id', authorize('Admin', 'QualityManager'), controller.update);
router.delete('/:id', authorize('Admin', 'QualityManager'), controller.remove);

module.exports = router;
