const symptomConditionMapping = {
  fever: ['Viral Infection', 'Flu', 'Common Cold'],
  high_fever: ['Serious Infection', 'Flu', 'COVID-19'],
  cough: ['Respiratory Infection', 'Bronchitis', 'Common Cold'],
  headache: ['Tension Headache', 'Migraine', 'Sinusitis'],
  chest_pain: ['Possible Cardiac Issue', 'Muscle Strain', 'Gastritis'],
  heart_pain: ['Cardiac Issue', 'Angina', 'Muscle Strain'],
  breathing: ['Respiratory Distress', 'Asthma', 'Anxiety'],
  shortness_of_breath: ['Respiratory Issue', 'Asthma', 'Heart Problem'],
  breathlessness: ['Respiratory Distress', 'Anxiety', 'Heart Condition'],
  stomach_pain: ['Gastritis', 'Food Poisoning', 'Indigestion'],
  abdominal_pain: ['Gastritis', 'Appendicitis', 'Digestive Issue'],
  nausea: ['Gastroenteritis', 'Food Poisoning', 'Migraine'],
  vomiting: ['Gastroenteritis', 'Food Poisoning', 'Motion Sickness'],
  fatigue: ['Viral Infection', 'Anemia', 'Sleep Deprivation'],
  tiredness: ['Viral Infection', 'Anemia', 'Depression'],
  dizziness: ['Low Blood Pressure', 'Dehydration', 'Inner Ear Issue'],
  lightheaded: ['Dehydration', 'Low Blood Pressure', 'Anemia'],
  sore_throat: ['Strep Throat', 'Common Cold', 'Allergies'],
  throat_pain: ['Strep Throat', 'Common Cold', 'Tonsillitis'],
  body_ache: ['Viral Infection', 'Flu', 'Muscle Strain'],
  body_pain: ['Viral Infection', 'Flu', 'Muscle Strain'],
  muscle_pain: ['Muscle Strain', 'Viral Infection', 'Fibromyalgia'],
  diarrhea: ['Food Poisoning', 'Gastroenteritis', 'IBS'],
  loose_stool: ['Gastroenteritis', 'Food Intolerance', 'IBS'],
  rash: ['Allergic Reaction', 'Skin Infection', 'Eczema'],
  skin_rash: ['Allergic Reaction', 'Viral Rash', 'Eczema'],
  swelling: ['Allergic Reaction', 'Injury', 'Infection'],
  weakness: ['Fatigue', 'Nutritional Deficiency', 'Neurological Issue'],
  numbness: ['Nerve Compression', 'Poor Circulation', 'Neurological Issue'],
  back_pain: ['Muscle Strain', 'Herniated Disc', 'Kidney Issue'],
  joint_pain: ['Arthritis', 'Joint Inflammation', 'Gout'],
  anxiety: ['Anxiety Disorder', 'Stress', 'Panic Disorder'],
  stress: ['Stress', 'Anxiety', 'Depression'],
  insomnia: ['Sleep Disorder', 'Stress', 'Depression'],
  loss_of_appetite: ['Digestive Issue', 'Infection', 'Depression'],
  diabetes: ['Diabetes', 'Blood Sugar Issues', 'Metabolic Disorder'],
  hypertension: ['High Blood Pressure', 'Hypertension', 'Cardiovascular Risk'],
  thyroid: ['Thyroid Disorder', 'Hypothyroidism', 'Hyperthyroidism'],
};

const prescriptionConditionMapping = {
  // Diabetes medications
  metformin: ['Diabetes', 'Type 2 Diabetes', 'Blood Sugar Management'],
  metformin_hcl: ['Diabetes', 'Type 2 Diabetes', 'Blood Sugar'],
  glucophage: ['Diabetes', 'Type 2 Diabetes', 'Blood Sugar'],
  glycomet: ['Diabetes', 'Type 2 Diabetes', 'Blood Sugar'],
  ciomet: ['Diabetes', 'Type 2 Diabetes', 'Blood Sugar'],
  insulin: ['Diabetes', 'Type 1 Diabetes', 'Blood Sugar Control'],
  humulin: ['Diabetes', 'Blood Sugar Control'],
  mixtard: ['Diabetes', 'Blood Sugar Control'],
  novomix: ['Diabetes', 'Blood Sugar Control'],
  glimepiride: ['Diabetes', 'Type 2 Diabetes', 'Blood Sugar'],
  glipizide: ['Diabetes', 'Type 2 Diabetes', 'Blood Sugar'],
  glyburide: ['Diabetes', 'Type 2 Diabetes', 'Blood Sugar'],
  sitagliptin: ['Diabetes', 'Type 2 Diabetes', 'Blood Sugar'],
  vildagliptin: ['Diabetes', 'Type 2 Diabetes', 'Blood Sugar'],
  
  // Blood Pressure / Cardiac medications
  amlodipine: ['Hypertension', 'High Blood Pressure', 'Cardiac Condition'],
  norvasc: ['Hypertension', 'High Blood Pressure', 'Cardiac Condition'],
  atenolol: ['Hypertension', 'Heart Condition', 'Arrhythmia'],
  tenormin: ['Hypertension', 'Heart Condition', 'Arrhythmia'],
  lisinopril: ['Hypertension', 'Heart Failure', 'Kidney Protection'],
  zestril: ['Hypertension', 'Heart Failure', 'Cardiac Condition'],
  losartan: ['Hypertension', 'High Blood Pressure', 'Cardiac Protection'],
  cozaar: ['Hypertension', 'High Blood Pressure', 'Cardiac Protection'],
  valsartan: ['Hypertension', 'Heart Failure', 'Cardiac Condition'],
  diovan: ['Hypertension', 'Heart Failure', 'Cardiac Condition'],
  metoprolol: ['Hypertension', 'Heart Condition', 'Arrhythmia'],
  betaloc: ['Hypertension', 'Heart Condition', 'Arrhythmia'],
  carvedilol: ['Hypertension', 'Heart Failure', 'Cardiac Condition'],
  rampril: ['Hypertension', 'Heart Failure', 'Kidney Protection'],
  
  // Cholesterol medications
  atorvastatin: ['High Cholesterol', 'Cardiovascular Disease', 'Hyperlipidemia'],
  lipitor: ['High Cholesterol', 'Cardiovascular Disease', 'Hyperlipidemia'],
  rosuvastatin: ['High Cholesterol', 'Cardiovascular Risk', 'Hyperlipidemia'],
  crestor: ['High Cholesterol', 'Cardiovascular Risk', 'Hyperlipidemia'],
  simvastatin: ['High Cholesterol', 'Cardiovascular Disease', 'Hyperlipidemia'],
  zocor: ['High Cholesterol', 'Cardiovascular Disease', 'Hyperlipidemia'],
  pravastatin: ['High Cholesterol', 'Cardiovascular Disease', 'Hyperlipidemia'],
  
  // Gastrointestinal medications
  omeprazole: ['Gastritis', 'GERD', 'Acid Reflux', 'Peptic Ulcer'],
  losec: ['Gastritis', 'GERD', 'Acid Reflux', 'Peptic Ulcer'],
  pantoprazole: ['Gastritis', 'Peptic Ulcer', 'Acid Reflux', 'GERD'],
  pan: ['Gastritis', 'Acid Reflux', 'GERD'],
  esomeprazole: ['Gastritis', 'GERD', 'Acid Reflux', 'Peptic Ulcer'],
  nexium: ['Gastritis', 'GERD', 'Acid Reflux', 'Peptic Ulcer'],
  ranitidine: ['Acid Reflux', 'GERD', 'Stomach Acid'],
  zantac: ['Acid Reflux', 'GERD', 'Stomach Acid'],
  famotidine: ['Acid Reflux', 'GERD', 'Stomach Acid'],
  domperidone: ['Nausea', 'Gastritis', 'Digestive Issues'],
  motilium: ['Nausea', 'Gastritis', 'Digestive Issues'],
  ondansetron: ['Nausea', 'Vomiting', 'Post-operative Nausea'],
  zofran: ['Nausea', 'Vomiting', 'Post-operative Nausea'],
  
  // Thyroid medications
  levothyroxine: ['Hypothyroidism', 'Thyroid Disorder', 'Metabolic Issue'],
  thyronorm: ['Hypothyroidism', 'Thyroid Disorder', 'Metabolic Issue'],
  eltroxin: ['Hypothyroidism', 'Thyroid Disorder', 'Metabolic Issue'],
  synthroid: ['Hypothyroidism', 'Thyroid Disorder', 'Metabolic Issue'],
  
  // Respiratory medications
  salbutamol: ['Asthma', 'Bronchospasm', 'Breathing Difficulty'],
  ventolin: ['Asthma', 'Bronchospasm', 'Breathing Difficulty'],
  asthalin: ['Asthma', 'Bronchospasm', 'Breathing Difficulty'],
  asthmac: ['Asthma', 'Bronchospasm', 'Breathing Difficulty'],
  budesonide: ['Asthma', 'Respiratory Inflammation', 'COPD'],
  inhaler: ['Asthma', 'Breathing Difficulty'],
  
  // Pain/Inflammation medications
  paracetamol: ['Pain', 'Fever', 'General Discomfort'],
  acetaminophen: ['Pain', 'Fever', 'General Discomfort'],
  crocin: ['Pain', 'Fever', 'General Discomfort'],
  dolo: ['Pain', 'Fever', 'General Discomfort'],
  ibuprofen: ['Inflammation', 'Pain', 'Fever'],
  brufen: ['Inflammation', 'Pain', 'Fever'],
  combiflam: ['Inflammation', 'Pain', 'Fever'],
  aspirin: ['Pain', 'Fever', 'Cardiovascular Prevention'],
  disprin: ['Pain', 'Fever', 'Cardiovascular Prevention'],
  diclofenac: ['Inflammation', 'Pain', 'Arthritis'],
  voveran: ['Inflammation', 'Pain', 'Arthritis'],
  naproxen: ['Inflammation', 'Pain', 'Arthritis'],
  tramadol: ['Severe Pain', 'Chronic Pain', 'Pain Management'],
  ultragel: ['Pain', 'Inflammation'],
  
  // Antibiotics
  amoxicillin: ['Bacterial Infection', 'Respiratory Infection', 'UTI'],
  augmentin: ['Bacterial Infection', 'Respiratory Infection'],
  azithromycin: ['Bacterial Infection', 'Respiratory Infection', 'STI'],
  zithromax: ['Bacterial Infection', 'Respiratory Infection'],
  azee: ['Bacterial Infection', 'Respiratory Infection'],
  ciprofloxacin: ['Bacterial Infection', 'UTI', 'Respiratory Infection'],
  ciproflox: ['Bacterial Infection', 'UTI'],
  cefixime: ['Bacterial Infection', 'UTI', 'Respiratory Infection'],
  omnatax: ['Bacterial Infection', 'Respiratory Infection'],
  ofloxacin: ['Bacterial Infection', 'UTI', 'Eye Infection'],
  
  // Allergy medications
  cetirizine: ['Allergies', 'Allergic Rhinitis', 'Histamine Reaction'],
  cetzine: ['Allergies', 'Allergic Rhinitis', 'Histamine Reaction'],
  loratadine: ['Allergies', 'Allergic Rhinitis', 'Histamine Reaction'],
  claritin: ['Allergies', 'Allergic Rhinitis', 'Histamine Reaction'],
  allegra: ['Allergies', 'Allergic Rhinitis', 'Histamine Reaction'],
  fexofenadine: ['Allergies', 'Allergic Rhinitis', 'Histamine Reaction'],
  montelukast: ['Allergies', 'Asthma', 'Respiratory Allergy'],
  montair: ['Allergies', 'Asthma', 'Respiratory Allergy'],
  
  // Mental Health medications
  gabapentin: ['Neuropathic Pain', 'Seizures', 'Nerve Pain'],
  neurontin: ['Neuropathic Pain', 'Seizures', 'Nerve Pain'],
  sertraline: ['Depression', 'Anxiety', 'Mental Health'],
  serlift: ['Depression', 'Anxiety', 'Mental Health'],
  fluoxetine: ['Depression', 'Anxiety', 'OCD'],
  prozac: ['Depression', 'Anxiety', 'OCD'],
  oxitriptal: ['Depression', 'Anxiety', 'Mental Health'],
  clonazepam: ['Anxiety', 'Seizures', 'Panic Disorder'],
  clonotril: ['Anxiety', 'Seizures', 'Panic Disorder'],
  alprazolam: ['Anxiety', 'Panic Disorder'],
  xanax: ['Anxiety', 'Panic Disorder'],
  etizolaam: ['Anxiety', 'Panic Disorder'],
  
  // Nutritional supplements
  multivitamin: ['Nutritional Deficiency', 'General Health', 'Vitamin Deficiency'],
  b_complex: ['Nutritional Deficiency', 'Vitamin B Deficiency'],
  vitamin_d: ['Vitamin D Deficiency', 'Bone Health'],
  calcium: ['Calcium Deficiency', 'Bone Health'],
  iron: ['Iron Deficiency', 'Anemia'],
  ferric_iron: ['Iron Deficiency', 'Anemia'],
  
  // Neurological/Pain medications
  pregabalin: ['Neuropathic Pain', 'Anxiety', 'Epilepsy'],
  lyrica: ['Neuropathic Pain', 'Anxiety', 'Epilepsy'],
  methylcobalamin: ['Neuropathy', 'Vitamin B12 Deficiency', 'Nerve Health'],
  mefenamic_acid: ['Pain', 'Menstrual Pain', 'Inflammation'],
  meftal: ['Pain', 'Menstrual Pain', 'Inflammation'],
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

function analyzeSymptoms(symptoms, triageResult, prescriptionText) {
  const normalizedSymptoms = (symptoms || '').toLowerCase();
  const normalizedPrescription = (prescriptionText || '').toLowerCase();
  const detectedSymptoms = [];
  const conditions = new Set();
  let totalRiskScore = 0;
  let riskReasons = [];
  let prescriptionConditions = [];

  const symptomVariations = {
    fever: ['fever', 'febrile', 'high temperature', 'elevated temperature', 'feverish'],
    cough: ['cough', 'coughing', 'dry cough', 'wet cough'],
    headache: ['headache', 'head pain', 'head ache', 'migraine'],
    chest_pain: ['chest pain', 'chest discomfort', 'heart pain', 'tight chest'],
    breathing: ['breathing', 'breathlessness', 'shortness of breath', 'difficulty breathing', 'dyspnea'],
    stomach_pain: ['stomach pain', 'stomach ache', 'abdominal pain', 'belly pain', 'tummy ache'],
    nausea: ['nausea', 'nauseous', 'feeling sick'],
    vomiting: ['vomiting', 'throwing up', 'being sick'],
    fatigue: ['fatigue', 'tired', 'exhausted', 'lethargy', 'tiredness', 'weakness'],
    dizziness: ['dizziness', 'dizzy', 'lightheaded', 'vertigo'],
    sore_throat: ['sore throat', 'throat pain', 'scratchy throat', 'pharyngitis'],
    body_ache: ['body ache', 'body pain', 'muscle ache', 'muscle pain', 'aching'],
    diarrhea: ['diarrhea', 'loose stool', 'watery stool'],
    rash: ['rash', 'skin rash', 'skin eruption', 'hives'],
    swelling: ['swelling', 'swollen', 'edema'],
    back_pain: ['back pain', 'backache', 'lower back pain'],
    anxiety: ['anxiety', 'anxious', 'nervous', 'worried', 'panic'],
    stress: ['stress', 'stressed', 'overwhelmed'],
  };

  for (const [baseKeyword, variations] of Object.entries(symptomVariations)) {
    for (const variation of variations) {
      const textToSearch = normalizedSymptoms + ' ' + normalizedPrescription;
      if (textToSearch.includes(variation)) {
        if (!detectedSymptoms.includes(baseKeyword)) {
          detectedSymptoms.push(baseKeyword);
        }
        const riskInfo = symptomRiskMapping[baseKeyword];
        if (riskInfo && !riskReasons.includes(riskInfo.reason)) {
          totalRiskScore += riskInfo.weight;
          riskReasons.push(riskInfo.reason);
        }
        const conditionList = symptomConditionMapping[baseKeyword];
        if (conditionList) {
          conditionList.forEach(c => conditions.add(c));
        }
        break;
      }
    }
  }

  for (const [keyword, info] of Object.entries(symptomRiskMapping)) {
    const keywordFormatted = keyword.replace(/_/g, ' ');
    const textToSearch = normalizedSymptoms + ' ' + normalizedPrescription;
    if (textToSearch.includes(keywordFormatted)) {
      if (!detectedSymptoms.includes(keyword)) {
        detectedSymptoms.push(keyword);
      }
      if (!riskReasons.includes(info.reason)) {
        totalRiskScore += info.weight;
        riskReasons.push(info.reason);
      }
    }
  }

  if (normalizedPrescription.length > 0) {
    console.log('[ClinicalLogic] Analyzing prescription text:', normalizedPrescription.substring(0, 200));

    // More robust medicine matching - case insensitive and handles variations
    for (const [medicine, relatedConditions] of Object.entries(prescriptionConditionMapping)) {
      const medicineLower = medicine.toLowerCase();
      const medicineVariations = [medicineLower];
      
      // Add common variations
      if (medicineLower.includes('_')) {
        medicineVariations.push(medicineLower.replace(/_/g, ' '));
        medicineVariations.push(medicineLower.replace(/_/g, '-'));
      }
      
      // Check if any variation matches (case-insensitive)
      const found = medicineVariations.some(v => {
        return normalizedPrescription.includes(v) || 
               normalizedPrescription.includes(v.replace(/-/g, ' '));
      });
      
      if (found) {
        relatedConditions.forEach(c => {
          conditions.add(c);
          prescriptionConditions.push(c);
        });
        console.log('[ClinicalLogic] Found medicine:', medicine, '->', relatedConditions.join(', '));
      }
    }

    // Known conditions in prescription text
    const knownConditions = [
      'diabetes', 'hypertension', 'thyroid', 'asthma', 'depression', 
      'anxiety', 'arthritis', 'cholesterol', 'cancer', 'heart disease',
      'hypothyroidism', 'hyperthyroidism', 'gerd', 'gastritis', 'ulcer',
      'anemia', 'bronchitis', 'pneumonia', 'migraine', 'neuropathy',
      'insomnia', 'constipation', 'diarrhea', 'jaundice', 'hepatitis'
    ];
    for (const condition of knownConditions) {
      if (normalizedPrescription.includes(condition)) {
        const condName = condition.charAt(0).toUpperCase() + condition.slice(1);
        conditions.add(condName);
        prescriptionConditions.push(condName);
        console.log('[ClinicalLogic] Found condition:', condName);
      }
    }
    
    // Check for dosage patterns that indicate chronic conditions
    const chronicPatterns = [
      { pattern: /daily|every day|od\b/i, conditions: ['Chronic Condition', 'Long-term Treatment'] },
      { pattern: /twice daily|bd|bid/i, conditions: ['Chronic Condition', 'Long-term Treatment'] },
      { pattern: /take at bedtime|hs|nocte/i, conditions: ['Chronic Condition', 'Long-term Treatment'] },
      { pattern: /chronic|ongoing|long.term/i, conditions: ['Chronic Condition', 'Long-term Treatment'] },
    ];
    
    for (const { pattern, conditions: condList } of chronicPatterns) {
      if (pattern.test(normalizedPrescription)) {
        condList.forEach(c => {
          conditions.add(c);
          prescriptionConditions.push(c);
        });
        console.log('[ClinicalLogic] Found chronic condition indicator');
        break;
      }
    }
  }

  if (conditions.size === 0) {
    if (normalizedSymptoms.length > 10) {
      conditions.add('General Illness');
      conditions.add('Viral Infection');
      conditions.add('Flu');
    } else {
      conditions.add('Unspecified Condition');
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

  if (prescriptionConditions.length > 0) {
    totalRiskScore += prescriptionConditions.length;
    if (totalRiskScore >= 5 && riskLevel === 'low') {
      riskLevel = 'moderate';
    }
  }

  const conditionArray = Array.from(conditions).slice(0, 3);
  
  return {
    detectedSymptoms,
    conditions: conditionArray,
    riskLevel,
    totalRiskScore,
    riskReasons,
    prescriptionConditions: [...new Set(prescriptionConditions)]
  };
}

function generateClinicalReasoning(symptoms, analysis) {
  const { detectedSymptoms, conditions, riskLevel, riskReasons, totalRiskScore } = analysis;
  
  if (detectedSymptoms.length === 0) {
    return 'The symptoms provided have been analyzed. Based on the symptom pattern, common conditions may include viral infections, common cold, or general fatigue. Further medical evaluation is recommended for accurate diagnosis.';
  }

  const symptomList = detectedSymptoms.map(s => s.replace(/_/g, ' ')).join(', ');
  
  let reasoning = `Analysis of symptoms: ${symptomList}. `;
  
  if (riskReasons.length > 0) {
    reasoning += riskReasons[0] + '.';
    if (riskReasons.length > 1) {
      reasoning += ` Additional concerns include ${riskReasons.slice(1).join(', ')}.`;
    }
  }
  
  if (conditions.length > 0) {
    reasoning += ` Based on the symptom pattern, possible conditions include: ${conditions.slice(0, 3).join(', ')}.`;
  }
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    reasoning += ` These symptoms require prompt medical attention.`;
  } else if (riskLevel === 'moderate') {
    reasoning += ` Medical consultation is recommended within 24-48 hours.`;
  } else {
    reasoning += ` Monitor symptoms and consider rest and hydration.`;
  }
  
  return reasoning;
}

function generateRiskExplanation(riskLevel, analysis) {
  const { detectedSymptoms, riskReasons, totalRiskScore } = analysis;
  
  const symptomText = detectedSymptoms.length > 0 
    ? `Symptoms analyzed: ${detectedSymptoms.map(s => s.replace(/_/g, ' ')).join(', ')}.` 
    : 'Symptoms analyzed based on patient report.';
  
  const explanations = {
    critical: `${symptomText} Critical risk level assigned due to high-severity symptoms detected. ${riskReasons[0] || 'Immediate emergency medical care is required.'} Symptom severity score: ${totalRiskScore}/30.`,
    high: `${symptomText} High risk level due to concerning symptoms that require prompt medical evaluation. ${riskReasons[0] || 'Please consult a doctor soon.'} Symptom severity score: ${totalRiskScore}/30.`,
    moderate: `${symptomText} Moderate risk level indicates symptoms that warrant medical attention but are not immediately life-threatening. ${riskReasons[0] || 'Monitor your symptoms.'} Symptom severity score: ${totalRiskScore}/30.`,
    low: `${symptomText} Low risk level suggests minor symptoms that may resolve with rest and self-care. ${riskReasons[0] || 'Continue monitoring.'} Symptom severity score: ${totalRiskScore}/30.`
  };
  
  return explanations[riskLevel] || explanations.moderate;
}

function generateSummary(riskLevel, conditions, symptoms) {
  if (!conditions || conditions.length === 0) {
    return 'Your symptoms have been analyzed. Medical consultation is recommended for proper diagnosis and treatment.';
  }
  
  const condText = conditions.slice(0, 2).join(' or ');
  
  const summaries = {
    critical: `Based on your symptoms, there is a potential for a serious condition. ${condText} are among the possible diagnoses. Immediate medical attention is required.`,
    high: `Your symptoms suggest a concerning health issue. ${condText} are among the possible conditions. Urgent medical evaluation is recommended within 24 hours.`,
    moderate: `Your symptoms indicate a moderate health concern. ${condText} may be causing your symptoms. Medical consultation is advised within 2-3 days.`,
    low: `Your symptoms appear to indicate a minor condition. ${condText} could be the cause. Rest, hydration, and monitoring are recommended.`
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
  const aiConfidence = typeof hasAiConfidence === 'number' && hasAiConfidence > 0.4 && hasAiConfidence <= 1;
  
  let baseConfidence = 0.5;
  
  const symptomBonus = Math.min(analysis.detectedSymptoms.length * 0.05, 0.2);
  baseConfidence += symptomBonus;
  
  const conditionBonus = analysis.conditions && analysis.conditions.length > 0 
    ? Math.min(analysis.conditions.length * 0.03, 0.1) 
    : 0;
  baseConfidence += conditionBonus;
  
  if (analysis.totalRiskScore >= 10) {
    baseConfidence += 0.1;
  }
  
  if (analysis.totalRiskScore >= 5) {
    baseConfidence += 0.05;
  }
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    baseConfidence += 0.05;
  }
  
  if (analysis.prescriptionConditions && analysis.prescriptionConditions.length > 0) {
    baseConfidence += 0.1;
  }
  
  const finalConfidence = Math.min(0.95, Math.max(0.4, baseConfidence));
  
  if (aiConfidence) {
    return (hasAiConfidence + finalConfidence) / 2;
  }
  
  return finalConfidence;
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

const KNOWN_MEDICINES = [
  // Diabetes
  'metformin', 'glucophage', 'glycomet', 'ciomet', 'insulin', 'humulin', 'mixtard', 'novomix',
  'glimepiride', 'amaryl', 'glipizide', 'glyburide', 'sitagliptin', 'januvia', 'vildagliptin',
  // Blood Pressure / Cardiac
  'amlodipine', 'norvasc', 'amlodin', 'amlip', 'atenolol', 'tenormin', 'lisinopril', 'zestril',
  'losartan', 'cozaar', 'losacar', 'valsartan', 'diovan', 'metoprolol', 'betaloc', 'metolar',
  'carvedilol', 'rampril', 'ramipril', 'enalapril', 'atenol', 'beta',
  // Cholesterol
  'atorvastatin', 'lipitor', 'atorva', 'lipikind', 'rosuvastatin', 'crestor', 'rosuvas', 'rozat',
  'simvastatin', 'zocor', 'simva', 'simbax', 'pravastatin',
  // Gastrointestinal
  'omeprazole', 'losec', 'omez', 'omed', 'pantoprazole', 'pan', 'pantocid', 'pantosec',
  'esomeprazole', 'nexium', 'esoz', 'sompraz', 'ranitidine', 'zantac', 'rantac', 'aciloc',
  'famotidine', 'domperidone', 'motilium', 'domstal', 'dompy', 'ondansetron', 'zofran', 'ondem', 'emese',
  'dicyclomine', 'cyclomin', 'spasmo', 'mefenamic', 'meftal', 'nimesulide', 'nise', 'nimulid',
  // Thyroid
  'levothyroxine', 'thyronorm', 'eltroxin', 'thyobuild',
  // Respiratory
  'salbutamol', 'ventolin', 'asthalin', 'asthmac', 'budesonide', 'pulmicort', 'budecort',
  'montelukast', 'singulair', 'montair', 'montukast', 'seretide', 'symbicort', 'duolin',
  // Pain / Anti-inflammatory
  'paracetamol', 'crocin', 'dolo', 'calpol', 'acetaminophen', 'ibuprofen', 'brufen', 'ibugard', 'advil',
  'aspirin', 'disprin', 'ecosprin', 'diclofenac', 'voveran', 'diclotal', 'cataflam',
  'tramadol', 'ultram', 'dolol', 'naproxen', 'etoricoxib', 'nurofen',
  // Antibiotics
  'amoxicillin', 'augmentin', 'mox', 'amoxil', 'azithromycin', 'zithromax', 'azee', 'azithral',
  'ciprofloxacin', 'cipro', 'cifran', 'ciplox', 'cefixime', 'omnatax', 'taxim-o', 'cefi',
  'doxycycline', 'monodox', 'erythromycin', 'roxithromycin', 'roxee', 'roxim', 'rox',
  'metronidazole', 'flagyl', 'metrogyl', 'metron', 'cephalexin', 'keflex', 'alex', 'cefax',
  // Allergy
  'cetirizine', 'cetzine', 'citriz', 'allercet', 'loratadine', 'claritin', 'loratin', 'lora',
  'desloratadine', 'deslor', 'fexofenadine', 'montemac', 'levocetirizine', 'lcz',
  // Mental Health
  'sertraline', 'zoloft', 'sertil', 'serlift', 'fluoxetine', 'prozac', 'fludac', 'oxedep',
  'alprazolam', 'xanax', 'alpra', 'zopic', 'clonazepam', 'rivotril', 'clonotril', 'klonopin',
  'escitalopram', 'cipralex', 'estomine', 'paroxetine', 'paxil', 'quetiapine', 'seroquel',
  // Steroids / Anti-inflammatory
  'prednisolone', 'prednisone', 'wysolone', 'dermacort', 'dexamethasone', 'decadron', 'dexona',
  // Diuretics
  'furosemide', 'lasix', 'frusemide', 'lasipad', 'spironolactone', 'aldactone', 'spilactone',
  // Neurological
  'gabapentin', 'neurontin', 'gabapin', 'gabantin', 'pregabalin', 'lyrica', 'pregabid',
  'topiramate', 'topamax', 'divolife', 'carbamazepine', 'tegretol', 'zeptol',
  // Supplements
  'multivitamin', 'shelcal', 'supradyn', 'becosules', 'calcium', 'caldige', 'magne',
  'vitamin d', 'cholecalciferol', 'uprise d3', 'd-rise', 'dycal',
  'ferrous', 'ferrous sulfate', 'fecontin', 'ferro', 'ferronyl', 'iron',
  'folic acid', 'folvite', 'folic', 'vitamin b12', 'cobalamin', 'neurobion',
  // Eye drops
  'latanoprost', 'xalatan', 'latan', 'timolol', 'timoptic', 'bromfenac', 'instacy',
  // Others
  'warfarin', 'coumadin', 'clopidogrel', 'plavix', 'hydrochlorothiazide', 'hctz', 'dytor',
  'tamsulosin', 'flomax', 'urinimax', 'sildenafil', 'viagra', 'silagra', 'caverta',
  'tadalafil', 'cialis', 'tadalis', 'allopurinol', 'zilfic', 'zyloric', 'urimax'
];

function extractMedicinesFromText(text) {
  if (!text || typeof text !== 'string') return [];
  
  const normalizedText = text.toLowerCase();
  const found = [];
  
  for (const med of KNOWN_MEDICINES) {
    const regex = new RegExp(`\\b${med}\\b`, 'i');
    if (regex.test(normalizedText)) {
      const capitalized = med.charAt(0).toUpperCase() + med.slice(1);
      if (!found.includes(capitalized)) {
        found.push(capitalized);
      }
    }
  }
  
  return found;
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
  extractMedicinesFromText,
  symptomConditionMapping,
  symptomRiskMapping,
  prescriptionConditionMapping
};
