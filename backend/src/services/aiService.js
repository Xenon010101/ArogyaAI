const https = require('https');

const GEMINI_API_VERSION = 'v1beta';
const DEFAULT_MODEL = 'gemini-1.5-flash';

function buildPrompt(symptoms, userContext, fileDescriptions) {
  userContext = userContext || {};
  
  let prompt = `You are ArogyaAI, a medical AI assistant. Analyze the patient's symptoms and provide specific medical conditions.

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
ADDITIONAL INFORMATION:
${fileDescriptions.map((desc, i) => `File ${i + 1}: ${desc}`).join('\n')}
`;
  }

  prompt += `

TASK: Analyze the symptoms and return ONLY valid JSON (no markdown, no explanation):
{
  "risk_level": "low",
  "risk_explanation": "Specific explanation based on the patient's symptoms and condition",
  "summary": "Brief clinical summary of findings",
  "possible_conditions": ["Specific condition 1", "Specific condition 2", "Specific condition 3"],
  "recommendations": ["Specific recommendation 1", "Specific recommendation 2"],
  "red_flags": [],
  "confidence_score": 0.7,
  "clinical_reasoning": "Detailed explanation of how symptoms relate to possible conditions and why risk level was assigned",
  "suggested_tests": ["Test 1" | null]
}

EXAMPLES:
- Symptoms "fever and cough" → conditions: ["Common Cold", "Flu", "Respiratory Infection"]
- Symptoms "chest pain and shortness of breath" → conditions: ["Angina", "Anxiety", "Gastritis"]
- Symptoms "headache and fatigue" → conditions: ["Tension Headache", "Migraine", "Anemia"]
- Symptoms "stomach pain and nausea" → conditions: ["Gastritis", "Food Poisoning", "GERD"]

IMPORTANT:
- Provide SPECIFIC medical conditions, not generic advice
- Analyze symptoms thoroughly to determine likely diagnoses
- Provide at least 3 possible conditions`;

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
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e2) { 
        const lines = match[0].split('\n');
        const jsonPart = lines.slice(0, 30).join('\n');
        try { return JSON.parse(jsonPart); } catch (e3) { return null; }
      }
    }
    
    const tryExtract = text.match(/"possible_conditions"\s*:\s*\[(.*?)\]/i);
    if (tryExtract) {
      return { possible_conditions: tryExtract[1].split(',').map(s => s.trim().replace(/"/g, '')) };
    }
    
    return null;
  }
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
      
      console.error(`[Gemini] API Error ${response.status}:`, errMsg.substring(0, 500));

      const errLower = errMsg.toLowerCase();
      const isImageError = imageData && (
        errLower.includes('image') || 
        errLower.includes('vision') || 
        errLower.includes('unsupported') ||
        errLower.includes('does not support') ||
        errLower.includes('inline') ||
        errLower.includes('not support')
      );
      
      if (isImageError) {
        console.warn('[Gemini] Image not supported by this model, using text-only analysis...');
        return analyzeWithGemini(prompt, null, 2);
      }

      if (attempt < 2) {
        return analyzeWithGemini(prompt, imageData, attempt + 1);
      }

      return getSafeResponse();
    }

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('[Gemini] Empty response, raw:', JSON.stringify(response.data).substring(0, 200));
      if (attempt < 2) {
        return analyzeWithGemini(prompt, imageData, attempt + 1);
      }
      return getSafeResponse();
    }

    console.log('[Gemini] Raw response:', text.substring(0, 300));
    const parsed = parseJson(text);

    if (!parsed || !parsed.risk_level) {
      console.error('[Gemini] Invalid JSON or missing risk_level. Parsed:', parsed);
      if (attempt < 2) {
        return analyzeWithGemini(prompt, imageData, attempt + 1);
      }
      return getSafeResponse();
    }

    console.log('[Gemini] Analysis complete, conditions:', parsed.possible_conditions);

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
        : ['General Illness', 'Viral Infection'],
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
