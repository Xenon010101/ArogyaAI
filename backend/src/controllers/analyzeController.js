const Analysis = require('../models/Analysis');
const ApiError = require('../utils/ApiError');
const triageService = require('../services/triageService');
const aiService = require('../services/aiService');
const { processUploadedFiles, processPrescriptionsForAnalysis } = require('../services/fileService');
const clinicalLogic = require('../services/clinicalLogic');

function determineCombinedRisk(triageResult, aiResult, symptoms) {
  if (!triageResult || !aiResult) return 'moderate';
  
  const symptomsAnalysis = clinicalLogic.analyzeSymptoms(symptoms || '', triageResult);
  
  if (triageResult.isEmergency || triageResult.severity === 'critical' || 
      aiResult.risk_level === 'critical' || symptomsAnalysis.riskLevel === 'critical') {
    return 'critical';
  }

  if (triageResult.severity === 'high' || aiResult.risk_level === 'high' || symptomsAnalysis.riskLevel === 'high') {
    return 'high';
  }

  if (triageResult.severity === 'moderate' || aiResult.risk_level === 'moderate' || symptomsAnalysis.riskLevel === 'moderate') {
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

function buildCombinedInput(userSymptoms, prescriptionText) {
  let combined = userSymptoms || '';
  
  if (prescriptionText && prescriptionText.trim().length > 0) {
    combined += '\n\n[INFORMATION FROM PRESCRIPTION/DOCUMENTS]\n' + prescriptionText;
  }
  
  return combined.trim();
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
    console.log('[Analysis] Files in request:', req.files ? 
      `images: ${req.files.images?.length || 0}, prescriptions: ${req.files.prescriptions?.length || 0}` : 
      'none');
    
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

    let extractedPrescriptionText = '';
    let prescriptionExtracted = false;
    let prescriptionImageBased = false;
    
    if (processedFiles.prescriptions?.length > 0) {
      try {
        const prescriptionData = await processPrescriptionsForAnalysis(processedFiles.prescriptions);
        extractedPrescriptionText = prescriptionData.combinedText || '';
        prescriptionExtracted = extractedPrescriptionText.length > 0;
        prescriptionImageBased = prescriptionData.hasImageBasedPDF || false;
        
        if (prescriptionExtracted) {
          console.log('[Analysis] Prescription text extracted:', extractedPrescriptionText.substring(0, 200) + '...');
        } else if (prescriptionImageBased) {
          console.log('[Analysis] Prescription is image-based (scanned PDF or image)');
        } else {
          console.log('[Analysis] No text extracted from prescriptions');
        }
      } catch (prescError) {
        console.warn('[Analysis] Prescription extraction failed:', prescError.message);
      }
    } else {
      console.log('[Analysis] No prescription files to process');
    }

    const combinedInputText = buildCombinedInput(symptoms, extractedPrescriptionText);
    console.log('[Analysis] Combined input length:', combinedInputText.length);
    console.log('[Analysis] Combined input preview:', combinedInputText.substring(0, 300) + '...');

    let imageBase64 = null;
    let imageProcessed = false;
    let imageError = null;
    const hasImages = processedFiles.images && processedFiles.images.length > 0;
    
    if (hasImages) {
      console.log('[Analysis] Processing', processedFiles.images.length, 'images');
      try {
        const fs = require('fs');
        const firstImage = processedFiles.images[0];
        console.log('[Analysis] First image:', JSON.stringify(firstImage));
        
        if (firstImage && firstImage.path) {
          if (fs.existsSync(firstImage.path)) {
            const imageBuffer = fs.readFileSync(firstImage.path);
            const base64Data = imageBuffer.toString('base64');
            if (base64Data && base64Data.length > 0) {
              imageBase64 = {
                data: base64Data,
                mimeType: firstImage.mimetype || 'image/jpeg'
              };
              imageProcessed = true;
              console.log('[Analysis] Image prepared for AI:', firstImage.originalName, '- Size:', base64Data.length);
            }
          } else {
            console.log('[Analysis] Image file not found at path:', firstImage.path);
          }
        }
      } catch (imgError) {
        imageError = 'Failed to process image: ' + imgError.message;
        console.warn('[Analysis] Could not process image:', imgError.message);
      }
    } else {
      console.log('[Analysis] No images to process');
    }

    const symptomsAnalysis = clinicalLogic.analyzeSymptoms(combinedInputText || symptoms || '', triageResult, extractedPrescriptionText);
    console.log('[Analysis] Symptoms analyzed:', symptomsAnalysis);

    let aiResult;
    let imageAnalysisFailed = false;
    let prescriptionAnalysisUsed = prescriptionExtracted;
    
    try {
      aiResult = await aiService.analyzeSymptoms(combinedInputText, userContext, imageBase64, allFiles, extractedPrescriptionText);
    } catch (aiError) {
      console.error('[Analysis] AI failed:', aiError.message);
      const errMsg = aiError.message || '';
      if (imageBase64 && errMsg.toLowerCase().includes('image')) {
        imageAnalysisFailed = true;
        aiResult = await aiService.analyzeSymptoms(combinedInputText, userContext, null, allFiles, extractedPrescriptionText);
      } else {
        aiResult = aiService.getSafeResponse();
      }
    }

    const combinedRiskLevel = determineCombinedRisk(triageResult, aiResult, symptoms);
    
    const aiConditions = aiResult.possible_conditions || [];
    const validAiConditions = aiConditions.filter(c => 
      c && typeof c === 'string' && c.length > 3
    );
    
    const finalConditions = validAiConditions.length > 0
      ? validAiConditions
      : symptomsAnalysis.conditions.length > 0 
        ? symptomsAnalysis.conditions 
        : ['General Illness'];
    
    const clinicalSummary = clinicalLogic.generateSummary(combinedRiskLevel, finalConditions, symptoms);
    const clinicalReasoning = clinicalLogic.generateClinicalReasoning(symptoms, symptomsAnalysis);
    const clinicalRiskExplanation = clinicalLogic.generateRiskExplanation(combinedRiskLevel, symptomsAnalysis);
    
    const isGenericResponse = (text) => {
      if (!text || typeof text !== 'string') return true;
      const lower = text.toLowerCase();
      return lower.includes('consult a healthcare') || 
             lower.includes('professional medical') ||
             lower.includes('comprehensive analysis requires') ||
             lower.includes('please consult') ||
             text === 'Analysis complete' ||
             text.length < 20;
    };
    
    const finalSummary = !isGenericResponse(aiResult.summary) && aiResult.summary
      ? aiResult.summary 
      : clinicalSummary;
    
    const finalClinicalReasoning = !isGenericResponse(aiResult.clinical_reasoning) && aiResult.clinical_reasoning
      ? aiResult.clinical_reasoning
      : clinicalReasoning;
    
    const finalRiskExplanation = !isGenericResponse(aiResult.risk_explanation) && aiResult.risk_explanation
      ? aiResult.risk_explanation
      : clinicalRiskExplanation;
    
    const aiConfidence = aiResult.confidence_score || null;
    const finalConfidence = clinicalLogic.calculateConfidence(combinedRiskLevel, symptomsAnalysis, aiConfidence);

    const aiAnalysis = {
      risk_level: combinedRiskLevel,
      risk_explanation: finalRiskExplanation,
      summary: finalSummary,
      clinical_reasoning: finalClinicalReasoning,
      suggested_tests: aiResult.suggested_tests || null,
      conditions: finalConditions,
      recommendations: aiResult.recommendations && aiResult.recommendations.length > 0
        ? aiResult.recommendations
        : clinicalLogic.generateRecommendations(combinedRiskLevel, finalConditions),
      red_flags: clinicalLogic.generateRedFlags(combinedRiskLevel, symptomsAnalysis),
      confidence: finalConfidence,
      detected_symptoms: symptomsAnalysis.detectedSymptoms,
      recommended_specialist: clinicalLogic.recommendSpecialist(combinedInputText, triageResult, combinedRiskLevel)
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
      imageAnalysisFailed: imageAnalysisFailed,
      imageProcessed: imageProcessed,
      prescriptionExtracted: prescriptionExtracted,
      prescriptionImageBased: prescriptionImageBased,
      extractedPrescriptionText: prescriptionExtracted ? extractedPrescriptionText.substring(0, 500) : null,
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
