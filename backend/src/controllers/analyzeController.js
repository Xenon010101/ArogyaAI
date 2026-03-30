const Analysis = require('../models/Analysis');
const ApiError = require('../utils/ApiError');
const triageService = require('../services/triageService');
const aiService = require('../services/aiService');
const { processUploadedFiles } = require('../services/fileService');

function determineCombinedRisk(triageResult, aiResult) {
  if (!triageResult || !aiResult) return 'moderate';
  
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

  if (body && body.age) {
    context.age = parseInt(body.age, 10);
    if (isNaN(context.age)) context.age = undefined;
  }
  if (body && body.gender) {
    context.gender = body.gender;
  }
  if (body && body.medicalHistory) {
    context.medicalHistory = Array.isArray(body.medicalHistory)
      ? body.medicalHistory
      : String(body.medicalHistory).split(',').map(function(h) { return h.trim(); }).filter(Boolean);
  }

  return context;
}

exports.analyze = async function(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required');
    }

    const symptoms = req.body && req.body.symptoms;
    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 3) {
      throw new ApiError(400, 'Please provide a valid symptoms description (at least 3 characters)');
    }

    const userContext = buildUserContext(req.body);

    let triageResult = { isEmergency: false, severity: 'none', flags: [], recommendation: { instruction: 'No specific concerns detected' } };
    try {
      triageResult = await triageService.analyzeSymptoms(symptoms) || triageResult;
    } catch (triageError) {
      console.warn('Triage service failed:', triageError.message);
    }

    let processedFiles = { images: [], prescriptions: [], all: [] };
    try {
      processedFiles = processUploadedFiles(req.files) || processedFiles;
    } catch (fileError) {
      console.warn('File processing failed:', fileError.message);
    }
    const allFiles = processedFiles.all || [];
    
    console.log('[Analysis] Files received:', {
      images: processedFiles.images?.length || 0,
      prescriptions: processedFiles.prescriptions?.length || 0,
      total: allFiles.length
    });

    let imageBase64 = null;
    const hasImages = processedFiles.images && processedFiles.images.length > 0;
    
    if (hasImages) {
      try {
        const fs = require('fs');
        const firstImage = processedFiles.images[0];
        if (firstImage && firstImage.path) {
          const imageBuffer = fs.readFileSync(firstImage.path);
          const base64Data = imageBuffer.toString('base64');
          if (base64Data && base64Data.length > 0) {
            imageBase64 = {
              data: base64Data,
              mimeType: firstImage.mimetype || 'image/jpeg'
            };
            console.log('[Analysis] Image prepared for AI:', firstImage.originalName);
          }
        }
      } catch (imgError) {
        console.warn('[Analysis] Could not process image:', imgError.message);
      }
    }

    let aiResult;
    try {
      aiResult = await aiService.analyzeSymptoms(symptoms, userContext, imageBase64);
    } catch (aiError) {
      console.error('[Analysis] AI failed:', aiError.message);
      aiResult = aiService.getSafeResponse();
    }

    const combinedRiskLevel = determineCombinedRisk(triageResult, aiResult);

    const aiAnalysis = {
      risk_level: aiResult.risk_level || 'moderate',
      risk_explanation: aiResult.risk_explanation || '',
      summary: aiResult.summary || 'Analysis complete',
      conditions: Array.isArray(aiResult.possible_conditions) && aiResult.possible_conditions.length > 0 
        ? aiResult.possible_conditions 
        : ['Consult a doctor'],
      recommendations: Array.isArray(aiResult.recommendations) && aiResult.recommendations.length > 0 
        ? aiResult.recommendations 
        : ['Please consult a healthcare professional'],
      red_flags: Array.isArray(aiResult.red_flags) ? aiResult.red_flags : [],
      confidence: typeof aiResult.confidence_score === 'number' ? aiResult.confidence_score : 0.5
    };

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

    const responseData = {
      _id: analysis._id,
      symptoms: analysis.symptoms,
      triageResult: triageResult,
      aiAnalysis: aiAnalysis,
      combinedRiskLevel,
      files: allFiles,
      userContext,
      status: 'completed',
      createdAt: analysis.createdAt,
      analyzedAt: analysis.createdAt ? analysis.createdAt.toISOString() : new Date().toISOString(),
    };

    res.status(201).json({
      status: 'success',
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalysis = async function(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required');
    }

    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('user', 'name email');

    if (!analysis) {
      throw new ApiError(404, 'Analysis not found');
    }

    const responseData = {
      _id: analysis._id,
      symptoms: analysis.symptoms,
      triageResult: analysis.triageResult,
      aiAnalysis: analysis.aiAnalysis,
      combinedRiskLevel: analysis.combinedRiskLevel,
      files: analysis.files || [],
      userContext: analysis.userContext,
      status: analysis.status,
      createdAt: analysis.createdAt,
      analyzedAt: analysis.createdAt,
      user: analysis.user,
    };

    res.status(200).json({
      status: 'success',
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyAnalyses = async function(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required');
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };

    if (req.query.riskLevel && ['low', 'moderate', 'high', 'critical'].includes(req.query.riskLevel)) {
      filter.combinedRiskLevel = req.query.riskLevel;
    }

    if (req.query.status && ['completed', 'failed', 'pending'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const total = await Analysis.countDocuments(filter);

    const analyses = await Analysis.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        analyses: analyses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.preCheck = async function(req, res, next) {
  try {
    const symptoms = req.body && req.body.symptoms;
    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 3) {
      throw new ApiError(400, 'Please provide symptoms to check');
    }

    let triageResult = { isEmergency: false, severity: 'none', flags: [], recommendation: { instruction: 'No specific concerns detected' } };
    try {
      triageResult = await triageService.preDiagnosisCheck(symptoms) || triageResult;
    } catch (triageError) {
      console.warn('Triage pre-check failed:', triageError.message);
    }

    res.status(200).json({
      status: 'success',
      triage: triageResult,
    });
  } catch (error) {
    next(error);
  }
};
