const analyzeController = require('../controllers/analyzeController');
const { protect } = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validation');
const { analyzeSchema, preCheckSchema } = require('../validators/analyzeValidator');
const { uploadFiles } = require('../middlewares/upload');

const express = require('express');
const router = express.Router();

router.use(protect);

router.post(
  '/',
  uploadFiles,
  validateRequest(analyzeSchema),
  analyzeController.analyze
);

router.get('/my-analyses', analyzeController.getMyAnalyses);
router.get('/:id', analyzeController.getAnalysis);
router.post('/pre-check', validateRequest(preCheckSchema), analyzeController.preCheck);

module.exports = router;
