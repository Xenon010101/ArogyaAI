const symptomConditionMapping = {
  fever: ['Viral Infection', 'Flu', 'Common Cold'],
  cough: ['Respiratory Infection', 'Bronchitis', 'Common Cold'],
  headache: ['Tension Headache', 'Migraine', 'Sinusitis'],
  chest_pain: ['Possible Cardiac Issue', 'Muscle Strain', 'Gastritis'],
  breathing: ['Respiratory Distress', 'Asthma', 'Anxiety'],
  stomach_pain: ['Gastritis', 'Food Poisoning', 'Indigestion'],
  nausea: ['Gastroenteritis', 'Food Poisoning', 'Migraine'],
  vomiting: ['Gastroenteritis', 'Food Poisoning', 'Motion Sickness'],
  fatigue: ['Viral Infection', 'Anemia', 'Sleep Deprivation'],
  dizziness: ['Low Blood Pressure', 'Dehydration', 'Inner Ear Issue'],
  sore_throat: ['Strep Throat', 'Common Cold', 'Allergies'],
  body_ache: ['Viral Infection', 'Flu', 'Muscle Strain'],
  diarrhea: ['Food Poisoning', 'Gastroenteritis', 'IBS'],
  rash: ['Allergic Reaction', 'Skin Infection', 'Eczema'],
  swelling: ['Allergic Reaction', 'Injury', 'Infection'],
  weakness: ['Fatigue', 'Nutritional Deficiency', 'Neurological Issue'],
  numbness: ['Nerve Compression', 'Poor Circulation', 'Neurological Issue'],
};

const symptomRiskMapping = {
  chest_pain: { level: 'critical', weight: 10, reason: 'Chest pain is a high-risk symptom' },
  breathing: { level: 'critical', weight: 9, reason: 'Difficulty breathing requires immediate attention' },
  unconscious: { level: 'critical', weight: 10, reason: 'Unconsciousness is a medical emergency' },
  seizure: { level: 'critical', weight: 10, reason: 'Seizure activity requires emergency care' },
  severe_bleeding: { level: 'critical', weight: 10, reason: 'Severe bleeding requires immediate medical help' },
  stroke: { level: 'critical', weight: 10, reason: 'Stroke symptoms require emergency intervention' },
  high_fever: { level: 'high', weight: 7, reason: 'High fever indicates serious infection' },
  poisoning: { level: 'critical', weight: 10, reason: 'Poisoning requires immediate treatment' },
  head_injury: { level: 'high', weight: 8, reason: 'Head injury may indicate concussion' },
  severe_pain: { level: 'high', weight: 7, reason: 'Severe pain requires medical evaluation' },
  fever: { level: 'moderate', weight: 4, reason: 'Fever indicates possible infection' },
  cough: { level: 'low', weight: 2, reason: 'Cough is often due to minor respiratory issues' },
  headache: { level: 'low', weight: 2, reason: 'Headache is commonly due to tension or dehydration' },
  sore_throat: { level: 'low', weight: 2, reason: 'Sore throat is often viral' },
  fatigue: { level: 'low', weight: 2, reason: 'Fatigue may be due to rest or minor illness' },
  nausea: { level: 'moderate', weight: 3, reason: 'Nausea may indicate digestive issues' },
  dizziness: { level: 'moderate', weight: 4, reason: 'Dizziness requires evaluation' },
  body_ache: { level: 'moderate', weight: 3, reason: 'Body aches often accompany viral illness' },
};

function analyzeSymptoms(symptoms, triageResult) {
  const normalizedSymptoms = symptoms.toLowerCase();
  const detectedSymptoms = [];
  const conditions = new Set();
  let totalRiskScore = 0;
  let riskReasons = [];

  for (const [keyword, info] of Object.entries(symptomRiskMapping)) {
    if (normalizedSymptoms.includes(keyword.replace('_', ' '))) {
      detectedSymptoms.push(keyword);
      totalRiskScore += info.weight;
      riskReasons.push(info.reason);
    }
  }

  for (const [keyword, conditionList] of Object.entries(symptomConditionMapping)) {
    if (normalizedSymptoms.includes(keyword.replace('_', ' '))) {
      conditionList.forEach(c => conditions.add(c));
    }
  }

  if (conditions.size === 0) {
    if (normalizedSymptoms.length > 10) {
      conditions.add('Possible Infection');
      conditions.add('General Illness');
    } else {
      conditions.add('Insufficient Information');
    }
  }

  let riskLevel = 'low';
  if (totalRiskScore >= 20 || triageResult?.isEmergency) {
    riskLevel = 'critical';
  } else if (totalRiskScore >= 10) {
    riskLevel = 'high';
  } else if (totalRiskScore >= 5) {
    riskLevel = 'moderate';
  }

  const conditionArray = Array.from(conditions).slice(0, 3);
  
  return {
    detectedSymptoms,
    conditions: conditionArray,
    riskLevel,
    totalRiskScore,
    riskReasons
  };
}

function generateClinicalReasoning(symptoms, analysis) {
  const { detectedSymptoms, conditions, riskLevel, riskReasons, totalRiskScore } = analysis;
  
  if (detectedSymptoms.length === 0) {
    return 'Based on the symptoms provided, a general assessment was conducted. Further medical evaluation is recommended for accurate diagnosis.';
  }

  const symptomList = detectedSymptoms.map(s => s.replace('_', ' ')).join(', ');
  
  let reasoning = `The symptoms reported (${symptomList}) were analyzed. `;
  
  if (riskReasons.length > 0) {
    reasoning += riskReasons[0];
    if (riskReasons.length > 1) {
      reasoning += `. Additionally, ${riskReasons.slice(1).join('. ')}.`;
    }
  }
  
  if (conditions.length > 0) {
    reasoning += ` Based on symptom pattern, possible conditions include: ${conditions.join(', ')}.`;
  }
  
  reasoning += ` Total risk assessment score: ${totalRiskScore}/30.`;
  
  return reasoning;
}

function generateRiskExplanation(riskLevel, analysis) {
  const { detectedSymptoms, riskReasons, totalRiskScore } = analysis;
  
  const explanations = {
    critical: `Critical risk level assigned due to presence of high-risk symptoms. ${riskReasons[0] || 'Immediate medical attention required.'} Total symptom severity score: ${totalRiskScore}.`,
    high: `High risk level due to concerning symptoms. ${riskReasons[0] || 'Medical evaluation recommended.'} Total symptom severity score: ${totalRiskScore}.`,
    moderate: `Moderate risk level based on reported symptoms. ${riskReasons[0] || 'Monitor symptoms and consider medical consultation.'} Total symptom severity score: ${totalRiskScore}.`,
    low: `Current symptoms suggest a minor condition. ${riskReasons[0] || 'Rest and self-care recommended.'} Monitor for any changes. Total symptom severity score: ${totalRiskScore}.`
  };
  
  return explanations[riskLevel] || explanations.moderate;
}

function generateSummary(riskLevel, conditions, symptoms) {
  const condText = conditions.length > 0 ? conditions.slice(0, 2).join(' or ') : 'undetermined condition';
  
  const summaries = {
    critical: `Your symptoms suggest a potentially serious condition. ${capitalizeFirst(condText)} is among the possible diagnoses. Immediate medical consultation is strongly recommended.`,
    high: `Based on your symptoms, there may be a significant health concern. ${capitalizeFirst(condText)} is among the possible conditions. Medical evaluation within 24 hours is advised.`,
    moderate: `Your symptoms indicate a moderate health concern. ${capitalizeFirst(condText)} is among the possible diagnoses. Scheduling a medical appointment is recommended.`,
    low: `Your symptoms appear to indicate a minor condition. ${capitalizeFirst(condText)} may be the cause. Rest and symptom monitoring are advised.`
  };
  
  return summaries[riskLevel] || summaries.moderate;
}

function generateRecommendations(riskLevel, conditions) {
  const base = {
    critical: [
      'Seek immediate emergency medical care',
      'Call emergency services or go to nearest hospital',
      'Do not delay seeking treatment',
      'Bring this analysis report to the medical facility'
    ],
    high: [
      'Schedule immediate medical appointment (within 24 hours)',
      'Consider visiting an urgent care center',
      'Monitor symptoms closely for any worsening',
      'Prepare to describe symptoms accurately to doctor'
    ],
    moderate: [
      'Schedule a medical appointment within 2-3 days',
      'Rest and stay hydrated',
      'Monitor symptoms and note any changes',
      'Seek earlier care if symptoms worsen'
    ],
    low: [
      'Rest and maintain hydration',
      'Monitor symptoms for 2-3 days',
      'Consider over-the-counter remedies for symptom relief',
      'Consult a doctor if symptoms persist beyond a week'
    ]
  };
  
  return base[riskLevel] || base.moderate;
}

function generateRedFlags(riskLevel, analysis) {
  const flags = [];
  
  if (riskLevel === 'critical') {
    flags.push('High-risk symptoms detected - immediate care required');
    if (analysis.detectedSymptoms.includes('chest_pain')) {
      flags.push('Chest pain may indicate cardiac emergency');
    }
    if (analysis.detectedSymptoms.includes('breathing')) {
      flags.push('Difficulty breathing requires urgent attention');
    }
  }
  
  if (riskLevel === 'high') {
    flags.push('Symptoms warrant urgent medical evaluation');
    if (analysis.totalRiskScore > 7) {
      flags.push('Multiple concerning symptoms present');
    }
  }
  
  return flags;
}

function calculateConfidence(riskLevel, analysis, hasAiConfidence) {
  if (hasAiConfidence) {
    return hasAiConfidence;
  }
  
  let baseConfidence = 0.5;
  
  if (analysis.detectedSymptoms.length >= 3) {
    baseConfidence += 0.15;
  } else if (analysis.detectedSymptoms.length >= 1) {
    baseConfidence += 0.1;
  }
  
  if (analysis.totalRiskScore >= 10) {
    baseConfidence += 0.1;
  }
  
  if (riskLevel === 'low' || riskLevel === 'moderate') {
    baseConfidence += 0.1;
  }
  
  return Math.min(0.95, Math.max(0.3, baseConfidence));
}

function getConfidenceText(confidence) {
  if (confidence >= 0.8) {
    return 'High confidence based on clear symptom pattern';
  } else if (confidence >= 0.6) {
    return 'Moderate confidence based on available symptom data';
  } else if (confidence >= 0.4) {
    return 'Lower confidence - limited symptom information';
  } else {
    return 'Limited confidence - more symptoms would help';
  }
}

function getConfidenceLabel(confidence) {
  if (confidence >= 0.7) return 'High';
  if (confidence >= 0.4) return 'Moderate';
  return 'Low';
}

function recommendSpecialist(symptoms, triageResult, riskLevel) {
  const normalized = symptoms.toLowerCase();
  
  if (normalized.includes('chest') || normalized.includes('heart') || normalized.includes('cardiac')) {
    return 'Cardiologist';
  }
  if (normalized.includes('breath') || normalized.includes('lung') || normalized.includes('asthma')) {
    return 'Pulmonologist';
  }
  if (normalized.includes('head') || normalized.includes('neuro') || normalized.includes('stroke') || normalized.includes('seizure')) {
    return 'Neurologist';
  }
  if (normalized.includes('skin') || normalized.includes('rash') || normalized.includes('allergy')) {
    return 'Dermatologist';
  }
  if (normalized.includes('stomach') || normalized.includes('digest') || normalized.includes('intestinal')) {
    return 'Gastroenterologist';
  }
  if (normalized.includes('bone') || normalized.includes('joint') || normalized.includes('muscle')) {
    return 'Orthopedic Specialist';
  }
  if (normalized.includes('diabetes') || normalized.includes('sugar') || normalized.includes('thyroid')) {
    return 'Endocrinologist';
  }
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    return 'Emergency Medicine';
  }
  
  return 'General Physician';
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  analyzeSymptoms,
  generateClinicalReasoning,
  generateRiskExplanation,
  generateSummary,
  generateRecommendations,
  generateRedFlags,
  calculateConfidence,
  getConfidenceText,
  getConfidenceLabel,
  recommendSpecialist,
  symptomConditionMapping,
  symptomRiskMapping
};
