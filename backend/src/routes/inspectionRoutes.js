const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const controller = require('../controllers/inspectionController');

const router = express.Router();

router.use(protect);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.create);

router.patch('/:id/cell', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.updateCell);
router.patch('/:id/remarks', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.updateRemarks);
router.patch('/:id/row', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.updateRow);
router.post('/:id/rows', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.addRow);

router.post('/:id/save-draft', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.saveDraft);
router.post('/:id/resume', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.resume);
router.post('/:id/submit', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.submit);
router.post('/:id/approve', authorize('Admin', 'QualityManager', 'Supervisor'), controller.approve);
router.post('/:id/lock', authorize('Admin', 'QualityManager', 'Supervisor'), controller.lock);

router.delete('/:id', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.discard);

module.exports = router;
