const OpenAI = require('openai');

class AIService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    const config = require('../config');

    if (config.openai?.apiKey) {
      this.client = new OpenAI({
        apiKey: config.openai.apiKey,
      });
      this.initialized = true;
    }
  }

  async analyzeSymptoms(symptoms, userId) {
    this.initialize();

    if (!this.client) {
      return {
        summary: 'AI analysis unavailable. Please configure OpenAI API key.',
        recommendations: [],
        confidence: 0,
      };
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a medical symptom analyzer. Analyze the provided symptoms and provide:
1. A brief summary of potential conditions
2. General recommendations (non-medical advice disclaimer required)
3. Suggested specialist referrals if applicable

Always include: "This is not medical advice. Consult a healthcare professional."`,
          },
          {
            role: 'user',
            content: `Analyze these symptoms: ${symptoms}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return {
        summary: response.choices[0].message.content,
        recommendations: [],
        confidence: 0.7,
        model: 'gpt-4o-mini',
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }
}

module.exports = new AIService();
