const analyzeController = require('../controllers/analyzeController');
const { protect } = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validation');
const { analyzeSchema, preCheckSchema } = require('../validators/analyzeValidator');
const { uploadFiles } = require('../middlewares/upload');

const express = require('express');
const router = express.Router();

router.post(
  '/',
  protect,
  uploadFiles,
  validateRequest(analyzeSchema),
  analyzeController.analyze
);

router.post('/pre-check', protect, validateRequest(preCheckSchema), analyzeController.preCheck);

router.get('/my-analyses', protect, analyzeController.getMyAnalyses);
router.get('/:id', protect, analyzeController.getAnalysis);

module.exports = router;
