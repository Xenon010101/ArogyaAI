const ICD10_DATA = require('../data/icd10.json');

function searchICD(query) {
  const q = query.toLowerCase();
  
  const results = ICD10_DATA.filter(item => 
    item.code.toLowerCase().includes(q) ||
    item.name.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q)
  );
  
  return results.slice(0, 20);
}

function getICDByCode(code) {
  return ICD10_DATA.find(item => item.code === code) || null;
}

function getICDByName(name) {
  const q = name.toLowerCase();
  return ICD10_DATA.find(item => item.name.toLowerCase() === q) || null;
}

function getICDsByCategory(category) {
  return ICD10_DATA.filter(item => 
    item.category.toLowerCase() === category.toLowerCase()
  );
}

function getICDsByChapter(chapter) {
  return ICD10_DATA.filter(item => 
    item.chapter && item.chapter.toLowerCase().includes(chapter.toLowerCase())
  );
}

function getRelatedSymptoms(icdCode) {
  const condition = getICDByCode(icdCode);
  if (!condition) return [];
  
  const relatedConditions = ICD10_DATA.filter(item => 
    item.category === condition.category &&
    item.code !== icdCode
  );
  
  return relatedConditions.slice(0, 10);
}

function getCategories() {
  const categories = [...new Set(ICD10_DATA.map(item => item.category))];
  return categories.sort();
}

function getChapters() {
  const chapters = [...new Set(ICD10_DATA.map(item => item.chapter).filter(Boolean))];
  return chapters.sort();
}

function fuzzySearch(query, maxResults = 10) {
  const q = query.toLowerCase();
  const results = ICD10_DATA
    .map(item => {
      let score = 0;
      
      const name = item.name.toLowerCase();
      const code = item.code.toLowerCase();
      
      if (name === q) score = 100;
      else if (name.startsWith(q)) score = 80;
      else if (name.includes(q)) score = 60;
      else if (code.startsWith(q)) score = 70;
      else if (code.includes(q)) score = 50;
      
      const words = q.split(' ');
      words.forEach(word => {
        if (word.length > 2 && name.includes(word)) score += 10;
      });
      
      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
  
  return results;
}

function matchSymptomsToICD(symptoms) {
  const matchedConditions = [];
  const symptomLower = symptoms.map(s => s.toLowerCase());
  
  for (const condition of ICD10_DATA) {
    let matchCount = 0;
    const matchedSymptoms = [];
    
    for (const symptom of symptomLower) {
      if (condition.name.toLowerCase().includes(symptom) ||
          condition.category.toLowerCase().includes(symptom)) {
        matchCount++;
        matchedSymptoms.push(symptom);
      }
    }
    
    if (matchCount > 0) {
      matchedConditions.push({
        ...condition,
        matchCount,
        matchedSymptoms
      });
    }
  }
  
  return matchedConditions
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 10);
}

function getConditionInfo(icdCode) {
  const condition = getICDByCode(icdCode);
  if (!condition) return null;
  
  return {
    ...condition,
    severityLevel: getSeverityLevel(condition.severity),
    specialistRecommendation: getSpecialist(condition),
    commonTests: getCommonTests(condition),
    commonTreatments: getCommonTreatments(condition)
  };
}

function getSeverityLevel(severity) {
  const levels = {
    emergency: 4,
    acute: 3,
    chronic: 2,
    routine: 1
  };
  return levels[severity] || 2;
}

function getSpecialist(condition) {
  const category = condition.category?.toLowerCase() || '';
  
  if (category.includes('cardiovascular') || category.includes('cardiac')) {
    return 'Cardiologist';
  }
  if (category.includes('respiratory')) {
    return 'Pulmonologist';
  }
  if (category.includes('gastrointestinal') || category.includes('hepatic') || category.includes('biliary') || category.includes('pancreatic')) {
    return 'Gastroenterologist';
  }
  if (category.includes('neurological')) {
    return 'Neurologist';
  }
  if (category.includes('endocrines')) {
    return 'Endocrinologist';
  }
  if (category.includes('dermatological')) {
    return 'Dermatologist';
  }
  if (category.includes('musculoskeletal') || category.includes('orthopedic')) {
    return 'Orthopedic Surgeon';
  }
  if (category.includes('renal') || category.includes('urological')) {
    return 'Nephrologist/Urologist';
  }
  if (category.includes('oncology') || category.includes('cancer')) {
    return 'Oncologist';
  }
  if (category.includes('gynecological')) {
    return 'Gynecologist';
  }
  if (category.includes('mental') || category.includes('psychiatric')) {
    return 'Psychiatrist';
  }
  if (category.includes('infectious') || category.includes('viral') || category.includes('bacterial')) {
    return 'Infectious Disease Specialist';
  }
  if (category.includes('blood')) {
    return 'Hematologist';
  }
  if (category.includes('eye') || category.includes('ophthalmological')) {
    return 'Ophthalmologist';
  }
  if (category.includes('ent') || category.includes('ear') || category.includes('nose')) {
    return 'ENT Specialist';
  }
  
  return 'General Physician';
}

function getCommonTests(condition) {
  const name = condition.name?.toLowerCase() || '';
  const category = condition.category?.toLowerCase() || '';
  
  const commonTests = [];
  
  if (category.includes('cardiovascular') || name.includes('heart') || name.includes('hypertension')) {
    commonTests.push('ECG', 'Echocardiogram', 'Lipid Profile', 'Blood Pressure Monitoring');
  }
  if (category.includes('diabetes') || name.includes('diabetes')) {
    commonTests.push('HbA1c', 'Fasting Blood Sugar', 'Postprandial Blood Sugar');
  }
  if (category.includes('respiratory') || name.includes('lung') || name.includes('asthma')) {
    commonTests.push('Chest X-Ray', 'Spirometry', 'Pulse Oximetry');
  }
  if (category.includes('gastrointestinal') || name.includes('stomach') || name.includes('liver')) {
    commonTests.push('Ultrasound', 'Endoscopy', 'Liver Function Tests');
  }
  if (category.includes('thyroid')) {
    commonTests.push('TSH', 'T3', 'T4', 'Thyroid Ultrasound');
  }
  if (category.includes('kidney') || name.includes('renal')) {
    commonTests.push('Serum Creatinine', 'BUN', 'Urine Analysis', 'GFR');
  }
  if (category.includes('blood') || name.includes('anemia')) {
    commonTests.push('Complete Blood Count', 'Hemoglobin', 'Iron Studies');
  }
  
  if (commonTests.length === 0) {
    commonTests.push('Basic Metabolic Panel', 'Complete Blood Count');
  }
  
  return [...new Set(commonTests)];
}

function getCommonTreatments(condition) {
  const category = condition.category?.toLowerCase() || '';
  const treatments = [];
  
  if (category.includes('cardiovascular')) {
    treatments.push('Lifestyle modifications', 'Cardiac medications', 'Regular monitoring');
  }
  if (category.includes('diabetes')) {
    treatments.push('Blood sugar monitoring', 'Diet control', 'Oral medications or insulin');
  }
  if (category.includes('respiratory')) {
    treatments.push('Inhalers', 'Breathing exercises', 'Avoid triggers');
  }
  if (category.includes('infection')) {
    treatments.push('Antibiotics or antivirals', 'Rest', 'Hydration');
  }
  if (category.includes('pain') || category.includes('musculoskeletal')) {
    treatments.push('Pain management', 'Physical therapy', 'Anti-inflammatory medications');
  }
  
  return treatments;
}

module.exports = {
  searchICD,
  getICDByCode,
  getICDByName,
  getICDsByCategory,
  getICDsByChapter,
  getRelatedSymptoms,
  getCategories,
  getChapters,
  fuzzySearch,
  matchSymptomsToICD,
  getConditionInfo,
  ICD10_DATA
};
