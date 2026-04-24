const Analysis = require('../models/Analysis');
const ApiError = require('../utils/ApiError');
const triageService = require('../services/triageService');
const aiService = require('../services/aiService');
const { processUploadedFiles } = require('../services/fileService');
const hfService = require('../services/huggingfaceService');
const clinicalLogic = require('../services/clinicalLogic');
const drugInteractionService = require('../services/drugInteractionService');
const ragService = require('../services/ragService');

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

    console.log('========================================');
    console.log('[ANALYZE] Starting new analysis request');
    console.log('[ANALYZE] req.files:', req.files ? JSON.stringify({
      images: req.files.images?.length || 0,
      prescriptions: req.files.prescriptions?.length || 0
    }) : 'undefined');
    console.log('========================================');

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
    
    console.log('[ANALYZE] Before processUploadedFiles - req.files.images:', req.files?.images?.length);
    console.log('[ANALYZE] Before processUploadedFiles - req.files.prescriptions:', req.files?.prescriptions?.length);
    
    try {
      processedFiles = processUploadedFiles(req.files) || processedFiles;
    } catch (fileError) {
      console.warn('File processing failed:', fileError.message);
    }
    const allFiles = processedFiles.all || [];
    
    console.log('[ANALYZE] After processing - Images:', processedFiles.images.length, 'Prescriptions:', processedFiles.prescriptions.length);

    // Process prescriptions with Hugging Face OCR
    let extractedPrescriptionText = '';
    let prescriptionExtracted = false;
    let prescriptionImageBased = false;
    let prescriptionFilesCount = processedFiles.prescriptions?.length || 0;
    let hfOcrUsed = false;
    
    if (prescriptionFilesCount > 0) {
      console.log('[ANALYZE] Processing', prescriptionFilesCount, 'prescription files with Hugging Face OCR...');
      
      const allPrescriptionTexts = [];
      
      for (const prescFile of processedFiles.prescriptions) {
        console.log('[ANALYZE] Processing prescription:', prescFile.originalName);
        
        try {
          // Try Hugging Face OCR first
          const hfResult = await hfService.processPrescriptionFile(prescFile.path);
          
          if (hfResult && hfResult.success && hfResult.text) {
            allPrescriptionTexts.push(hfResult.text);
            hfOcrUsed = true;
            console.log('[ANALYZE] HF OCR extracted', hfResult.text.length, 'chars using', hfResult.model);
          } else if (hfResult && hfResult.text) {
            // HF returned text but not full extraction
            if (hfResult.text.length > 10) {
              allPrescriptionTexts.push(hfResult.text);
              console.log('[ANALYZE] HF returned partial text:', hfResult.text.length, 'chars');
            }
          }
        } catch (hfError) {
          console.warn('[ANALYZE] HF OCR failed for', prescFile.originalName, ':', hfError.message);
        }
      }
      
      if (allPrescriptionTexts.length > 0) {
        extractedPrescriptionText = allPrescriptionTexts.join('\n\n---\n\n');
        prescriptionExtracted = extractedPrescriptionText.length > 0;
        console.log('[ANALYZE] Combined prescription text length:', extractedPrescriptionText.length);
        console.log('[ANALYZE] Text preview:', extractedPrescriptionText.substring(0, 150) + '...');
      } else {
        // Fallback to fileService if HF fails
        console.log('[ANALYZE] HF OCR did not extract text, trying fallback...');
        try {
          const { processPrescriptionsForAnalysis } = require('../services/fileService');
          const prescriptionData = await processPrescriptionsForAnalysis(processedFiles.prescriptions);
          if (prescriptionData.extractedTexts && prescriptionData.extractedTexts.length > 0) {
            extractedPrescriptionText = prescriptionData.combinedText || '';
            prescriptionExtracted = extractedPrescriptionText.length > 0;
            prescriptionImageBased = prescriptionData.hasImageBasedPDF || false;
          }
        } catch (fallbackError) {
          console.warn('[ANALYZE] Fallback prescription extraction also failed:', fallbackError.message);
        }
      }
    }

    // Process images
    let imageBase64 = null;
    let imageProcessed = false;
    let imageError = null;
    const hasImages = processedFiles.images && processedFiles.images.length > 0;
    
    if (hasImages) {
      console.log('[ANALYZE] Processing', processedFiles.images.length, 'image files...');
      try {
        const fs = require('fs');
        const firstImage = processedFiles.images[0];
        
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
              console.log('[ANALYZE] Image prepared for AI:', firstImage.originalName, '- Base64 size:', base64Data.length);
            }
          } else {
            console.log('[ANALYZE] Image file NOT found:', firstImage.path);
          }
        }
      } catch (imgError) {
        imageError = 'Failed to process image: ' + imgError.message;
        console.warn('[ANALYZE] Could not process image:', imgError.message);
      }
    }

    // Build combined input
    const combinedInputText = buildCombinedInput(symptoms, extractedPrescriptionText);
    console.log('[ANALYZE] Combined input length:', combinedInputText.length);
    console.log('[ANALYZE] Symptoms length:', symptoms.length);
    console.log('[ANALYZE] Prescription text length:', extractedPrescriptionText.length);

    // Analyze symptoms
    const symptomsAnalysis = clinicalLogic.analyzeSymptoms(combinedInputText || symptoms || '', triageResult, extractedPrescriptionText);
    console.log('[ANALYZE] Symptoms analysis:', JSON.stringify(symptomsAnalysis));

    // RAG: Retrieve relevant medical knowledge
    let knowledgeContext = '';
    let retrievedKnowledge = [];
    try {
      console.log('[ANALYZE] Retrieving relevant knowledge...');
      retrievedKnowledge = await ragService.retrieveRelevantKnowledge(
        symptoms,
        symptomsAnalysis.conditions,
        extractedPrescriptionText
      );
      if (retrievedKnowledge.length > 0) {
        knowledgeContext = ragService.buildKnowledgeContext(retrievedKnowledge);
        console.log('[ANALYZE] Retrieved', retrievedKnowledge.length, 'knowledge chunks');
      }
    } catch (ragError) {
      console.warn('[ANALYZE] RAG retrieval failed:', ragError.message);
    }

    // Call AI
    let aiResult;
    let imageAnalysisFailed = false;
    
    console.log('[ANALYZE] Calling AI service...');
    console.log('[ANALYZE] - Combined text length:', combinedInputText.length);
    console.log('[ANALYZE] - Image prepared:', !!imageBase64);
    
    try {
      aiResult = await aiService.analyzeSymptoms(combinedInputText, userContext, imageBase64, allFiles, extractedPrescriptionText, knowledgeContext);
      console.log('[ANALYZE] AI result received:', aiResult.risk_level);
      if (aiResult.error === 'quota_exceeded') {
        console.warn('[ANALYZE] AI quota exceeded - using clinical logic fallback');
      }
      if (aiResult.error === 'image_not_supported' && imageBase64) {
        imageAnalysisFailed = true;
        console.warn('[ANALYZE] Image analysis not supported - falling back to text-only');
      }
    } catch (aiError) {
      console.error('[ANALYZE] AI failed:', aiError.message);
      if (imageBase64) {
        imageAnalysisFailed = true;
      }
      aiResult = aiService.getSafeResponse();
    }

    // Check drug interactions after AI analysis (from both PDF text and AI-detected medicines)
    let drugInteractionResult = null;
    const hasPrescriptionContent = extractedPrescriptionText?.length > 10 || prescriptionFilesCount > 0;
    if (hasPrescriptionContent) {
      console.log('[ANALYZE] Checking for drug interactions...');
      try {
        const medsFromPdf = clinicalLogic.extractMedicinesFromText(extractedPrescriptionText);
        const medsFromAi = aiResult.detected_medicines || [];
        const allMeds = [...new Set([...medsFromPdf, ...medsFromAi])];
        
        if (allMeds.length >= 2) {
          console.log('[ANALYZE] Medicines found:', allMeds.join(', '));
          drugInteractionResult = await drugInteractionService.checkDrugInteractions(allMeds);
          if (drugInteractionResult) {
            console.log('[ANALYZE] Drug interaction result:', drugInteractionResult.hasInteractions ? 'interactions found' : 'no interactions');
          }
        } else if (allMeds.length === 1) {
          console.log('[ANALYZE] Only 1 medicine found:', allMeds[0], '- skipping interaction check');
        } else {
          console.log('[ANALYZE] No medicines found in prescription - skipping interaction check');
        }
      } catch (interactionError) {
        console.warn('[ANALYZE] Drug interaction check failed:', interactionError.message);
      }
    }

    const combinedRiskLevel = determineCombinedRisk(triageResult, aiResult, symptoms);
    
    let aiConditions = aiResult.possible_conditions || [];
    if (aiResult.error === 'quota_exceeded') {
      aiConditions = [];
    }
    const validAiConditions = aiConditions.filter(c => 
      c && typeof c === 'string' && c.length > 3 && !c.includes('quota')
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
      recommended_specialist: clinicalLogic.recommendSpecialist(combinedInputText, triageResult, combinedRiskLevel),
      drug_interactions: drugInteractionResult ? {
        has_interactions: drugInteractionResult.hasInteractions,
        has_high_severity: drugInteractionResult.hasHighSeverity,
        interactions: drugInteractionResult.interactions || [],
        summary: drugInteractionResult.summary,
        checked_medicines: drugInteractionResult.checkedMedicines || []
      } : null
    };

    const analysis = await Analysis.create({
      user: req.user.id,
      symptoms: symptoms.trim(),
      triageResult,
      aiAnalysis: aiAnalysis,
      combinedRiskLevel,
      files: allFiles,
      userContext,
      drugInteractions: drugInteractionResult,
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
      prescriptionFilesCount: prescriptionFilesCount,
      prescriptionExtracted: prescriptionExtracted,
      prescriptionImageBased: prescriptionImageBased,
      prescriptionAnalyzed: prescriptionExtracted || prescriptionImageBased,
      extractedPrescriptionText: extractedPrescriptionText.length > 0 ? extractedPrescriptionText.substring(0, 500) : null,
      drugInteractions: drugInteractionResult
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
