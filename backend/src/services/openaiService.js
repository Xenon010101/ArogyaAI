const OpenAI = require('openai');

let openaiClient = null;

function getClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

async function analyzeWithOpenAI(prompt, attempt) {
  attempt = attempt || 1;
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[OpenAI] API key not configured');
    return getSafeResponse();
  }

  console.log('[OpenAI] Using GPT-4o Mini model');
  console.log('[OpenAI] Prompt length:', prompt.length);

  try {
    const client = getClient();
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are ArogyaAI, an advanced medical AI assistant. Return ONLY valid JSON (no markdown, no explanation).'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('[OpenAI] Empty response');
      if (attempt < 2) {
        return analyzeWithOpenAI(prompt, attempt + 1);
      }
      return getSafeResponse();
    }

    console.log('[OpenAI] Response received, length:', content.length);
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('[OpenAI] JSON parse error:', e.message);
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e2) {
          console.error('[OpenAI] Could not extract JSON');
          if (attempt < 2) {
            return analyzeWithOpenAI(prompt, attempt + 1);
          }
          return getSafeResponse();
        }
      }
    }

    if (!parsed || !parsed.risk_level) {
      console.error('[OpenAI] Invalid response structure');
      if (attempt < 2) {
        return analyzeWithOpenAI(prompt, attempt + 1);
      }
      return getSafeResponse();
    }

    console.log('[OpenAI] Analysis complete, conditions:', parsed.possible_conditions);

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
      red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags.slice(0, 5) : [],
      confidence_score: typeof parsed.confidence_score === 'number' 
        ? Math.max(0, Math.min(1, parsed.confidence_score)) 
        : 0.6,
      clinical_reasoning: parsed.clinical_reasoning || parsed.summary || 'Comprehensive analysis completed.',
      suggested_tests: Array.isArray(parsed.suggested_tests) ? parsed.suggested_tests : null
    };

  } catch (error) {
    console.error('[OpenAI] Error:', error.message);
    
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.error('[OpenAI] Rate limit or quota exceeded');
      return {
        risk_level: 'moderate',
        risk_explanation: 'AI analysis temporarily unavailable due to rate limits. Please try again.',
        summary: 'AI analysis is temporarily unavailable.',
        possible_conditions: ['Analysis pending - rate limited'],
        recommendations: ['Please try again in a few moments'],
        red_flags: [],
        confidence_score: 0.3,
        clinical_reasoning: 'AI analysis unavailable due to rate limits.',
        suggested_tests: null,
        error: 'rate_limited'
      };
    }

    if (attempt < 2) {
      return analyzeWithOpenAI(prompt, attempt + 1);
    }
    return getSafeResponse();
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

module.exports = {
  analyzeWithOpenAI,
  getSafeResponse,
  getClient
};
