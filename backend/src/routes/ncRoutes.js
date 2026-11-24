const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const controller = require('../controllers/ncController');

const router = express.Router();

router.use(protect);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.create);
router.put('/:id', authorize('Admin', 'QualityManager', 'Supervisor'), controller.update);
router.delete('/:id', authorize('Admin', 'QualityManager'), controller.remove);

router.put('/:id/root-cause', authorize('Admin', 'QualityManager', 'Supervisor'), controller.updateRootCause);
router.put('/:id/corrective-action', authorize('Admin', 'QualityManager', 'Supervisor'), controller.updateCorrectiveAction);
router.put('/:id/impact', authorize('Admin', 'QualityManager', 'Supervisor'), controller.updateImpact);

router.post('/:id/comments', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.addComment);
router.post('/:id/attachments', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.addAttachment);
router.post('/:id/attachments/upload', authorize('Admin', 'QualityManager', 'Supervisor', 'Auditor'), controller.uploadAttachment);
router.put('/:id/whywhy', authorize('Admin', 'QualityManager', 'Supervisor'), controller.updateWhyWhy);
router.post('/:id/advance', authorize('Admin', 'QualityManager', 'Supervisor'), controller.advance);
router.post('/:id/approve-close', authorize('Admin', 'QualityManager'), controller.approveClose);
router.post('/:id/escalate', authorize('Admin', 'QualityManager', 'Supervisor'), controller.escalate);

module.exports = router;
