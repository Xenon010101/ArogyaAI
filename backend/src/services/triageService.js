const { triage } = require('../utils/triage');

class TriageService {
  async analyzeSymptoms(symptoms) {
    const result = triage(symptoms);
    return result;
  }

  async analyzeHealthData(healthData) {
    const symptomTexts = [];

    if (healthData.symptoms && Array.isArray(healthData.symptoms)) {
      symptomTexts.push(...healthData.symptoms);
    }

    if (healthData.description) {
      symptomTexts.push(healthData.description);
    }

    if (healthData.chiefComplaint) {
      symptomTexts.push(healthData.chiefComplaint);
    }

    const combinedText = symptomTexts.join(' ');

    return triage(combinedText);
  }

  async preDiagnosisCheck(symptoms) {
    const result = triage(symptoms);

    if (result.isEmergency) {
      return {
        ...result,
        canProceed: false,
        reason: 'Emergency symptoms detected. Please seek immediate medical help.',
      };
    }

    return {
      ...result,
      canProceed: true,
    };
  }
}

module.exports = new TriageService();
