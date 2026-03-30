const Analysis = require('../../models/Analysis');
const ApiError = require('../../utils/ApiError');
const triageService = require('../../services/triageService');
const aiService = require('../../services/aiService');

async function processFiles(files) {
  if (!files || files.length === 0) {
    return [];
  }

  return files.map((file) => ({
    fileName: file.originalname,
    fileUrl: `/uploads/${file.originalname}`,
    fileType: file.mimetype,
    fileSize: file.size,
  }));
}

function determineCombinedRisk(triageResult, aiResult) {
  if (triageResult.isEmergency || triageResult.severity === 'critical') {
    return 'critical';
  }

  if (triageResult.severity === 'high' || aiResult.urgentFlag) {
    return 'high';
  }

  if (triageResult.severity === 'moderate') {
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
      : body.medicalHistory.split(',').map((h) => h.trim());
  }

  return context;
}

exports.analyze = async (req, res, next) => {
  try {
    const { symptoms } = req.body;
    const userContext = buildUserContext(req.body);

    const triageResult = await triageService.analyzeSymptoms(symptoms);

    const files = await processFiles(req.files);

    let aiResult;
    try {
      aiResult = await aiService.analyzeSymptoms(symptoms, userContext);
    } catch (aiError) {
      console.error('AI analysis failed:', aiError.message);
      aiResult = aiService.getFallbackResponse();
    }

    const combinedRiskLevel = determineCombinedRisk(triageResult, aiResult);

    const analysis = await Analysis.create({
      user: req.user.id,
      symptoms: symptoms.trim(),
      triageResult,
      aiAnalysis: {
        summary: aiResult.summary,
        possibleConditions: aiResult.possibleConditions || [],
        recommendations: aiResult.recommendations || [],
        urgentFlag: aiResult.urgentFlag || false,
        specialistSuggestion: aiResult.specialistSuggestion || null,
      },
      combinedRiskLevel,
      files,
      userContext,
      status: 'completed',
    });

    res.status(201).json({
      status: 'success',
      data: {
        id: analysis._id,
        triage: triageResult,
        ai: {
          summary: aiResult.summary,
          possibleConditions: aiResult.possibleConditions,
          recommendations: aiResult.recommendations,
          urgentFlag: aiResult.urgentFlag,
          specialistSuggestion: aiResult.specialistSuggestion,
        },
        combinedRiskLevel,
        files,
        analyzedAt: analysis.createdAt,
        disclaimer: 'This analysis is for informational purposes only and does not constitute medical advice. Always consult a healthcare professional.',
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalysis = async (req, res, next) => {
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
      data: { analysis },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyAnalyses = async (req, res, next) => {
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
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: { analyses },
    });
  } catch (error) {
    next(error);
  }
};

exports.preCheck = async (req, res, next) => {
  try {
    const { symptoms } = req.body;
    const triageResult = await triageService.preDiagnosisCheck(symptoms);

    res.status(200).json({
      status: 'success',
      data: { triage: triageResult },
    });
  } catch (error) {
    next(error);
  }
};
