const Analysis = require('../models/Analysis');
const ApiError = require('../utils/ApiError');
const triageService = require('../services/triageService');
const aiService = require('../services/aiService');
const { processUploadedFiles } = require('../services/fileService');

function determineCombinedRisk(triageResult, aiResult) {
  if (triageResult.isEmergency || triageResult.severity === 'critical' || aiResult.risk_level === 'critical') {
    return 'critical';
  }

  if (triageResult.severity === 'high' || aiResult.risk_level === 'high') {
    return 'high';
  }

  if (triageResult.severity === 'moderate' || aiResult.risk_level === 'moderate') {
    return 'moderate';
  }

  return 'low';
}

function buildUserContext(body) {
  const context = {};

  if (body.age) {
    context.age = parseInt(body.age, 10);
  }
  if (body.gender) {
    context.gender = body.gender;
  }
  if (body.medicalHistory) {
    context.medicalHistory = Array.isArray(body.medicalHistory)
      ? body.medicalHistory
      : body.medicalHistory.split(',').map(function(h) { return h.trim(); });
  }

  return context;
}

exports.analyze = async function(req, res, next) {
  try {
    const symptoms = req.body.symptoms;
    const userContext = buildUserContext(req.body);

    const triageResult = await triageService.analyzeSymptoms(symptoms);

    const processedFiles = processUploadedFiles(req.files);
    const allFiles = processedFiles.all;

    let imageBase64 = null;
    if (processedFiles.images && processedFiles.images.length > 0) {
      try {
        const fs = require('fs');
        const firstImage = processedFiles.images[0];
        if (firstImage.path) {
          const imageBuffer = fs.readFileSync(firstImage.path);
          imageBase64 = {
            data: imageBuffer.toString('base64'),
            mimeType: firstImage.mimetype || 'image/jpeg'
          };
        }
      } catch (imgError) {
        console.warn('Could not process image for AI:', imgError.message);
      }
    }

    let aiResult;
    try {
      aiResult = await aiService.analyzeSymptoms(symptoms, userContext, imageBase64);
    } catch (aiError) {
      console.error('AI analysis failed:', aiError.message);
      aiResult = {
        risk_level: 'moderate',
        summary: 'Analysis temporarily unavailable. Please consult a healthcare professional.',
        conditions: ['Consult a doctor'],
        recommendations: ['Please consult a healthcare professional', 'Seek immediate care for emergency symptoms'],
        red_flags: [],
        confidence: 0.0
      };
    }

    const combinedRiskLevel = determineCombinedRisk(triageResult, aiResult);

    const aiAnalysis = {
      risk_level: aiResult.risk_level || 'moderate',
      summary: aiResult.summary || 'Analysis complete',
      conditions: Array.isArray(aiResult.conditions) && aiResult.conditions.length > 0 ? aiResult.conditions : ['Consult a doctor'],
      recommendations: Array.isArray(aiResult.recommendations) && aiResult.recommendations.length > 0 ? aiResult.recommendations : ['Please consult a healthcare professional'],
      red_flags: Array.isArray(aiResult.red_flags) ? aiResult.red_flags : [],
      confidence: typeof aiResult.confidence === 'number' ? aiResult.confidence : 0.5
    };

    const combinedRiskLevel = determineCombinedRisk(triageResult, aiResult);

    const analysis = await Analysis.create({
      user: req.user.id,
      symptoms: symptoms.trim(),
      triageResult,
      aiAnalysis: aiAnalysis,
      combinedRiskLevel,
      files: allFiles,
      userContext,
      status: 'completed',
    });

    res.status(201).json({
      status: 'success',
      data: {
        id: analysis._id,
        triage: triageResult,
        ai: aiAnalysis,
        combinedRiskLevel,
        files: {
          images: processedFiles.images,
          prescriptions: processedFiles.prescriptions,
        },
        analyzedAt: analysis.createdAt || new Date().toISOString(),
        disclaimer: 'This analysis is for informational purposes only and does not constitute medical advice. Always consult a healthcare professional.',
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalysis = async function(req, res, next) {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('user', 'name email');

    if (!analysis) {
      throw new ApiError(404, 'Analysis not found');
    }

    res.status(200).json({
      status: 'success',
      data: { analysis: analysis },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyAnalyses = async function(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };

    if (req.query.riskLevel) {
      filter.combinedRiskLevel = req.query.riskLevel;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await Analysis.countDocuments(filter);

    const analyses = await Analysis.find(filter)
      .select('-triageResult -aiAnalysis')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      status: 'success',
      results: analyses.length,
      total: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: { analyses: analyses },
    });
  } catch (error) {
    next(error);
  }
};

exports.preCheck = async function(req, res, next) {
  try {
    const symptoms = req.body.symptoms;
    const triageResult = await triageService.preDiagnosisCheck(symptoms);

    res.status(200).json({
      status: 'success',
      data: { triage: triageResult },
    });
  } catch (error) {
    next(error);
  }
};
