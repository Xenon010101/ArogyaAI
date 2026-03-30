const aiService = require('../services/aiService');
const triageService = require('../services/triageService');

exports.analyzeSymptoms = async (req, res, next) => {
  try {
    const { symptoms, userId } = req.body;

    if (!symptoms || typeof symptoms !== 'string') {
      return res.status(400).json({
        status: 'fail',
        message: 'Symptoms text is required',
      });
    }

    const triageResult = await triageService.preDiagnosisCheck(symptoms);

    const analysis = await aiService.analyzeSymptoms(symptoms, userId);

    res.status(200).json({
      status: 'success',
      data: {
        triage: triageResult,
        analysis,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getHealthInsights = async (req, res, next) => {
  try {
    const { healthData } = req.body;

    const triageResult = await triageService.analyzeHealthData(healthData);

    res.status(200).json({
      status: 'success',
      data: {
        triage: triageResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.preCheck = async (req, res, next) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({
        status: 'fail',
        message: 'Symptoms are required',
      });
    }

    const result = await triageService.preDiagnosisCheck(symptoms);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
