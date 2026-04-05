const Medicine = require('../models/Medicine');
const DrugInteraction = require('../models/DrugInteraction');
const rxnormService = require('./rxnormService');
const openFdaService = require('./openFdaService');

async function findMedicineInDB(name) {
  const normalizedName = name.toLowerCase().trim();
  
  const medicine = await Medicine.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${normalizedName}$`, 'i') } },
      { genericName: { $regex: new RegExp(`^${normalizedName}$`, 'i') } },
      { brandNames: { $regex: new RegExp(`^${normalizedName}$`, 'i') } }
    ]
  });
  
  return medicine;
}

async function findOrCreateMedicine(name) {
  let medicine = await findMedicineInDB(name);
  
  if (medicine) {
    return medicine;
  }
  
  console.log('[DrugInteraction] Medicine not in DB, searching RxNorm for:', name);
  
  try {
    const results = await rxnormService.searchDrugs(name);
    
    if (results.length > 0) {
      const rxnorm = results[0];
      
      const brands = await rxnormService.getDrugBrands(rxnorm.rxcui);
      
      medicine = await Medicine.create({
        rxcui: rxnorm.rxcui,
        name: rxnorm.name,
        genericName: rxnorm.genericName,
        brandNames: brands,
        category: 'Unknown',
        source: 'rxnorm',
        syncedAt: new Date()
      });
      
      console.log('[DrugInteraction] Created medicine from RxNorm:', medicine.name);
      return medicine;
    }
  } catch (error) {
    console.error('[DrugInteraction] RxNorm search error:', error.message);
  }
  
  medicine = await Medicine.create({
    name: name,
    genericName: name,
    brandNames: [],
    category: 'Unknown',
    source: 'custom',
    isIndianBrand: true
  });
  
  console.log('[DrugInteraction] Created custom medicine:', medicine.name);
  return medicine;
}

async function checkDrugInteractions(drugNames) {
  console.log('[DrugInteraction] Checking interactions for:', drugNames);
  
  const medicines = [];
  
  for (const name of drugNames) {
    const medicine = await findOrCreateMedicine(name);
    if (medicine) {
      medicines.push(medicine);
    }
  }
  
  if (medicines.length < 2) {
    return {
      hasInteractions: false,
      interactions: [],
      checkedMedicines: medicines.map(m => m.name)
    };
  }
  
  const interactions = [];
  
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const drug1 = medicines[i];
      const drug2 = medicines[j];
      
      const existingInteraction = await DrugInteraction.findOne({
        $or: [
          { drug1: drug1._id, drug2: drug2._id },
          { drug1: drug2._id, drug2: drug1._id }
        ]
      });
      
      if (existingInteraction) {
        interactions.push({
          drug1: drug1.name,
          drug2: drug2.name,
          severity: existingInteraction.severity,
          description: existingInteraction.description,
          recommendation: existingInteraction.recommendation,
          source: existingInteraction.source
        });
      } else {
        interactions.push({
          drug1: drug1.name,
          drug2: drug2.name,
          severity: 'unknown',
          description: 'No known interaction documented in database.',
          recommendation: 'Generally safe to use together. Monitor for any unusual effects.',
          source: 'none'
        });
      }
    }
  }
  
  const highSeverityInteractions = interactions.filter(i => i.severity === 'high');
  const moderateSeverityInteractions = interactions.filter(i => i.severity === 'moderate');
  
  return {
    hasInteractions: interactions.length > 0,
    hasHighSeverity: highSeverityInteractions.length > 0,
    hasModerateSeverity: moderateSeverityInteractions.length > 0,
    interactions,
    highSeverityCount: highSeverityInteractions.length,
    moderateSeverityCount: moderateSeverityInteractions.length,
    checkedMedicines: medicines.map(m => m.name),
    summary: generateInteractionSummary(interactions)
  };
}

function generateInteractionSummary(interactions) {
  const highCount = interactions.filter(i => i.severity === 'high').length;
  const moderateCount = interactions.filter(i => i.severity === 'moderate').length;
  const lowCount = interactions.filter(i => i.severity === 'low').length;
  const unknownCount = interactions.filter(i => i.severity === 'unknown').length;
  
  let summary = '';
  
  if (highCount > 0) {
    summary += `${highCount} high-severity interaction(s) detected. `;
  }
  if (moderateCount > 0) {
    summary += `${moderateCount} moderate-severity interaction(s) detected. `;
  }
  if (lowCount > 0) {
    summary += `${lowCount} low-risk interaction(s) detected. `;
  }
  if (unknownCount > 0 && highCount === 0 && moderateCount === 0) {
    summary += 'No known interactions documented. Generally considered safe.';
  }
  
  return summary.trim() || 'No significant interactions detected.';
}

async function addDrugInteraction(drug1Name, drug2Name, severity, description, recommendation, source = 'custom') {
  const drug1 = await findOrCreateMedicine(drug1Name);
  const drug2 = await findOrCreateMedicine(drug2Name);
  
  const interaction = await DrugInteraction.create({
    drug1: drug1._id,
    drug2: drug2._id,
    drug1Name: drug1.name,
    drug2Name: drug2.name,
    severity,
    description,
    recommendation,
    source,
    verified: true
  });
  
  console.log('[DrugInteraction] Added interaction between', drug1Name, 'and', drug2Name);
  return interaction;
}

async function getIndianMedicines() {
  const medicines = await Medicine.find({ isIndianBrand: true })
    .sort({ name: 1 })
    .limit(100);
  
  return medicines;
}

async function linkIndianMedicineToRxNorm(indianName, rxcui) {
  const rxnormDrug = await rxnormService.getDrugByRxCUI(rxcui);
  if (!rxnormDrug) {
    throw new Error('RxNorm drug not found');
  }
  
  const brands = await rxnormService.getDrugBrands(rxcui);
  
  const medicine = await Medicine.findOneAndUpdate(
    { name: { $regex: new RegExp(`^${indianName}$`, 'i') } },
    {
      rxcui: rxcui,
      genericName: rxnormDrug.genericName,
      brandNames: brands,
      linkedRxcui: rxcui,
      isIndianBrand: true,
      source: 'hybrid',
      syncedAt: new Date()
    },
    { new: true, upsert: true }
  );
  
  console.log('[DrugInteraction] Linked', indianName, 'to RxNorm:', rxnormDrug.name);
  return medicine;
}

async function getMedicineInfo(name) {
  const medicine = await findOrCreateMedicine(name);
  
  if (!medicine) {
    return null;
  }
  
  const info = {
    name: medicine.name,
    genericName: medicine.genericName,
    brandNames: medicine.brandNames,
    category: medicine.category,
    source: medicine.source,
    fdaRecall: medicine.fdaRecall
  };
  
  if (medicine.rxcui) {
    try {
      const [label, adverseEvents, recalls] = await Promise.all([
        openFdaService.getDrugLabel(medicine.rxcui),
        openFdaService.getAdverseEvents(medicine.rxcui, 5),
        openFdaService.checkRecalls(medicine.rxcui)
      ]);
      
      if (label) {
        info.label = {
          indications: label.indications,
          warnings: label.warnings,
          contraindications: label.contraindications,
          sideEffects: label.adverseReactions
        };
      }
      
      if (recalls.hasRecall) {
        info.recalls = recalls.recalls;
      }
    } catch (error) {
      console.warn('[DrugInteraction] Could not fetch FDA data:', error.message);
    }
  }
  
  return info;
}

const COMMON_INTERACTIONS = [
  {
    drug1: 'warfarin',
    drug2: 'aspirin',
    severity: 'high',
    description: 'Increased risk of bleeding when anticoagulants are combined with antiplatelet drugs.',
    recommendation: 'Monitor INR closely. Use only under medical supervision.'
  },
  {
    drug1: 'metformin',
    drug2: 'alcohol',
    severity: 'moderate',
    description: 'Alcohol can increase the risk of lactic acidosis with metformin.',
    recommendation: 'Limit alcohol consumption while taking metformin.'
  },
  {
    drug1: 'lisinopril',
    drug2: 'potassium',
    severity: 'moderate',
    description: 'ACE inhibitors can increase potassium levels. Additional potassium may cause hyperkalemia.',
    recommendation: 'Monitor potassium levels regularly.'
  },
  {
    drug1: 'simvastatin',
    drug2: 'grapefruit',
    severity: 'moderate',
    description: 'Grapefruit can increase statin levels, increasing risk of muscle damage.',
    recommendation: 'Avoid grapefruit juice while taking simvastatin.'
  },
  {
    drug1: 'amlodipine',
    drug2: 'simvastatin',
    severity: 'moderate',
    description: 'Amlodipine can increase simvastatin levels.',
    recommendation: 'Limit simvastatin dose to 20mg daily when used with amlodipine.'
  },
  {
    drug1: 'ciprofloxacin',
    drug2: 'antacids',
    severity: 'moderate',
    description: 'Antacids reduce ciprofloxacin absorption, making it less effective.',
    recommendation: 'Take ciprofloxacin 2 hours before or 6 hours after antacids.'
  },
  {
    drug1: 'levothyroxine',
    drug2: 'calcium',
    severity: 'low',
    description: 'Calcium can reduce levothyroxine absorption.',
    recommendation: 'Take levothyroxine 4 hours apart from calcium supplements.'
  },
  {
    drug1: 'metformin',
    drug2: 'contrast dye',
    severity: 'high',
    description: 'Risk of lactic acidosis when metformin is used with iodinated contrast.',
    recommendation: 'Stop metformin before contrast procedures. Restart 48 hours after if kidney function is normal.'
  }
];

async function initializeCommonInteractions() {
  console.log('[DrugInteraction] Initializing common drug interactions...');
  
  for (const interaction of COMMON_INTERACTIONS) {
    const existing = await DrugInteraction.findOne({
      drug1Name: { $regex: new RegExp(`^${interaction.drug1}$`, 'i') },
      drug2Name: { $regex: new RegExp(`^${interaction.drug2}$`, 'i') }
    });
    
    if (!existing) {
      const drug1 = await findOrCreateMedicine(interaction.drug1);
      const drug2 = await findOrCreateMedicine(interaction.drug2);
      
      await DrugInteraction.create({
        drug1: drug1._id,
        drug2: drug2._id,
        drug1Name: drug1.name,
        drug2Name: drug2.name,
        severity: interaction.severity,
        description: interaction.description,
        recommendation: interaction.recommendation,
        source: 'clinical',
        verified: true
      });
    }
  }
  
  console.log('[DrugInteraction] Common interactions initialized');
}

module.exports = {
  checkDrugInteractions,
  addDrugInteraction,
  getIndianMedicines,
  linkIndianMedicineToRxNorm,
  getMedicineInfo,
  findMedicineInDB,
  findOrCreateMedicine,
  initializeCommonInteractions
};
