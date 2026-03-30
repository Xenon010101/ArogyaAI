const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validation');
const { createReportSchema, updateReportSchema } = require('../validators/reportValidator');

const express = require('express');
const router = express.Router();

router.use(protect);

router.get('/', reportController.getAllReports);
router.get('/my-reports', reportController.getMyReports);
router.get('/:id', reportController.getReport);
router.post('/', validateRequest(createReportSchema), reportController.createReport);
router.patch('/:id', validateRequest(updateReportSchema), reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

module.exports = router;
