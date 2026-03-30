const https = require('https');

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'mistralai/mistral-7b-instruct';

const SYSTEM_PROMPT = `You are ArogyaAI, a medical symptom analysis assistant. You must respond ONLY with valid JSON. No markdown, no text outside JSON.

Required JSON structure:
{
  "summary": "Brief analysis of symptoms",
  "possibleConditions": ["condition1", "condition2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "urgentFlag": boolean,
  "specialistSuggestion": "specialist name or null"
}

Rules:
- Always respond with valid JSON
- No markdown formatting (no \`\`\`json, no \`\`\`)
- No explanatory text outside JSON
- urgentFlag: true only if symptoms suggest emergency
- If unsure, say "consult a doctor" in recommendations
- Summary must be under 200 characters`;

function buildSymptomPrompt(symptoms, userContext = {}) {
  const age = userContext.age ? `Patient age: ${userContext.age}` : '';
  const gender = userContext.gender ? `Patient gender: ${userContext.gender}` : '';
  const medicalHistory = userContext.medicalHistory?.length
    ? `Medical history: ${userContext.medicalHistory.join(', ')}`
    : '';

  return `Analyze these symptoms and respond with ONLY JSON:
Symptoms: ${symptoms}
${age}
${gender}
${medicalHistory}`.trim();
}

async function makeApiRequest(url, options, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);

    req.setTimeout(30000, () => {
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
  let cleaned = rawResponse.trim();

  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  cleaned = cleaned.replace(/^[^{]*/, '');
  cleaned = cleaned.replace(/[^}]*$/, '');

  return cleaned.trim();
}

function parseJsonResponse(responseText) {
  const cleaned = cleanJsonResponse(responseText);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function getFallbackResponse() {
  return {
    summary: 'Unable to analyze symptoms at this time. Please consult a healthcare professional for proper evaluation.',
    possibleConditions: ['consult a doctor'],
    recommendations: [
      'Please consult a healthcare professional',
      'Provide more detailed symptoms if possible',
      'Seek immediate care for emergency symptoms',
    ],
    urgentFlag: false,
    specialistSuggestion: null,
    error: 'Analysis temporarily unavailable',
  };
}

async function callOpenRouter(symptoms, userContext = {}, retryCount = 0) {
  const config = require('../config');
  const apiKey = config.openrouter?.apiKey || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('OpenRouter API key not configured');
    return getFallbackResponse();
  }

  const url = `${OPENROUTER_BASE_URL}/chat/completions`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildSymptomPrompt(symptoms, userContext) },
  ];

  const requestBody = {
    model: DEFAULT_MODEL,
    messages,
    max_tokens: 1000,
    temperature: 0.3,
  };

  try {
    const response = await makeApiRequest(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:5000',
        'X-Title': 'ArogyaAI',
      },
    }, requestBody);

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    const content = response.data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from API');
    }

    const parsed = parseJsonResponse(content);

    if (!parsed) {
      throw new Error('Failed to parse JSON response');
    }

    return {
      summary: parsed.summary || 'Analysis complete',
      possibleConditions: Array.isArray(parsed.possibleConditions)
        ? parsed.possibleConditions
        : ['consult a doctor'],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : ['Please consult a healthcare professional'],
      urgentFlag: Boolean(parsed.urgentFlag),
      specialistSuggestion: parsed.specialistSuggestion || null,
    };
  } catch (error) {
    console.error(`OpenRouter API Error (attempt ${retryCount + 1}):`, error.message);

    if (retryCount === 0) {
      return callOpenRouter(symptoms, userContext, 1);
    }

    return getFallbackResponse();
  }
}

async function analyzeSymptoms(symptoms, userContext = {}) {
  if (!symptoms || typeof symptoms !== 'string') {
    return {
      summary: 'No symptoms provided',
      possibleConditions: [],
      recommendations: ['Please provide symptoms for analysis'],
      urgentFlag: false,
      specialistSuggestion: null,
    };
  }

  if (symptoms.length > 2000) {
    symptoms = symptoms.substring(0, 2000);
  }

  return await callOpenRouter(symptoms, userContext);
}

async function analyzeMultipleSymptoms(symptomsList, userContext = {}) {
  if (!Array.isArray(symptomsList) || symptomsList.length === 0) {
    return analyzeSymptoms('', userContext);
  }

  const combinedSymptoms = symptomsList.join('; ');
  return await analyzeSymptoms(combinedSymptoms, userContext);
}

module.exports = {
  analyzeSymptoms,
  analyzeMultipleSymptoms,
  buildSymptomPrompt,
  parseJsonResponse,
  cleanJsonResponse,
  getFallbackResponse,
  DEFAULT_MODEL,
};
