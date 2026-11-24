const express = require('express');
const { protect } = require('../middleware/auth');
const controller = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);
router.get('/overview', controller.overview);
router.get('/lines', controller.lineStatus);
router.get('/quality-trend', controller.qualityTrend);
router.get('/top-defects', controller.topDefects);
router.get('/inspection-status', controller.inspectionStatus);
router.get('/log', controller.todaysLog);
router.get('/recent-nc', controller.recentNC);

module.exports = router;
