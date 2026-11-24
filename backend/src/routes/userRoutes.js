const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const controller = require('../controllers/userController');

const router = express.Router();

router.use(protect);
router.get('/inspectors', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.listInspectors);
router.get('/', authorize('Admin'), controller.list);
router.get('/:id', authorize('Admin'), controller.getOne);
router.post('/', authorize('Admin'), controller.create);
router.put('/:id', authorize('Admin'), controller.update);
router.delete('/:id', authorize('Admin'), controller.remove);

module.exports = router;
