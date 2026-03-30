const { triage } = require('../utils/triage');

function analyzeSymptoms(symptoms) {
  const result = triage(symptoms);
  return result;
}

function analyzeHealthData(healthData) {
  const symptomTexts = [];

  if (healthData.symptoms && Array.isArray(healthData.symptoms)) {
    symptomTexts = symptomTexts.concat(healthData.symptoms);
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

function preDiagnosisCheck(symptoms) {
  const result = triage(symptoms);

  if (result.isEmergency) {
    return {
      isEmergency: result.isEmergency,
      flags: result.flags,
      severity: result.severity,
      recommendation: result.recommendation,
      canProceed: false,
      reason: 'Emergency symptoms detected. Please seek immediate medical help.'
    };
  }

  return {
    isEmergency: result.isEmergency,
    flags: result.flags,
    severity: result.severity,
    recommendation: result.recommendation,
    canProceed: true
  };
}

module.exports = {
  analyzeSymptoms: analyzeSymptoms,
  analyzeHealthData: analyzeHealthData,
  preDiagnosisCheck: preDiagnosisCheck
};
