const https = require('https');

const GEMINI_API_VERSION = 'v1beta';
const DEFAULT_MODEL = 'gemini-1.5-flash';

function buildPrompt(symptoms, userContext, fileDescriptions) {
  userContext = userContext || {};
  
  let prompt = `You are ArogyaAI, an advanced medical AI assistant. Analyze the patient's health information comprehensively.

PATIENT CONTEXT:
`;
  
  if (userContext.age) prompt += `- Age: ${userContext.age}\n`;
  if (userContext.gender) prompt += `- Gender: ${userContext.gender}\n`;
  if (userContext.medicalHistory && userContext.medicalHistory.length) {
    prompt += `- Medical History: ${userContext.medicalHistory.join(', ')}\n`;
  }

  prompt += `
SYMPTOMS REPORTED:
${symptoms || 'No text symptoms provided'}

`;
  
  if (fileDescriptions && fileDescriptions.length > 0) {
    prompt += `
ADDITIONAL INFORMATION FROM UPLOADED FILES:
${fileDescriptions.map((desc, i) => `File ${i + 1}: ${desc}`).join('\n')}
`;
  }

  prompt += `

TASK:
Analyze ALL information provided above and return a comprehensive clinical assessment in JSON format:
{
  "risk_level": "low" | "moderate" | "high" | "critical",
  "risk_explanation": "Detailed explanation of why this risk level was assigned based on symptoms, images, and documents",
  "summary": "Comprehensive clinical summary combining all data sources (max 200 chars)",
  "possible_conditions": ["condition1", "condition2", "condition3"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"],
  "red_flags": ["warning sign 1" | null if none],
  "confidence_score": 0.0-1.0,
  "clinical_reasoning": "Explain how symptoms, uploaded images (if any), and documents led to your assessment",
  "suggested_tests": ["suggested diagnostic test 1" | null if none]
}

CRITICAL RULES:
- Risk level: "critical" (life-threatening), "high" (serious), "moderate" (concerning), "low" (minor)
- ALWAYS analyze images for visible symptoms (rash, swelling, discoloration, wounds)
- ALWAYS consider content from uploaded PDFs/documents
- If image shows medical concern, reflect it in possible_conditions and risk_level
- confidence_score: 0.0-1.0 (higher = more confident)
- Provide at least 2 possible_conditions when symptoms are provided
- red_flags: array of warning signs or empty array []
- Include clinical_reasoning explaining how you reached your conclusion`;

  return prompt;
}

function makeRequest(url, body) {
  return new Promise(function(resolve, reject) {
    const urlObj = require('url').parse(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.path,
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
  cleaned = cleaned.replace(/^```json\s*/gi, '').replace(/^```\s*/gi, '').replace(/\s*```$/gi, '');
  cleaned = cleaned.replace(/^[^{\n]*/, '').replace(/[^}\n]*$/, '');
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e2) { return null; }
    }
    return null;
  }
}

function getSafeResponse() {
  return {
    risk_level: 'moderate',
    risk_explanation: 'Analysis completed based on available information. Please consult a healthcare provider for detailed evaluation.',
    summary: 'Based on the information provided, a moderate risk level is assigned. Professional medical consultation is recommended.',
    possible_conditions: ['Consult a healthcare professional'],
    recommendations: [
      'Please consult a doctor for proper diagnosis',
      'Monitor symptoms and note any changes',
      'Seek immediate care if symptoms worsen'
    ],
    red_flags: [],
    confidence_score: 0.5,
    clinical_reasoning: 'A comprehensive analysis requires professional medical examination. This AI assessment is for informational purposes only.',
    suggested_tests: null
  };
}

async function analyzeWithGemini(prompt, imageData, attempt) {
  attempt = attempt || 1;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Gemini] API key not configured');
    return getSafeResponse();
  }

  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey}`;

  console.log(`[Gemini] Attempt ${attempt}: ${imageData ? 'Multimodal (text+image)' : 'Text-only'}`);

  let contents = [];
  
  if (imageData && attempt === 1) {
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
    const response = await makeRequest(url, body);

    if (response.status !== 200) {
      const errData = response.data;
      let errMsg = 'Unknown error';
      
      if (errData && typeof errData === 'object') {
        errMsg = errData.error?.message || JSON.stringify(errData);
      } else if (typeof errData === 'string') {
        errMsg = errData;
      }
      
      console.error(`[Gemini] API Error ${response.status}:`, errMsg.substring(0, 300));

      const errLower = errMsg.toLowerCase();
      const isImageError = imageData && (
        errLower.includes('image') || 
        errLower.includes('vision') || 
        errLower.includes('unsupported') ||
        errLower.includes('does not support') ||
        errLower.includes('inline')
      );
      
      if (isImageError) {
        console.warn('[Gemini] Image not supported, using text-only analysis...');
        return analyzeWithGemini(prompt, null, 2);
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

    const parsed = parseJson(text);

    if (!parsed || !parsed.risk_level) {
      console.error('[Gemini] Invalid JSON, retrying...');
      if (attempt < 2) {
        return analyzeWithGemini(prompt, imageData, attempt + 1);
      }
      return getSafeResponse();
    }

    console.log('[Gemini] Analysis complete');

    const riskLevel = String(parsed.risk_level).toLowerCase();
    const normalizedRisk = ['critical', 'emergency'].includes(riskLevel) ? 'critical' :
                          ['high', 'serious'].includes(riskLevel) ? 'high' :
                          ['moderate', 'medium'].includes(riskLevel) ? 'moderate' : 'low';

    return {
      risk_level: normalizedRisk,
      risk_explanation: String(parsed.risk_explanation || parsed.summary || 'Analysis complete').substring(0, 400),
      summary: String(parsed.summary || parsed.risk_explanation || 'Analysis complete').substring(0, 200),
      possible_conditions: Array.isArray(parsed.possible_conditions) && parsed.possible_conditions.length > 0 
        ? parsed.possible_conditions.slice(0, 5) 
        : ['Consult a doctor'],
      recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0 
        ? parsed.recommendations.slice(0, 5) 
        : ['Please consult a healthcare professional'],
      red_flags: Array.isArray(parsed.red_flags) && parsed.red_flags.length > 0 ? parsed.red_flags.slice(0, 5) : [],
      confidence_score: typeof parsed.confidence_score === 'number' 
        ? Math.max(0, Math.min(1, parsed.confidence_score)) 
        : 0.6,
      clinical_reasoning: parsed.clinical_reasoning || parsed.summary || 'Comprehensive analysis completed.',
      suggested_tests: Array.isArray(parsed.suggested_tests) ? parsed.suggested_tests : null
    };

  } catch (error) {
    console.error(`[Gemini] Error:`, error.message);
    
    if (attempt < 2) {
      return analyzeWithGemini(prompt, imageData, attempt + 1);
    }

    return getSafeResponse();
  }
}

async function analyzeSymptoms(symptoms, userContext, imageBase64, uploadedFiles) {
  if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 3) {
    if (!imageBase64 && (!uploadedFiles || uploadedFiles.length === 0)) {
      return {
        risk_level: 'moderate',
        risk_explanation: 'Insufficient information provided for analysis.',
        summary: 'Please provide symptoms text or upload images/documents for analysis.',
        possible_conditions: [],
        recommendations: ['Please describe your symptoms or upload relevant medical documents'],
        red_flags: [],
        confidence_score: 0.0,
        clinical_reasoning: 'Not enough information to provide a reliable assessment.',
        suggested_tests: null
      };
    }
  }

  symptoms = symptoms ? symptoms.trim() : '';
  if (symptoms.length > 2000) {
    symptoms = symptoms.substring(0, 2000);
  }

  let fileDescriptions = [];
  if (uploadedFiles && uploadedFiles.length > 0) {
    uploadedFiles.forEach(file => {
      if (file.category === 'prescription') {
        fileDescriptions.push(`Prescription/Document: ${file.originalName || file.fileName}`);
      } else if (file.category === 'image' && file !== imageBase64) {
        fileDescriptions.push(`Image provided: ${file.originalName || file.fileName}`);
      }
    });
  }

  const prompt = buildPrompt(symptoms, userContext, fileDescriptions);

  console.log('[Gemini] Starting comprehensive analysis...');
  console.log('[Gemini] Text length:', symptoms.length);
  console.log('[Gemini] Has image:', !!imageBase64);
  console.log('[Gemini] Files:', fileDescriptions.length);

  return await analyzeWithGemini(prompt, imageBase64, 1);
}

module.exports = {
  analyzeSymptoms: analyzeSymptoms,
  getSafeResponse: getSafeResponse,
  DEFAULT_MODEL: DEFAULT_MODEL
};
