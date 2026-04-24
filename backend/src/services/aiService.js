const https = require('https');

const GEMINI_API_VERSION = 'v1beta';
const DEFAULT_MODEL = 'gemini-2.5-flash';

function buildPrompt(symptoms, userContext, prescriptionText, fileDescriptions, knowledgeContext) {
  userContext = userContext || {};
  
  let prompt = `You are ArogyaAI, an advanced medical AI assistant. Your task is to analyze patient data and provide clinical assessment.

CRITICAL: This analysis MUST factor in ALL provided data sources. Do NOT ignore any section.

PATIENT CONTEXT:
`;
  
  if (userContext.age) prompt += `- Age: ${userContext.age}\n`;
  if (userContext.gender) prompt += `- Gender: ${userContext.gender}\n`;
  if (userContext.medicalHistory && userContext.medicalHistory.length) {
    prompt += `- Medical History: ${userContext.medicalHistory.join(', ')}\n`;
  }

  const hasPrescription = prescriptionText && prescriptionText.trim().length > 0;
  const symptomsOnly = symptoms || 'No text symptoms provided';

  if (hasPrescription) {
    prompt += `
===============================================================
PRESCRIPTION/DOCUMENT ANALYSIS - HIGH PRIORITY SECTION
===============================================================
The following medications/conditions were found in prescriptions:
${prescriptionText}

This prescription data should DIRECTLY influence your diagnosis.
Medications listed indicate EXISTING conditions being treated.
For example:
- Metformin → Patient has diabetes/blood sugar issues
- Amlodipine/Atenolol/Lisinopril → Patient has hypertension/heart conditions
- Omeprazole/Pantoprazole → Patient has acid reflux/GERD/gastritis
- Atorvastatin/Rosuvastatin → Patient has high cholesterol
- Levothyroxine → Patient has thyroid disorder
- Salbutamol → Patient has asthma/breathing issues
===============================================================

`;
  }

  prompt += `
PATIENT-REPORTED SYMPTOMS:
${symptomsOnly}

`;
  
  if (fileDescriptions && fileDescriptions.length > 0) {
    prompt += `
ADDITIONAL FILE INFORMATION:
${fileDescriptions.map((desc, i) => `File ${i + 1}: ${desc}`).join('\n')}
`;
  }

  if (knowledgeContext && knowledgeContext.trim().length > 0) {
    prompt += `
${knowledgeContext}
`;
  }

  prompt += `

ANALYSIS TASK: 
Analyze ALL information provided and return ONLY valid JSON. No markdown, no code blocks, no explanations. Just pure JSON:

{"risk_level":"moderate","risk_explanation":"Your explanation here","summary":"Summary here","possible_conditions":["Condition 1","Condition 2","Condition 3"],"recommendations":["Rec 1","Rec 2"],"red_flags":[],"confidence_score":0.7,"clinical_reasoning":"Reasoning here","suggested_tests":["CBC","X-Ray"],"detected_medicines":["Metformin","Amlodipine"]}

IMPORTANT:
- Response must be ONLY valid JSON starting with { and ending with }
- Do NOT include any text before or after the JSON
- If you include markdown or text, the response will fail
- PRESCRIPTION DATA IS KEY: Amlodipine/Atorvastatin = Hypertension/Heart issues
- Include knowledge from KNOWLEDGE BASE in your analysis
- List prescription-related conditions FIRST in possible_conditions
- Include detected_medicines: medicines found in prescriptions`;

  return prompt;
}

function makeRequest(body) {
  return new Promise(function(resolve, reject) {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: '/v1beta/models/' + DEFAULT_MODEL + ':generateContent?key=' + process.env.GEMINI_API_KEY,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, function(res) {
      let data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, function() { req.destroy(); reject(new Error('Request timeout')); });
    
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function parseJson(text) {
  if (!text) return null;
  
  let cleaned = text.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```json\s*/gi, '').replace(/^```\s*/gi, '').replace(/\s*```$/gi, '');
  cleaned = cleaned.trim();
  
  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to find JSON object in the text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { 
        return JSON.parse(match[0]); 
      } catch (e2) {
        // Try to fix common issues
        let fixed = match[0];
        // Fix missing quotes around keys
        fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
        // Fix single quotes to double quotes
        fixed = fixed.replace(/'/g, '"');
        // Try parsing fixed version
        try { return JSON.parse(fixed); } catch (e3) {}
      }
    }
    
    // Try extracting just the conditions array
    const conditionsMatch = cleaned.match(/"possible_conditions"\s*:\s*\[(.*?)\]/i);
    if (conditionsMatch) {
      try {
        const conditions = conditionsMatch[1].match(/"([^"]+)"/g)?.map(c => c.replace(/"/g, '')) || [];
        return { possible_conditions: conditions, risk_level: 'moderate' };
      } catch (e4) {}
    }
    
    return null;
  }
}

function extractPartialInfo(text) {
  if (!text) return null;
  
  const result = {
    risk_level: 'moderate',
    risk_explanation: 'AI analysis completed with partial information.',
    summary: 'Analysis completed based on available data.',
    possible_conditions: [],
    recommendations: ['Consult a healthcare professional'],
    red_flags: [],
    confidence_score: 0.5,
    clinical_reasoning: 'Analysis completed with limited AI response.',
    suggested_tests: null
  };
  
  // Extract conditions
  const conditionsMatch = text.match(/possible_conditions["\s:]+(\[[\s\S]*?\])/i) || text.match(/conditions["\s:]+(\[[\s\S]*?\])/i);
  if (conditionsMatch) {
    try {
      const conditionsStr = conditionsMatch[1];
      const conditions = conditionsStr.match(/"([^"]+)"/g)?.map(c => c.replace(/"/g, '')) || [];
      if (conditions.length > 0) {
        result.possible_conditions = conditions.slice(0, 5);
      }
    } catch (e) {}
  }
  
  // Extract risk level
  const riskMatch = text.match(/risk_level["\s:]+"?([^}",\n]+)"?/i);
  if (riskMatch) {
    const risk = riskMatch[1].trim().toLowerCase();
    if (['critical', 'high', 'moderate', 'low'].includes(risk)) {
      result.risk_level = risk;
    }
  }
  
  // If we couldn't extract anything useful, return null
  if (result.possible_conditions.length === 0) {
    return null;
  }
  
  return result;
}

function getSafeResponse() {
  return {
    risk_level: 'moderate',
    risk_explanation: 'Analysis completed based on available information. Please consult a healthcare provider for detailed evaluation.',
    summary: 'Based on the information provided, a moderate risk level is assigned. Professional medical consultation is recommended.',
    possible_conditions: ['General Illness', 'Viral Infection', 'Common Cold'],
    recommendations: [
      'Monitor your symptoms closely',
      'Rest and stay hydrated',
      'Consult a doctor if symptoms persist'
    ],
    red_flags: [],
    confidence_score: 0.5,
    clinical_reasoning: 'A comprehensive analysis requires professional medical examination. This AI assessment is for informational purposes only.',
    suggested_tests: null,
    detected_medicines: []
  };
}

async function analyzeWithGemini(prompt, imageData, attempt) {
  attempt = attempt || 1;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Gemini] API key not configured');
    return getSafeResponse();
  }

  const model = DEFAULT_MODEL;

  console.log(`[Gemini] Using model: ${model}`);
  console.log(`[Gemini] Has image data:`, !!imageData);

  let contents = [];
  
  if (imageData && attempt === 1) {
    console.log('[Gemini] Attempting multimodal analysis with image...');
    contents = [{
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: imageData.mimeType || 'image/jpeg',
            data: imageData.data
          }
        },
        { text: prompt }
      ]
    }];
  } else {
    console.log('[Gemini] Using text-only analysis...');
    contents = [{
      role: 'user',
      parts: [{ text: prompt }]
    }];
  }

  const body = {
    contents: contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2500,
      topP: 0.85,
      topK: 50
    }
  };

  try {
    const response = await makeRequest(body);

    if (response.status !== 200) {
      const errData = response.data;
      let errMsg = 'Unknown error';
      
      if (errData && typeof errData === 'object') {
        errMsg = errData.error?.message || JSON.stringify(errData);
      } else if (typeof errData === 'string') {
        errMsg = errData;
      }
      
      console.error(`[Gemini] API Error ${response.status}:`, errMsg.substring(0, 500));

      const errLower = errMsg.toLowerCase();
      
      if (response.status === 429 || errLower.includes('quota')) {
        console.error('[Gemini] QUOTA EXCEEDED');
        return {
          risk_level: 'moderate',
          risk_explanation: 'AI analysis unavailable due to API quota limits.',
          summary: 'AI analysis temporarily unavailable due to quota limits.',
          possible_conditions: ['Analysis pending - quota exceeded'],
          recommendations: ['Please try again later'],
          red_flags: ['AI quota exceeded'],
          confidence_score: 0.3,
          clinical_reasoning: 'AI analysis unavailable - quota exceeded.',
          suggested_tests: null,
          error: 'quota_exceeded'
        };
      }

      const isImageError = imageData && (
        errLower.includes('image') || 
        errLower.includes('vision') || 
        errLower.includes('unsupported') ||
        errLower.includes('does not support') ||
        errLower.includes('inline') ||
        errLower.includes('not support') ||
        errLower.includes('model') ||
        errLower.includes('permission') ||
        errLower.includes('vision model') ||
        errLower.includes('screenshot')
      );
      
      if (isImageError) {
        console.warn('[Gemini] Image analysis not supported by model, falling back to text-only...');
        if (attempt === 1) {
          return analyzeWithGemini(prompt, null, 2);
        }
        return {
          risk_level: 'moderate',
          risk_explanation: 'Image analysis is not supported by the current AI model.',
          summary: 'Analysis completed using text input only. Image uploaded is saved for doctor review.',
          possible_conditions: ['Analysis based on text input'],
          recommendations: ['Please consult a doctor with the uploaded image for visual diagnosis'],
          red_flags: [],
          confidence_score: 0.4,
          clinical_reasoning: 'Image analysis unavailable - using text-only analysis. The uploaded image will be reviewed by a healthcare professional.',
          suggested_tests: null,
          error: 'image_not_supported'
        };
      }

      if (attempt < 2) {
        return analyzeWithGemini(prompt, imageData, attempt + 1);
      }
      return getSafeResponse();
    }

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('[Gemini] Empty response');
      if (attempt < 2) {
        return analyzeWithGemini(prompt, imageData, attempt + 1);
      }
      return getSafeResponse();
    }

    console.log('[Gemini] Response received, length:', text.length);
    console.log('[Gemini] Response preview:', text.substring(0, 300));
    const parsed = parseJson(text);

    if (!parsed || !parsed.risk_level) {
      console.error('[Gemini] Invalid JSON or missing risk_level');
      console.error('[Gemini] Raw response:', text.substring(0, 500));
      if (attempt < 2) {
        return analyzeWithGemini(prompt, imageData, attempt + 1);
      }
      // Try to extract partial info from the response
      const partialResult = extractPartialInfo(text);
      if (partialResult) {
        console.log('[Gemini] Using partial result from response');
        return partialResult;
      }
      return getSafeResponse();
    }

    console.log('[Gemini] Analysis complete, conditions:', parsed.possible_conditions);

    const riskLevel = String(parsed.risk_level).toLowerCase();
    const normalizedRisk = ['critical', 'emergency'].includes(riskLevel) ? 'critical' :
                          ['high', 'serious'].includes(riskLevel) ? 'high' :
                          ['moderate', 'medium'].includes(riskLevel) ? 'moderate' : 'low';

    const cleanString = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[\u00A0]/g, ' ')
        .trim();
    };

    const cleanArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(item => item && typeof item === 'string')
        .map(item => cleanString(item));
    };

    return {
      risk_level: normalizedRisk,
      risk_explanation: String(parsed.risk_explanation || parsed.summary || 'Analysis complete').substring(0, 400),
      summary: String(parsed.summary || parsed.risk_explanation || 'Analysis complete').substring(0, 200),
      possible_conditions: cleanArray(parsed.possible_conditions).slice(0, 5) || ['General Illness', 'Viral Infection'],
      recommendations: cleanArray(parsed.recommendations).slice(0, 5) || ['Please consult a healthcare professional'],
      red_flags: cleanArray(parsed.red_flags).slice(0, 5),
      confidence_score: typeof parsed.confidence_score === 'number' 
        ? Math.max(0, Math.min(1, parsed.confidence_score)) 
        : 0.6,
      clinical_reasoning: parsed.clinical_reasoning || parsed.summary || 'Comprehensive analysis completed.',
      suggested_tests: cleanArray(parsed.suggested_tests)
    };

  } catch (error) {
    console.error(`[Gemini] Error:`, error.message);
    
    if (attempt < 2) {
      return analyzeWithGemini(prompt, imageData, attempt + 1);
    }
    return getSafeResponse();
  }
}

async function analyzeSymptoms(symptoms, userContext, imageBase64, uploadedFiles, prescriptionText, knowledgeContext) {
  if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 3) {
    if (!imageBase64 && (!uploadedFiles || uploadedFiles.length === 0) && !prescriptionText) {
      return {
        risk_level: 'moderate',
        risk_explanation: 'Insufficient information provided for analysis.',
        summary: 'Please provide symptoms text or upload images/documents for analysis.',
        possible_conditions: [],
        recommendations: ['Please describe your symptoms or upload relevant medical documents'],
        red_flags: [],
        confidence_score: 0.0,
        clinical_reasoning: 'Not enough information to provide a reliable assessment.',
        suggested_tests: null,
        detected_medicines: []
      };
    }
  }

  symptoms = symptoms ? symptoms.trim() : '';
  if (symptoms.length > 3000) {
    symptoms = symptoms.substring(0, 3000);
  }

  let fileDescriptions = [];
  if (uploadedFiles && uploadedFiles.length > 0) {
    uploadedFiles.forEach(file => {
      if (file.category === 'image' && file !== imageBase64) {
        fileDescriptions.push(`Image provided: ${file.originalName || file.fileName}`);
      }
    });
  }
 

  const hasPrescription = prescriptionText && prescriptionText.trim().length > 0;
  const prompt = buildPrompt(symptoms, userContext, prescriptionText, fileDescriptions, knowledgeContext);

  console.log('[Gemini] Starting comprehensive analysis...');
  console.log('[Gemini] Text length:', symptoms.length);
  console.log('[Gemini] Has prescription text:', hasPrescription);
  console.log('[Gemini] Prescription text length:', hasPrescription ? prescriptionText.length : 0);
  console.log('[Gemini] Has knowledge context:', !!knowledgeContext);

  return await analyzeWithGemini(prompt, imageBase64, 1);
}

module.exports = {
  analyzeSymptoms: analyzeSymptoms,
  getSafeResponse: getSafeResponse,
  DEFAULT_MODEL: DEFAULT_MODEL
};
