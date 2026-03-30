const https = require('https');

const GEMINI_API_VERSION = 'v1beta';
const DEFAULT_MODEL = 'gemini-1.5-flash';

function buildPrompt(symptoms, userContext) {
  userContext = userContext || {};
  
  let context = '';
  if (userContext.age) context += `Patient age: ${userContext.age}\n`;
  if (userContext.gender) context += `Patient gender: ${userContext.gender}\n`;
  if (userContext.medicalHistory && userContext.medicalHistory.length) {
    context += `Medical history: ${userContext.medicalHistory.join(', ')}\n`;
  }

  return `You are ArogyaAI, a medical symptom analysis assistant.

CONTEXT:
${context}

SYMPTOMS:
${symptoms}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "risk_level": "low" | "moderate" | "high" | "critical",
  "risk_explanation": "Brief explanation of the risk assessment",
  "summary": "Brief analysis summary (under 200 chars)",
  "possible_conditions": ["condition1", "condition2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "red_flags": ["warning sign 1"],
  "confidence_score": 0.85
}

Rules:
- risk_level: "critical" (emergency), "high" (serious), "moderate" (concerning), "low" (minor)
- confidence_score: 0.0 to 1.0
- red_flags: empty array [] if none
- Always include all fields with valid data`;
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
    req.setTimeout(90000, function() { req.destroy(); reject(new Error('Request timeout')); });
    
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
    risk_explanation: 'Analysis completed with standard assessment. Please consult a healthcare provider for detailed evaluation.',
    summary: 'Based on the symptoms provided, a moderate risk level is assigned. Professional medical consultation is recommended.',
    possible_conditions: ['Consult a healthcare professional'],
    recommendations: [
      'Please consult a doctor for proper diagnosis',
      'Monitor symptoms and seek care if they worsen',
      'Keep track of any changes in your condition'
    ],
    red_flags: [],
    confidence_score: 0.5
  };
}

async function analyzeWithGemini(symptoms, userContext, imageData, attempt) {
  attempt = attempt || 1;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Gemini] API key not configured');
    return getSafeResponse();
  }

  const model = imageData ? 'gemini-1.5-flash' : 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey}`;

  const prompt = buildPrompt(symptoms, userContext);
  
  let contents = [];
  
  if (imageData) {
    console.log(`[Gemini] Attempt ${attempt}: Using image + text input`);
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
    console.log(`[Gemini] Attempt ${attempt}: Using text-only input`);
    contents = [{
      role: 'user',
      parts: [{ text: prompt }]
    }];
  }

  const body = {
    contents: contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      topP: 0.8,
      topK: 40
    }
  };

  try {
    console.log(`[Gemini] Sending request to ${model}...`);
    const response = await makeRequest(url, body);

    if (response.status !== 200) {
      const errMsg = response.data?.error?.message || JSON.stringify(response.data);
      console.error(`[Gemini] API Error ${response.status}:`, errMsg);

      const errLower = errMsg.toLowerCase();
      
      if (imageData && (
        errLower.includes('image') || 
        errLower.includes('vision') || 
        errLower.includes('unsupported') ||
        errLower.includes('does not support') ||
        errLower.includes('inline data')
      )) {
        console.warn('[Gemini] Image not supported, retrying without image...');
        return analyzeWithGemini(symptoms, userContext, null, attempt + 1);
      }

      if (attempt < 2) {
        console.warn('[Gemini] Retrying request...');
        return analyzeWithGemini(symptoms, userContext, imageData, attempt + 1);
      }

      return getSafeResponse();
    }

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('[Gemini] Empty response received');
      if (attempt < 2) {
        return analyzeWithGemini(symptoms, userContext, imageData, attempt + 1);
      }
      return getSafeResponse();
    }

    const parsed = parseJson(text);

    if (!parsed || !parsed.risk_level) {
      console.error('[Gemini] Invalid JSON response:', text.substring(0, 200));
      if (attempt < 2) {
        return analyzeWithGemini(symptoms, userContext, imageData, attempt + 1);
      }
      return getSafeResponse();
    }

    console.log('[Gemini] Successfully parsed response');

    const riskLevel = String(parsed.risk_level).toLowerCase();
    const normalizedRisk = ['critical', 'emergency'].includes(riskLevel) ? 'critical' :
                          ['high', 'serious'].includes(riskLevel) ? 'high' :
                          ['moderate', 'medium'].includes(riskLevel) ? 'moderate' : 'low';

    return {
      risk_level: normalizedRisk,
      risk_explanation: String(parsed.risk_explanation || parsed.summary || 'Analysis complete').substring(0, 300),
      summary: String(parsed.summary || parsed.risk_explanation || 'Analysis complete').substring(0, 200),
      possible_conditions: Array.isArray(parsed.possible_conditions) && parsed.possible_conditions.length > 0 
        ? parsed.possible_conditions.slice(0, 5) 
        : ['Consult a doctor'],
      recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0 
        ? parsed.recommendations.slice(0, 5) 
        : ['Please consult a healthcare professional'],
      red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags.slice(0, 5) : [],
      confidence_score: typeof parsed.confidence_score === 'number' 
        ? Math.max(0, Math.min(1, parsed.confidence_score)) 
        : 0.7
    };

  } catch (error) {
    console.error(`[Gemini] Error (attempt ${attempt}):`, error.message);

    const errLower = error.message.toLowerCase();
    if (imageData && (
      errLower.includes('image') || 
      errLower.includes('vision') || 
      errLower.includes('unsupported') ||
      errLower.includes('does not support')
    )) {
      console.warn('[Gemini] Image error, falling back to text-only...');
      return analyzeWithGemini(symptoms, userContext, null, attempt + 1);
    }

    if (attempt < 2) {
      return analyzeWithGemini(symptoms, userContext, imageData, attempt + 1);
    }

    return getSafeResponse();
  }
}

async function analyzeSymptoms(symptoms, userContext, imageBase64) {
  if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 3) {
    return {
      risk_level: 'moderate',
      risk_explanation: 'Insufficient symptom information provided.',
      summary: 'Please provide more detailed symptoms for accurate analysis.',
      possible_conditions: [],
      recommendations: ['Please describe your symptoms in detail'],
      red_flags: [],
      confidence_score: 0.0
    };
  }

  symptoms = symptoms.trim();
  if (symptoms.length > 2000) {
    symptoms = symptoms.substring(0, 2000);
  }

  console.log('[Gemini] Starting analysis...');
  console.log('[Gemini] Symptoms length:', symptoms.length);
  console.log('[Gemini] Has image:', !!imageBase64);

  return await analyzeWithGemini(symptoms, userContext || {}, imageBase64, 1);
}

module.exports = {
  analyzeSymptoms: analyzeSymptoms,
  getSafeResponse: getSafeResponse,
  DEFAULT_MODEL: DEFAULT_MODEL
};
