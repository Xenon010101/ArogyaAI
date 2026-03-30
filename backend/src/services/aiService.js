const https = require('https');

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'models/gemini-1.5-flash';

const SYSTEM_PROMPT = 'You are ArogyaAI, a medical symptom analysis assistant. Respond ONLY with valid JSON - no markdown, no text outside JSON.\n\nRequired JSON structure:\n{\n  "risk_level": "low" | "moderate" | "high" | "critical",\n  "summary": "Brief analysis of symptoms (under 200 characters)",\n  "conditions": ["condition1", "condition2"],\n  "recommendations": ["recommendation1", "recommendation2"],\n  "red_flags": ["warning sign 1", "warning sign 2"],\n  "confidence": 0.85\n}\n\nRules:\n- risk_level: "low" (minor symptoms), "moderate" (concerning symptoms), "high" (serious symptoms), "critical" (emergency)\n- Always include all fields in the response\n- red_flags: empty array [] if no red flags detected\n- confidence: 0.0 to 1.0 (higher = more confident)\n- No markdown formatting, no explanatory text';

function buildSymptomPrompt(symptoms, userContext) {
  userContext = userContext || {};
  var age = userContext.age ? 'Patient age: ' + userContext.age : '';
  var gender = userContext.gender ? 'Patient gender: ' + userContext.gender : '';
  var medicalHistory = '';
  if (userContext.medicalHistory && userContext.medicalHistory.length) {
    medicalHistory = 'Medical history: ' + userContext.medicalHistory.join(', ');
  }

  return 'Analyze these symptoms and respond with ONLY valid JSON:\nSymptoms: ' + symptoms + '\n' + age + '\n' + gender + '\n' + medicalHistory;
}

function makeApiRequest(url, body) {
  return new Promise(function(resolve, reject) {
    var urlObj = require('url').parse(url);
    var requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    var req = https.request(requestOptions, function(res) {
      var data = '';

      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    req.setTimeout(60000, function() {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

function cleanJsonResponse(rawResponse) {
  var cleaned = rawResponse.trim();
  cleaned = cleaned.replace(/^```json\s*/gi, '');
  cleaned = cleaned.replace(/^```\s*/gi, '');
  cleaned = cleaned.replace(/\s*```$/gi, '');
  cleaned = cleaned.replace(/^[^{]*/, '');
  cleaned = cleaned.replace(/[^}]*$/, '');
  return cleaned.trim();
}

function parseJsonResponse(responseText) {
  var cleaned = cleanJsonResponse(responseText);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    var jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

function normalizeRiskLevel(level) {
  var l = String(level).toLowerCase();
  if (['critical', 'emergency'].includes(l)) return 'critical';
  if (['high', 'serious'].includes(l)) return 'high';
  if (['moderate', 'medium'].includes(l)) return 'moderate';
  return 'low';
}

function getFallbackResponse() {
  return {
    risk_level: 'moderate',
    summary: 'Analysis temporarily unavailable. Please consult a healthcare professional.',
    conditions: ['Consult a doctor'],
    recommendations: [
      'Please consult a healthcare professional',
      'Provide more detailed symptoms if possible',
      'Seek immediate care for emergency symptoms'
    ],
    red_flags: [],
    confidence: 0.0
  };
}

async function callGemini(symptoms, userContext, retryCount, imageBase64) {
  retryCount = retryCount || 0;

  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Gemini API key not configured');
    return getFallbackResponse();
  }

  var model = 'gemini-1.5-flash';
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;

  var textPrompt = buildSymptomPrompt(symptoms, userContext);

  var contents = [];

  if (imageBase64) {
    contents.push({
      role: 'user',
      parts: [
        { text: textPrompt },
        {
          inlineData: {
            mimeType: imageBase64.mimeType || 'image/jpeg',
            data: imageBase64.data
          }
        }
      ]
    });
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: textPrompt }]
    });
  }

  var requestBody = {
    contents: contents,
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.3,
      responseMimeType: 'application/json'
    },
    systemInstruction: {
      parts: [{ text: 'You are ArogyaAI medical assistant. ALWAYS respond with ONLY valid JSON matching this exact structure: {"risk_level":"low|moderate|high|critical","summary":"text under 200 chars","conditions":["item1"],"recommendations":["item1"],"red_flags":["item1"],"confidence":0.5} - no markdown, no text outside JSON.' }]
    }
  };

  try {
    var response = await makeApiRequest(url, requestBody);

    if (response.status !== 200) {
      var errorMsg = response.data.error ? response.data.error.message : JSON.stringify(response.data);
      console.error('Gemini API Error:', response.status, errorMsg);
      
      if (imageBase64 && (errorMsg.includes('image') || errorMsg.includes('vision'))) {
        console.warn('Vision not supported, falling back to text-only');
        return await callGemini(symptoms, userContext, 1, null);
      }
      
      if (retryCount === 0) {
        return await callGemini(symptoms, userContext, 1, imageBase64);
      }
      return getFallbackResponse();
    }

    var content = response.data.candidates &&
                  response.data.candidates[0] &&
                  response.data.candidates[0].content &&
                  response.data.candidates[0].content.parts &&
                  response.data.candidates[0].content.parts[0] &&
                  response.data.candidates[0].content.parts[0].text;

    if (!content) {
      console.error('Empty response from Gemini API');
      if (retryCount === 0) {
        return await callGemini(symptoms, userContext, 1, imageBase64);
      }
      return getFallbackResponse();
    }

    var parsed = parseJsonResponse(content);

    if (!parsed) {
      console.error('Failed to parse JSON:', content.substring(0, 200));
      if (retryCount === 0) {
        return await callGemini(symptoms, userContext, 1, imageBase64);
      }
      return getFallbackResponse();
    }

    return {
      risk_level: normalizeRiskLevel(parsed.risk_level),
      summary: String(parsed.summary || 'Analysis complete').substring(0, 200),
      conditions: Array.isArray(parsed.conditions) ? parsed.conditions : ['Consult a doctor'],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Please consult a healthcare professional'],
      red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5
    };
  } catch (error) {
    console.error('Gemini API Error (attempt ' + (retryCount + 1) + '):', error.message);
    
    if (imageBase64 && error.message && error.message.includes('image')) {
      console.warn('Falling back to text-only analysis');
      return await callGemini(symptoms, userContext, 1, null);
    }
    
    if (retryCount === 0) {
      return await callGemini(symptoms, userContext, 1, imageBase64);
    }
    return getFallbackResponse();
  }
}

async function analyzeSymptoms(symptoms, userContext, imageBase64) {
  if (!symptoms || typeof symptoms !== 'string') {
    return {
      risk_level: 'moderate',
      summary: 'No symptoms provided',
      conditions: [],
      recommendations: ['Please provide symptoms for analysis'],
      red_flags: [],
      confidence: 0.0
    };
  }

  if (symptoms.length > 2000) {
    symptoms = symptoms.substring(0, 2000);
  }

  return await callGemini(symptoms, userContext || {}, 0, imageBase64);
}

async function analyzeMultipleSymptoms(symptomsList, userContext) {
  if (!Array.isArray(symptomsList) || symptomsList.length === 0) {
    return await analyzeSymptoms('', userContext);
  }

  var combinedSymptoms = symptomsList.join('; ');
  return await analyzeSymptoms(combinedSymptoms, userContext);
}

module.exports = {
  analyzeSymptoms: analyzeSymptoms,
  analyzeMultipleSymptoms: analyzeMultipleSymptoms,
  buildSymptomPrompt: buildSymptomPrompt,
  parseJsonResponse: parseJsonResponse,
  cleanJsonResponse: cleanJsonResponse,
  getFallbackResponse: getFallbackResponse,
  DEFAULT_MODEL: DEFAULT_MODEL
};
